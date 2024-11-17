const express = require('express')
const ConnectDB = require('./config/dbConfig')
const errorHandler = require('./middleware/errorHandler')
const app = express()

app.use(express.json())

ConnectDB()

app.use('/', require('./routes/userRoutes'))
app.use(errorHandler)

module.exports = app