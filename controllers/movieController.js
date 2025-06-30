const movieService = require('../services/movieService')

const addMovie = async (req, res, next) => {
    try {
        const movie = await movieService.addMovie(req.body)
        res.status(201).json({ message: "Movie added", movie })
    } catch (err) {
        next(err)
    }
}
const updateMovie = async (req, res, next) => {
    try {
        const movie = await movieService.updateMovie(req.params.id, req.body)
        res.status(200).json({ message: 'Movie updated', movie })
    } catch (err) {
        next(err)
    }
}

const deleteMovie = async (req, res, next) => {
    try {
        await movieService.deleteMovie(req.params.id)
        res.status(200).json({ message: 'Movie deleted' })
    } catch (err) {
        next(err)
    }
}

module.exports = { addMovie }