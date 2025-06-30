const userService = require('../services/userService')

const register = async(req, res, next) => {
    try{
        const userData = req.body
        const newUser = await userService.RegisterUser(userData)
        res.status(newUser.statusCode).json({ message: newUser.message })
    }catch (err){
        next(err)
    }
}
const login = async (req, res, next) => {
    try {
        const loginResult = await userService.LoginUser(req.body)
        res.status(loginResult.statusCode).json({
            message: loginResult.message,
            token: loginResult.token
        })
    } catch (err) {
        next(err)
    }
}
module.exports = {
    register,
    login
}