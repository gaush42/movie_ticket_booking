const express = require('express')
const ConnectDB = require('./config/dbConfig')
const errorHandler = require('./middleware/errorHandler')
const app = express()

app.use(express.json())
app.use(errorHandler)
ConnectDB()

app.use('/', require('./routes/userRoutes'))

module.exports = app