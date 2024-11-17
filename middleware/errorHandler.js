const {errorLogger} = require('../utils/logger')

const errorHandler = (err, req, res, next) => {
    errorLogger.error(`${err.message} - ${req.method} ${req.orginalUrl}`)

    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    })
}

module.exports = errorHandler