const JWT = require('jsonwebtoken')
require('dotenv').config()

const verifyJWT = (req, res, next) => {
    const authHeader = req.header.authorization || req.header.Authorization
    if(!authHeader?.startsWith('Bearer ')){
        return res.status(401).json({ message: 'Unautherized'})
    }
    const token = authHeader.split(' ')[1]
    JWT.verify(
        token,
        process.env.JWT_ACCESS_TOKEN,
        (err, decode) => {
            if(err) return res.status(403)
            req.user = decoded.userInfo.username
            req.roles = decoded.userInfo.roles
            next();
        }
    )
}
module.exports = verifyJWT