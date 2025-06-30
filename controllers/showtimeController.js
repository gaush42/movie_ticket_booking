const showtimeService = require('../services/showtimeService')

const createShowtime = async (req, res, next) => {
    try {
        const showtime = await showtimeService.createShowtime(req.body)
        res.status(201).json({ message: "Showtime created", showtime })
    } catch (err) {
        next(err)
    }
}

const getAvailableSeats = async (req, res, next) => {
    try {
        const data = await showtimeService.getAvailableSeats(req.params.id)
        res.status(200).json(data)
    } catch (err) {
        next(err)
    }
}
const updateShowtime = async (req, res, next) => {
    try {
        const showtime = await showtimeService.updateShowtime(req.params.id, req.body)
        res.status(200).json({ message: 'Showtime updated', showtime })
    } catch (err) {
        next(err)
    }
}

const deleteShowtime = async (req, res, next) => {
    try {
        await showtimeService.deleteShowtime(req.params.id)
        res.status(200).json({ message: 'Showtime deleted' })
    } catch (err) {
        next(err)
    }
}

module.exports = { createShowtime, getAvailableSeats }
