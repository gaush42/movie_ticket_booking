const express = require('express')
const router = express.Router()
const theaterController = require('../controllers/theaterController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

// Public
router.post('/apply', theaterController.applyForTheater)

// Admin-only
router.put('/approve/:id', verifyJWT, verifyRole('Administrator'), theaterController.approveTheater)

// Theater Manager / Admin
router.post('/screens', verifyJWT, verifyRole('Theater_Manager', 'Administrator'), theaterController.createScreen)
router.put('/screens/:id', verifyJWT, verifyRole('Theater_Manager', 'Administrator'), theaterController.updateScreen)
router.delete('/screens/:id', verifyJWT, verifyRole('Theater_Manager', 'Administrator'), theaterController.deleteScreen)

module.exports = router
