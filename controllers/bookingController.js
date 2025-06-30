const bookingService = require('../services/bookingService')

const bookTicket = async (req, res, next) => {
    try {
        const { showtimeId, seats } = req.body
        const booking = await bookingService.bookTicket(req.user, showtimeId, seats)
        res.status(201).json({ message: "Booking successful", bookingId: booking._id })
    } catch (err) {
        next(err)
    }
}

const getPass = async (req, res, next) => {
    try {
        const html = await bookingService.generatePassHTML(req.params.id, req.user)
        res.send(html)
    } catch (err) {
        next(err)
    }
}

module.exports = { bookTicket, getPass }