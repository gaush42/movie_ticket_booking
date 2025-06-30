const mongoose = require('mongoose')

const showtimeSchema = new mongoose.Schema({
    screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    startTime: { type: Date, required: true },
    ticketPrice: Number,
    bookedSeats: [String]
})

module.exports = mongoose.model("Showtime", showtimeSchema)