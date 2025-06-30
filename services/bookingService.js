const Booking = require('../models/bookingModel')
const Showtime = require('../models/showtimeModel')

const bookTicket = async (userId, showtimeId, seats) => {
    const showtime = await Showtime.findById(showtimeId)
    if (!showtime) throw new Error("Showtime not found")

    const alreadyBooked = seats.some(seat => showtime.bookedSeats.includes(seat))
    if (alreadyBooked) {
        const error = new Error("One or more seats already booked")
        error.statusCode = 409
        throw error
    }

    showtime.bookedSeats.push(...seats)
    await showtime.save()

    const totalPrice = seats.length * showtime.ticketPrice
    const booking = await Booking.create({ user: userId, showtime: showtimeId, seats, totalPrice })

    return booking
}

const generatePassHTML = async (bookingId, userId) => {
    const booking = await Booking.findById(bookingId)
        .populate('showtime')
        .populate({ path: 'showtime', populate: { path: 'movie' } })

    if (!booking) throw new Error("Booking not found")
    if (booking.user.toString() !== userId) {
        const error = new Error("Unauthorized")
        error.statusCode = 403
        throw error
    }

    return `
        <h2>🎟 Movie Ticket</h2>
        <p><strong>Movie:</strong> ${booking.showtime.movie.title}</p>
        <p><strong>Showtime:</strong> ${new Date(booking.showtime.startTime).toLocaleString()}</p>
        <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
        <p><strong>Amount Paid:</strong> ₹${booking.totalPrice}</p>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
    `
}

module.exports = { bookTicket, generatePassHTML }