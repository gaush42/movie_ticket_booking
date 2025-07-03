const express = require('express')
const router = express.Router()
const movieController = require('../controllers/movieController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

// Admin-only routes
router.post('/', verifyJWT, verifyRole('Administrator'), movieController.addMovie)
router.put('/:id', verifyJWT, verifyRole('Administrator'), movieController.updateMovie)
router.delete('/:id', verifyJWT, verifyRole('Administrator'), movieController.deleteMovie)

// Public route
router.get('/', movieController.getAllMovies)

module.exports = router
