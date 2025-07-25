const express = require('express')
const router = express.Router()
const movieController = require('../controllers/movieController')

// Public route
router.get('/', movieController.getAllMovies)

module.exports = router
