const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' },
    seats: [String],
    totalPrice: Number,
    bookingTime: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Booking", bookingSchema)