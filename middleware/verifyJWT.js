const JWT = require('jsonwebtoken')
require('dotenv').config()

const SECRET_KEY = process.env.JWT_ACCESS_TOKEN

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader)
    return res.status(401).json({ message: 'Authorization header missing' })

  const token = authHeader.split(' ')[1]
  if (!token)
    return res.status(401).json({ message: 'Token missing' })

  try {
    const decoded = JWT.verify(token, SECRET_KEY)

    // ✅ Correctly extract userId from nested userInfo
    req.userId = decoded.userInfo.userId
    req.user = decoded.userInfo
    req.roles = decoded.userInfo.roles

    next()
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' })
  }
}

module.exports = verifyJWT
