const express = require('express')
const ConnectDB = require('./config/dbConfig')
const app = express()

app.use(express.json())

ConnectDB()

module.exports = app