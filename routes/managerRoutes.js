const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const managerStatsController = require('../controllers/managerController');
const theaterController = require('../controllers/theaterController')
const showtimeController = require('../controllers/showtimeController')

/*router.get('/stats', verifyJWT, verifyRole('Theater_Manager'), managerStatsController.getManagerStats);
router.post('/', verifyJWT, verifyRole('Theater_Manager'), showtimeController.createShowtime)
router.put('/:id', verifyJWT, verifyRole('Theater_Manager'), showtimeController.updateShowtime)
router.delete('/:id', verifyJWT, verifyRole('Theater_Manager'), showtimeController.deleteShowtime)
router.post('/screens', verifyJWT, verifyRole('Theater_Manager'), theaterController.createScreen)
router.put('/screens/:id', verifyJWT, verifyRole('Theater_Manager'), theaterController.updateScreen)
router.delete('/screens/:id', verifyJWT, verifyRole('Theater_Manager'), theaterController.deleteScreen)*/

const {
  // Theater management
  getTheaterDetails,
  updateTheaterDetails,
  
  // Screen management
  getScreens,
  createScreen,
  updateScreen,
  deleteScreen,
  
  // Showtime management
  createShowtime,
  updateShowtime,
  deleteShowtime,
  
  // Booking management
  getTheaterBookings,
  cancelBooking
} = require('../controllers/managerController'); // Adjust path as needed

// Import the showtime controllers from previous artifact
const { getManagerShowtimes, getManagerShowtimesList } = require('../controllers/managerController');

// ==================== THEATER ROUTES ====================
// GET /api/manager/theater - Get theater details
router.get('/theater', verifyJWT,verifyRole('Theater_Manager'), getTheaterDetails);

// PUT /api/manager/theater - Update theater details
router.put('/theater', verifyJWT,verifyRole('Theater_Manager'), updateTheaterDetails);

// ==================== SCREEN ROUTES ====================
// GET /api/manager/screens - Get all screens
router.get('/screens', verifyJWT,verifyRole('Theater_Manager'), getScreens);

// POST /api/manager/screens - Create new screen
router.post('/screens', verifyJWT,verifyRole('Theater_Manager'), createScreen);

// PUT /api/manager/screens/:screenId - Update screen
router.put('/screens/:screenId', verifyJWT,verifyRole('Theater_Manager'), updateScreen);

// DELETE /api/manager/screens/:screenId - Delete screen
router.delete('/screens/:screenId', verifyJWT,verifyRole('Theater_Manager'), deleteScreen);

// ==================== SHOWTIME ROUTES ====================
// GET /api/manager/showtimes - Get all showtimes (grouped by screen)
router.get('/showtimes', verifyJWT,verifyRole('Theater_Manager'), getManagerShowtimes);

// GET /api/manager/showtimes/list - Get all showtimes (flat list)
router.get('/showtimes/list', verifyJWT,verifyRole('Theater_Manager'), getManagerShowtimesList);

// POST /api/manager/showtimes - Create new showtime
router.post('/showtimes', verifyJWT,verifyRole('Theater_Manager'), createShowtime);

// PUT /api/manager/showtimes/:showtimeId - Update showtime
router.put('/showtimes/:showtimeId', verifyJWT,verifyRole('Theater_Manager'), updateShowtime);

// DELETE /api/manager/showtimes/:showtimeId - Delete showtime
router.delete('/showtimes/:showtimeId', verifyJWT,verifyRole('Theater_Manager'), deleteShowtime);

// ==================== BOOKING ROUTES ====================
// GET /api/manager/bookings - Get all bookings for the theater
router.get('/bookings', verifyJWT,verifyRole('Theater_Manager'), getTheaterBookings);

// PUT /api/manager/bookings/:bookingId/cancel - Cancel booking
router.put('/bookings/:bookingId/cancel', verifyJWT,verifyRole('Theater_Manager'), cancelBooking);

router.get('/stats', verifyJWT, verifyRole('Theater_Manager'), managerStatsController.getManagerStats);


module.exports = router;