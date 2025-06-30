const Movie = require('../models/movieModel')

const addMovie = async (movieData) => {
    return await Movie.create(movieData)
}
const updateMovie = async (id, data) => {
    const movie = await Movie.findByIdAndUpdate(id, data, { new: true })
    if (!movie) throw new Error('Movie not found')
    return movie
}

const deleteMovie = async (id) => {
    const result = await Movie.findByIdAndDelete(id)
    if (!result) throw new Error('Movie not found')
    return true
}

module.exports = { addMovie }