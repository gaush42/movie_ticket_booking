const Showtime = require('../models/showtimeModel')

// Create a showtime (Admin or Theater Manager)
const createShowtime = async (req, res, next) => {
  try {
    const { screen, movie, startTime, ticketPrice } = req.body
    if (!screen || !movie || !startTime || !ticketPrice) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const showtime = await Showtime.create({ screen, movie, startTime, ticketPrice, bookedSeats: [] })
    res.status(201).json({ message: 'Showtime created', showtime })
  } catch (err) {
    next(err)
  }
}

// Get seat layout & booked seats for a specific showtime
const getAvailableSeats = async (req, res, next) => {
  try {
    const showtimeId = req.params.id
    const showtime = await Showtime.findById(showtimeId).populate('screen')
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' })
    }

    res.status(200).json({
      seatLayout: showtime.screen.seatLayout,
      bookedSeats: showtime.bookedSeats,
      ticketPrice: showtime.ticketPrice
    })
  } catch (err) {
    next(err)
  }
}

// Update showtime
const updateShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' })
    }

    res.status(200).json({ message: 'Showtime updated', showtime })
  } catch (err) {
    next(err)
  }
}

// Delete showtime
const deleteShowtime = async (req, res, next) => {
  try {
    const result = await Showtime.findByIdAndDelete(req.params.id)
    if (!result) {
      return res.status(404).json({ message: 'Showtime not found' })
    }

    res.status(200).json({ message: 'Showtime deleted' })
  } catch (err) {
    next(err)
  }
}

// Get all showtimes with populated movie + screen + theater
const getAllMovieShowtimes = async (req, res, next) => {
  try {
    const showtimes = await Showtime.find()
      .populate('movie')
      .populate({
        path: 'screen',
        populate: { path: 'theater' }
      })
      .lean()

    res.status(200).json(showtimes)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createShowtime,
  getAvailableSeats,
  updateShowtime,
  deleteShowtime,
  getAllMovieShowtimes
}
