const Booking = require('../models/bookingModel')
const Showtime = require('../models/showtimeModel')
const {sendPassEmail} = require('../utils/emailSender')

const bookTicket = async (req, res, next) => {
  try {
    const userId = req.userId // set by verifyJWT middleware
    const { showtimeId, seats } = req.body

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Showtime and seats are required' })
    }

    const showtime = await Showtime.findById(showtimeId)
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' })
    }

    const alreadyBooked = seats.some(seat => showtime.bookedSeats.includes(seat))
    if (alreadyBooked) {
      return res.status(409).json({ message: 'One or more seats already booked' })
    }

    showtime.bookedSeats.push(...seats)
    await showtime.save()

    const totalPrice = seats.length * showtime.ticketPrice
    const booking = await Booking.create({ user: userId, showtime: showtimeId, seats, totalPrice })

    res.status(201).json({ message: 'Booking successful', booking, bookingId: booking._id })
  } catch (err) {
    next(err)
  }
}

const generatePassHTML = async (req, res, next) => {
  try {
    const bookingId = req.params.id
    const userId = req.userId // set by verifyJWT middleware

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
      </div>
      <button onclick="window.print()">🖨 Print Ticket</button>
    `
    await sendPassEmail(booking.user.email, '🎟 Your Movie Ticket', html)
    console.log(booking.user.email)
    res.send(html)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  bookTicket,
  generatePassHTML
}
