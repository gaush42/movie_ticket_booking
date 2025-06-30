const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    language: String,
    genre: String,
    duration: Number,
    rating: String,
    posterUrl: String
})

module.exports = mongoose.model("Movie", movieSchema)