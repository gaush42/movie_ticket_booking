const express = require('express')
const router = express.Router()
// Controllers
const theaterController = require('../controllers/theaterController')
const movieController = require('../controllers/movieController')
const showtimeController = require('../controllers/showtimeController')
const bookingController = require('../controllers/bookingController')
const theaterController = require('../controllers/theaterController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

// Theater manager application (public)
router.post('/apply', theaterController.apply)

// Admin approves application
router.put('/approve/:id', verifyJWT, verifyRole('Administrator'), theaterController.approve)
// ==========================
// 🎦 Movie Routes (Admin)
// ==========================
router.post(
    '/movies',
    verifyJWT,
    verifyRole('Administrator'),
    movieController.addMovie
)

// ==========================
// 🖥 Screen Routes (Theater Manager)
// ==========================
router.post(
    '/screens',
    verifyJWT,
    verifyRole('Theater_Manager'),
    theaterController.createScreen
)

// ==========================
// ⏰ Showtime Routes (Theater Manager)
// ==========================
router.post(
    '/showtimes',
    verifyJWT,
    verifyRole('Theater_Manager'),
    showtimeController.createShowtime
)

router.get(
    '/showtimes/:id/seats',
    showtimeController.getAvailableSeats // public
)

// ==========================
// 🎟 Booking Routes (User)
// ==========================
router.post(
    '/bookings',
    verifyJWT,
    verifyRole('User'),
    bookingController.bookTicket
)

router.get(
    '/bookings/:id/pass',
    verifyJWT,
    verifyRole('User'),
    bookingController.getPass
)
// Movie (Admin)
router.put('/movies/:id', verifyJWT, verifyRole('Administrator'), movieController.updateMovie)
router.delete('/movies/:id', verifyJWT, verifyRole('Administrator'), movieController.deleteMovie)

// Screen (Manager)
router.put('/screens/:id', verifyJWT, verifyRole('Theater_Manager'), theaterController.updateScreen)
router.delete('/screens/:id', verifyJWT, verifyRole('Theater_Manager'), theaterController.deleteScreen)

// Showtime (Manager)
router.put('/showtimes/:id', verifyJWT, verifyRole('Theater_Manager'), showtimeController.updateShowtime)
router.delete('/showtimes/:id', verifyJWT, verifyRole('Theater_Manager'), showtimeController.deleteShowtime)


module.exports = router
