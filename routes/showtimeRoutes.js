const express = require('express')
const router = express.Router()
const showtimeController = require('../controllers/showtimeController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

// Public route
router.get('/all', showtimeController.getAllMovieShowtimes)
router.get('/:id/seats', showtimeController.getAvailableSeats)

module.exports = router
