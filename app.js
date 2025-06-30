const express = require('express')
const ConnectDB = require('./config/dbConfig')
const errorHandler = require('./middleware/errorHandler')
const app = express()

app.use(express.json())

ConnectDB()

app.use('/api/auth', require('./routes/userRoutes'))
app.use('/api/theater', require('./routes/theaterRoutes'))

app.use(errorHandler)

module.exports = app