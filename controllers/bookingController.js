const { Cashfree } = require('cashfree-pg');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel')
const Showtime = require('../models/showtimeModel')
const SeatLock = require('../models/seatLockModel')
const { sendPassEmail } = require('../utils/emailSender')
require("dotenv").config()

// Initialize Cashfree
const cashfree = new Cashfree(Cashfree.SANDBOX, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY)

// Constants for seat locking
const SEAT_LOCK_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 100; // milliseconds

// Helper function to create seat locks
const createSeatLocks = async (showtimeId, seats, userId, session = null) => {
  const lockExpiryTime = new Date(Date.now() + SEAT_LOCK_TIMEOUT);
  
  const seatLocks = seats.map(seat => ({
    showtime: showtimeId,
    seat: seat,
    userId: userId,
    expiresAt: lockExpiryTime,
    status: 'LOCKED'
  }));

  return await SeatLock.insertMany(seatLocks, { session });
};

// Helper function to check for existing locks
const checkExistingLocks = async (showtimeId, seats, userId) => {
  const now = new Date();
  
  // Find any active locks for these seats (excluding expired ones and current user's locks)
  const existingLocks = await SeatLock.find({
    showtime: showtimeId,
    seat: { $in: seats },
    status: 'LOCKED',
    expiresAt: { $gt: now },
    userId: { $ne: userId }
  });

  return existingLocks;
};

// Helper function to cleanup expired locks
const cleanupExpiredLocks = async (showtimeId) => {
  const now = new Date();
  await SeatLock.deleteMany({
    showtime: showtimeId,
    expiresAt: { $lt: now }
  });
};

// Helper function to remove user's existing locks for this showtime
const removeUserExistingLocks = async (showtimeId, userId, session = null) => {
  await SeatLock.deleteMany({
    showtime: showtimeId,
    userId: userId
  }, { session });
};

const createBookingOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  let retryAttempts = 0;

  while (retryAttempts < MAX_RETRY_ATTEMPTS) {
    try {
      await session.withTransaction(async () => {
        const userId = req.userId;
        const userEmail = req.email;
        const { showtimeId, seats } = req.body;

        if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
          throw new Error('Showtime and seats are required');
        }

        // Validate seats format and remove duplicates
        const uniqueSeats = [...new Set(seats)];
        const seatRegex = /^[A-Z]\d+$/; // Assuming seats are like A1, B2, etc.
        
        if (!uniqueSeats.every(seat => seatRegex.test(seat))) {
          throw new Error('Invalid seat format');
        }

        // Cleanup expired locks first
        await cleanupExpiredLocks(showtimeId);

        // Find showtime with lock
        const showtime = await Showtime.findById(showtimeId)
          .populate({
            path: 'screen',
            populate: { path: 'theater' }
          })
          .populate('movie')
          .session(session);

        if (!showtime) {
          throw new Error('Showtime not found');
        }

        // Check if seats are permanently booked
        const alreadyBooked = uniqueSeats.some(seat => showtime.bookedSeats.includes(seat));
        if (alreadyBooked) {
          throw new Error('One or more seats already booked');
        }

        // Check for existing active locks by other users
        const existingLocks = await checkExistingLocks(showtimeId, uniqueSeats, userId);
        if (existingLocks.length > 0) {
          const lockedSeats = existingLocks.map(lock => lock.seat);
          throw new Error(`Seats ${lockedSeats.join(', ')} are currently being booked by another user. Please try again.`);
        }

        // Remove user's existing locks for this showtime (in case they're changing seats)
        await removeUserExistingLocks(showtimeId, userId, session);

        // Create new seat locks
        const seatLocks = await createSeatLocks(showtimeId, uniqueSeats, userId, session);

        const totalPrice = uniqueSeats.length * showtime.ticketPrice;
        const orderId = `booking_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

        // Create Cashfree order
        const request = {
          order_id: orderId,
          order_amount: totalPrice,
          order_currency: "INR",
          customer_details: {
            customer_id: `user_${userId}`,
            customer_email: userEmail,
            customer_phone: "9999999999"
          },
          order_meta: {
            return_url: `https://movie-j183.onrender.com/pass.html?orderId=${orderId}`,
            notify_url: `https://movie-j183.onrender.com/api/booking/booking-webhook`,
            payment_methods: "cc,dc,upi"
          }
        };

        const response = await cashfree.PGCreateOrder(request);

        // Create pending booking record
        const booking = await Booking.create([{
          user: userId,
          showtime: showtimeId,
          seats: uniqueSeats,
          totalPrice,
          orderId,
          paymentSessionId: response.data.payment_session_id,
          status: 'PENDING',
          seatLockIds: seatLocks.map(lock => lock._id)
        }], { session });

        // Store response data for sending outside transaction
        req.bookingResponse = {
          message: 'Payment order created - seats locked for 10 minutes',
          paymentSessionId: response.data.payment_session_id,
          orderId,
          bookingId: booking[0]._id,
          amount: totalPrice,
          lockedSeats: uniqueSeats,
          lockExpiresAt: new Date(Date.now() + SEAT_LOCK_TIMEOUT).toISOString()
        };
      });

      // Transaction successful, break out of retry loop
      break;

    } catch (err) {
      retryAttempts++;
      
      if (err.message === 'Showtime not found' || 
          err.message === 'Showtime and seats are required' ||
          err.message === 'Invalid seat format') {
        // Don't retry for validation errors
        await session.endSession();
        return res.status(400).json({ message: err.message });
      }

      if (err.message.includes('already booked') || 
          err.message.includes('currently being booked')) {
        await session.endSession();
        return res.status(409).json({ message: err.message });
      }

      if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
        console.error('Max retry attempts reached:', err);
        await session.endSession();
        return res.status(500).json({ 
          message: 'Unable to process booking due to high demand. Please try again.' 
        });
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryAttempts));
    }
  }

  await session.endSession();

  if (req.bookingResponse) {
    res.status(201).json(req.bookingResponse);
  } else {
    res.status(500).json({ message: 'Booking failed' });
  }
};

// Function to release seat locks (called when payment fails or expires)
const releaseSeatLocks = async (orderId, reason = 'RELEASED') => {
  try {
    const booking = await Booking.findOne({ orderId });
    if (!booking) return;

    await SeatLock.deleteMany({
      _id: { $in: booking.seatLockIds || [] }
    });

    console.log(`Released seat locks for order ${orderId}: ${reason}`);
  } catch (error) {
    console.error('Error releasing seat locks:', error);
  }
};

// Updated webhook handler
const handleBookingWebhook = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
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
        .session(session);

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Idempotency check
      if (booking.status === 'CONFIRMED' || booking.status === 'FAILED') {
        console.log("🚫 Booking already processed, skipping update.");
        return;
      }

      if (paymentStatus === 'SUCCESS') {
        // Update booking status
        booking.status = 'CONFIRMED';
        await booking.save({ session });

        // Move seats from locks to permanent booking
        const showtime = await Showtime.findById(booking.showtime._id).session(session);
        showtime.bookedSeats.push(...booking.seats);
        await showtime.save({ session });

        // Remove seat locks
        await SeatLock.deleteMany({
          _id: { $in: booking.seatLockIds || [] }
        }, { session });

        // Send confirmation email (outside transaction)
        setImmediate(() => sendBookingConfirmationEmail(booking));

        console.log(`✅ Booking confirmed for order: ${orderId}`);

      } else if (paymentStatus === 'FAILED') {
        booking.status = 'FAILED';
        await booking.save({ session });

        // Release seat locks
        await SeatLock.deleteMany({
          _id: { $in: booking.seatLockIds || [] }
        }, { session });

        console.log(`❌ Booking failed for order: ${orderId}`);
      }
    });

    await session.endSession();
    return res.json({ success: true, message: "Webhook processed successfully" });

  } catch (error) {
    await session.endSession();
    console.error("Booking Webhook Error:", error);
    
    // Try to release locks even if webhook processing fails
    if (req.body.data?.order?.order_id) {
      await releaseSeatLocks(req.body.data.order.order_id, 'WEBHOOK_ERROR');
    }
    
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Function to check seat availability (for frontend)
const checkSeatAvailability = async (req, res, next) => {
  try {
    const { showtimeId } = req.params;
    
    // Cleanup expired locks first
    await cleanupExpiredLocks(showtimeId);
    
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    // Get currently locked seats
    const now = new Date();
    const lockedSeats = await SeatLock.find({
      showtime: showtimeId,
      status: 'LOCKED',
      expiresAt: { $gt: now }
    }).select('seat userId expiresAt');

    res.json({
      bookedSeats: showtime.bookedSeats,
      lockedSeats: lockedSeats.map(lock => ({
        seat: lock.seat,
        isOwnLock: lock.userId.toString() === req.userId,
        expiresAt: lock.expiresAt
      }))
    });

  } catch (err) {
    next(err);
  }
};

// Cleanup expired locks periodically (call this with a cron job)
const cleanupExpiredLocksJob = async () => {
  try {
    const result = await SeatLock.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} expired seat locks`);
    }
  } catch (error) {
    console.error('Error cleaning up expired locks:', error);
  }
};

// Release user's locks manually (if they cancel before payment)
const releaseUserLocks = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { showtimeId } = req.body;

    await SeatLock.deleteMany({
      showtime: showtimeId,
      userId: userId
    });

    res.json({ message: 'Seat locks released successfully' });
  } catch (err) {
    next(err);
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
const generatePassHTML = async (req, res, next) => {
  try {
    const bookingId = req.params.id
    const userId = req.userId

    /*const booking = await Booking.findById(bookingId)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theater' } }
        ]
      })
      .populate('user')*/
      const booking = await Booking.findOne({ orderId: bookingId })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theater' } }
        ]
      })
      .populate('user');

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
  checkSeatAvailability,
  releaseUserLocks,
  releaseSeatLocks,
  cleanupExpiredLocksJob,
  generatePassHTML
};