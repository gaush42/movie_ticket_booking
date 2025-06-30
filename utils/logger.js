const winston = require('winston')

const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log'}),
        new winston.transports.Console(),
    ],
})
const infoLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'info.log'}),
        new winston.transports.Console(),
    ],
})

module.exports = {
    errorLogger,
    infoLogger
}