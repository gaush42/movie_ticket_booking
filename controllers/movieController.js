const Movie = require('../models/movieModel')

const addMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body)
    res.status(201).json({ message: 'Movie added', movie })
  } catch (err) {
    next(err)
  }
}

const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' })
    }
    res.status(200).json({ message: 'Movie updated', movie })
  } catch (err) {
    next(err)
  }
}

const deleteMovie = async (req, res, next) => {
  try {
    const result = await Movie.findByIdAndDelete(req.params.id)
    if (!result) {
      return res.status(404).json({ message: 'Movie not found' })
    }
    res.status(200).json({ message: 'Movie deleted' })
  } catch (err) {
    next(err)
  }
}

const getAllMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find().lean()
    res.status(200).json(movies)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  addMovie,
  updateMovie,
  deleteMovie,
  getAllMovies
}
