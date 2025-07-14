const express = require('express')
const ConnectDB = require('./config/dbConfig')
const errorHandler = require('./middleware/errorHandler')
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true}))

ConnectDB()
app.use(express.static('public'));

app.use('/api/auth', require('./routes/userRoutes'))
app.use('/api/theater', require('./routes/theaterRoutes'))
app.use('/api/movies', require('./routes/movieRoutes'))
app.use('/api/showtimes', require('./routes/showtimeRoutes'))
app.use('/api/booking', require('./routes/bookingRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))
app.use('/api/manager', require('./routes/managerRoutes'))


app.use(errorHandler)

module.exports = app