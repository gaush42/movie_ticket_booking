const userService = require('../services/userService')

const register = async(req, res, next) => {
    try{
        const userData = req.body
        await userService.RegisterUser(userData)
    }catch (err){
        next(err)
    }
}

module.exports = {
    register
}