const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

router.post('/create-order', verifyJWT, verifyRole('User'), bookingController.createBookingOrder)
router.post('/booking-webhook', bookingController.handleBookingWebhook)
router.get('/status/:orderId', verifyJWT, bookingController.getBookingStatus)
router.get('/pass/:id',verifyJWT,verifyRole('User'),bookingController.generatePassHTML)

module.exports = router
