const Showtime = require('../models/showtimeModel')

const createShowtime = async (data) => {
    const { screen, movie, startTime, ticketPrice } = data
    if (!screen || !movie || !startTime || !ticketPrice) {
        const error = new Error("All fields are required")
        error.statusCode = 400
        throw error
    }
    return await Showtime.create({ screen, movie, startTime, ticketPrice, bookedSeats: [] })
}

const getAvailableSeats = async (showtimeId) => {
    const showtime = await Showtime.findById(showtimeId).populate('screen')
    if (!showtime) throw new Error("Showtime not found")
    const allSeats = showtime.screen.seatLayout.flat()
    const availableSeats = allSeats.filter(seat => !showtime.bookedSeats.includes(seat))
    return { availableSeats, bookedSeats: showtime.bookedSeats }
}
const updateShowtime = async (id, data) => {
    const showtime = await Showtime.findByIdAndUpdate(id, data, { new: true })
    if (!showtime) throw new Error('Showtime not found')
    return showtime
}

const deleteShowtime = async (id) => {
    const result = await Showtime.findByIdAndDelete(id)
    if (!result) throw new Error('Showtime not found')
    return true
}

module.exports = { createShowtime, getAvailableSeats }