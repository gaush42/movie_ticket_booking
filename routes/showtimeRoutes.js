const express = require('express')
const router = express.Router()
const showtimeController = require('../controllers/showtimeController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

// Public route
router.get('/all', showtimeController.getAllMovieShowtimes)
router.get('/:id/seats', showtimeController.getAvailableSeats)

// Admin or Manager routes
router.post('/', verifyJWT, verifyRole('Administrator', 'Theater_Manager'), showtimeController.createShowtime)
router.put('/:id', verifyJWT, verifyRole('Administrator', 'Theater_Manager'), showtimeController.updateShowtime)
router.delete('/:id', verifyJWT, verifyRole('Administrator', 'Theater_Manager'), showtimeController.deleteShowtime)

module.exports = router
