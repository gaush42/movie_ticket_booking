const { Cashfree } = require('cashfree-pg');
const Booking = require('../models/bookingModel')
const Showtime = require('../models/showtimeModel')
const { sendPassEmail } = require('../utils/emailSender')
require("dotenv").config()

// Initialize Cashfree
const cashfree = new Cashfree(Cashfree.SANDBOX, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY)

const createBookingOrder = async (req, res, next) => {
  try {
    const userId = req.userId // set by verifyJWT middleware
    const userEmail = req.email // assuming this is set by middleware
    const { showtimeId, seats } = req.body

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Showtime and seats are required' })
    }

    const showtime = await Showtime.findById(showtimeId)
      .populate({
        path: 'screen',
        populate: { path: 'theater' }
      })
      .populate('movie')

    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' })
    }

    // Check if seats are already booked
    const alreadyBooked = seats.some(seat => showtime.bookedSeats.includes(seat))
    if (alreadyBooked) {
      return res.status(409).json({ message: 'One or more seats already booked' })
    }

    const totalPrice = seats.length * showtime.ticketPrice
    const orderId = `booking_${Date.now()}_${userId}`

    // Create Cashfree order
    const request = {
      order_id: orderId,
      order_amount: totalPrice,
      order_currency: "INR",
      customer_details: {
        customer_id: `user_${userId}`,
        customer_email: userEmail,
        customer_phone: "9999999999" // You might want to get this from user profile
      },
      order_meta: {
        return_url: `https://movie-j183.onrender.com/pass.html?orderId=${orderId}`,
        notify_url: `https://movie-j183.onrender.com/api/booking/booking-webhook`,
        payment_methods: "cc,dc,upi"
      }
    };

    const response = await cashfree.PGCreateOrder(request);

    // Create pending booking record
    const booking = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats,
      totalPrice,
      orderId,
      paymentSessionId: response.data.payment_session_id,
      status: 'PENDING'
    })

    res.status(201).json({
      message: 'Payment order created',
      paymentSessionId: response.data.payment_session_id,
      orderId,
      bookingId: booking._id,
      amount: totalPrice
    })

  } catch (err) {
    console.error('Create booking order error:', err)
    next(err)
  }
}

const handleBookingWebhook = async (req, res) => {
  try {

    const orderId = req.body.data.order.order_id;
    const paymentStatus = req.body.data.payment.payment_status;

    console.log(`Booking Order ID: ${orderId}, Payment Status: ${paymentStatus}`);

    // Find the booking
    const booking = await Booking.findOne({ orderId })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theater' } }
        ]
      })
      .populate('user')

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Idempotency check
    if (booking.status === 'CONFIRMED' || booking.status === 'FAILED') {
      console.log("🚫 Booking already processed, skipping update.");
      return res.status(200).json({ success: true, message: "Already processed" });
    }

    if (paymentStatus === 'SUCCESS') {
      // Update booking status
      booking.status = 'CONFIRMED';
      await booking.save();

      // Reserve the seats in showtime
      const showtime = await Showtime.findById(booking.showtime._id)
      showtime.bookedSeats.push(...booking.seats)
      await showtime.save()

      // Send confirmation email with ticket
      await sendBookingConfirmationEmail(booking)

      console.log(`✅ Booking confirmed for order: ${orderId}`)
      return res.json({ success: true, message: "Booking confirmed successfully!" });

    } else if (paymentStatus === 'FAILED') {
      booking.status = 'FAILED';
      await booking.save();

      console.log(`❌ Booking failed for order: ${orderId}`)
      return res.json({ success: true, message: "Payment failed, booking cancelled." });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Booking Webhook Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to send booking confirmation email
const sendBookingConfirmationEmail = async (booking) => {
  try {
    const showtime = booking.showtime
    const movie = showtime.movie
    const screen = showtime.screen
    const theater = screen.theater

    const formattedDate = new Date(showtime.startTime).toLocaleString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })

    const html = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        h2 { color: #c0392b; }
        p { margin: 8px 0; font-size: 16px; }
        strong { color: #2c3e50; }
        .ticket-box {
          border: 2px dashed #c0392b;
          padding: 20px;
          max-width: 500px;
          margin: auto;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .success-banner {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          text-align: center;
        }
      </style>

      <div class="success-banner">
        <h3>🎉 Booking Confirmed!</h3>
        <p>Your payment was successful and your seats have been reserved.</p>
      </div>

      <div class="ticket-box">
        <h2>🎟 Movie Ticket</h2>
        <p><strong>Movie:</strong> ${movie.title}</p>
        <p><strong>Theater:</strong> ${theater.theaterName} (${theater.city})</p>
        <p><strong>Screen:</strong> ${screen.name}</p>
        <p><strong>Showtime:</strong> ${formattedDate}</p>
        <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
        <p><strong>Amount Paid:</strong> ₹${booking.totalPrice}</p>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
        <p><strong>Order ID:</strong> ${booking.orderId}</p>
      </div>
      
      <p style="margin-top: 20px; text-align: center; color: #666;">
        Please arrive at the theater at least 15 minutes before the show time.
      </p>
    `

    await sendPassEmail(booking.user.email, '🎟 Booking Confirmed - Your Movie Ticket', html)
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
}

const getBookingStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const userId = req.userId

    const booking = await Booking.findOne({ orderId, user: userId })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theater' } }
        ]
      })

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    res.json({
      bookingId: booking._id,
      orderId: booking.orderId,
      status: booking.status,
      totalPrice: booking.totalPrice,
      seats: booking.seats,
      showtime: booking.showtime
    })

  } catch (err) {
    next(err)
  }
}

// Updated generatePassHTML to only work for confirmed bookings
const generatePassHTML = async (req, res, next) => {
  try {
    const bookingId = req.params.id
    const userId = req.userId

    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theater' } }
        ]
      })
      .populate('user')

    if (!booking) {
      return res.status(404).send('Booking not found')
    }

    if (booking.user._id.toString() !== userId) {
      return res.status(403).send('Unauthorized')
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).send('Booking not confirmed. Please complete payment first.')
    }

    const showtime = booking.showtime
    const movie = showtime.movie
    const screen = showtime.screen
    const theater = screen.theater

    const formattedDate = new Date(showtime.startTime).toLocaleString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })

    const html = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        h2 { color: #c0392b; }
        p { margin: 8px 0; font-size: 16px; }
        strong { color: #2c3e50; }
        .ticket-box {
          border: 2px dashed #c0392b;
          padding: 20px;
          max-width: 500px;
          margin: auto;
          background: #f9f9f9;
          border-radius: 8px;
        }
      </style>

      <div class="ticket-box">
        <h2>🎟 Movie Ticket</h2>
        <p><strong>Movie:</strong> ${movie.title}</p>
        <p><strong>Theater:</strong> ${theater.theaterName} (${theater.city})</p>
        <p><strong>Screen:</strong> ${screen.name}</p>
        <p><strong>Showtime:</strong> ${formattedDate}</p>
        <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
        <p><strong>Amount Paid:</strong> ₹${booking.totalPrice}</p>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
        <p><strong>Order ID:</strong> ${booking.orderId}</p>
      </div>
      <button onclick="window.print()">🖨 Print Ticket</button>
    `
    
    res.send(html)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createBookingOrder,
  handleBookingWebhook,
  getBookingStatus,
  generatePassHTML
}