const Booking = require('../models/bookingModel')
const Showtime = require('../models/showtimeModel')

const bookTicket = async (req, res, next) => {
  try {
    const userId = req.user // set by verifyJWT middleware
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

    res.status(201).json({ message: 'Booking successful', booking })
  } catch (err) {
    next(err)
  }
}

const generatePassHTML = async (req, res, next) => {
  try {
    const bookingId = req.params.id
    const userId = req.user // set by verifyJWT middleware

    const booking = await Booking.findById(bookingId)
      .populate('showtime')
      .populate({ path: 'showtime', populate: { path: 'movie' } })

    if (!booking) {
      return res.status(404).send('Booking not found')
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).send('Unauthorized')
    }

    const html = `
      <h2>🎟 Movie Ticket</h2>
      <p><strong>Movie:</strong> ${booking.showtime.movie.title}</p>
      <p><strong>Showtime:</strong> ${new Date(booking.showtime.startTime).toLocaleString()}</p>
      <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
      <p><strong>Amount Paid:</strong> ₹${booking.totalPrice}</p>
      <p><strong>Booking ID:</strong> ${booking._id}</p>
    `

    res.send(html)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  bookTicket,
  generatePassHTML
}
