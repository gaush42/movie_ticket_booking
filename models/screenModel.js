const mongoose = require('mongoose')

const screenSchema = new mongoose.Schema({
    theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
    name: String,
    seatLayout: [[String]]
})

module.exports = mongoose.model("Screen", screenSchema)