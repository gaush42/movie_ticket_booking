const express = require('express')
const router = express.Router()
const adminStatsController = require('../controllers/adminController')
const movieController = require('../controllers/movieController')
const theaterController = require('../controllers/theaterController')
const verifyJWT = require('../middleware/verifyJWT')
const verifyRole = require('../middleware/verifyRole')

// Only accessible by Administrator
router.get('/stats', verifyJWT, verifyRole('Administrator'), adminStatsController.getStats)
router.post('/', verifyJWT, verifyRole('Administrator'), movieController.addMovie)
router.put('/:id', verifyJWT, verifyRole('Administrator'), movieController.updateMovie)
router.delete('/:id', verifyJWT, verifyRole('Administrator'), movieController.deleteMovie)
router.put('/approve/:id', verifyJWT, verifyRole('Administrator'), theaterController.approveTheater)
router.get('/pending', verifyJWT, verifyRole('Administrator'), theaterController.getPendingTheaters)

module.exports = router
