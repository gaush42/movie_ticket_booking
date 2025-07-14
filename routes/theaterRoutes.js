const express = require('express')
const router = express.Router()
const theaterController = require('../controllers/theaterController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

// Public
router.post('/apply', theaterController.applyForTheater)

// Theater Manager / Admin


module.exports = router
