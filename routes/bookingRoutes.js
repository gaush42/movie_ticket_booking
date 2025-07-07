const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

router.post(
  '/ticket',
  verifyJWT,
  verifyRole('User'),
  bookingController.bookTicket
)

router.get(
  '/pass/:id',
  verifyJWT,
  verifyRole('User'),
  bookingController.generatePassHTML
)

module.exports = router
