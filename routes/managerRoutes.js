const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const managerStatsController = require('../controllers/managerController');

const {
  getTheaterDetails,
  updateTheaterDetails,
  
  getScreens,
  createScreen,
  updateScreen,
  deleteScreen,

  createShowtime,
  updateShowtime,
  deleteShowtime,
  
  getTheaterBookings,
  cancelBooking
} = require('../controllers/managerController');

const { getManagerShowtimes, getManagerShowtimesList } = require('../controllers/managerController');
router.get('/theater', verifyJWT,verifyRole('Theater_Manager'), getTheaterDetails);

router.put('/theater', verifyJWT,verifyRole('Theater_Manager'), updateTheaterDetails);

router.get('/screens', verifyJWT,verifyRole('Theater_Manager'), getScreens);

router.post('/screens', verifyJWT,verifyRole('Theater_Manager'), createScreen);

router.put('/screens/:screenId', verifyJWT,verifyRole('Theater_Manager'), updateScreen);

router.delete('/screens/:screenId', verifyJWT,verifyRole('Theater_Manager'), deleteScreen);

router.get('/showtimes', verifyJWT,verifyRole('Theater_Manager'), getManagerShowtimes);

router.get('/showtimes/list', verifyJWT,verifyRole('Theater_Manager'), getManagerShowtimesList);

router.post('/showtimes', verifyJWT,verifyRole('Theater_Manager'), createShowtime);

router.put('/showtimes/:showtimeId', verifyJWT,verifyRole('Theater_Manager'), updateShowtime);

router.delete('/showtimes/:showtimeId', verifyJWT,verifyRole('Theater_Manager'), deleteShowtime);

router.get('/bookings', verifyJWT,verifyRole('Theater_Manager'), getTheaterBookings);

router.put('/bookings/:bookingId/cancel', verifyJWT,verifyRole('Theater_Manager'), cancelBooking);

router.get('/stats', verifyJWT, verifyRole('Theater_Manager'), managerStatsController.getManagerStats);


module.exports = router;