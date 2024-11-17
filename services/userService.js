const bcrypt = require('bcryptjs')
const userModel = require('../models/userModel')
require('dotenv').config()

const RegisterUser = async(userData) => {
    try{
        const { email, password, role } = userData

        if(!email || !password){
            const error = new Error('All fields are required')
            error.statusCode = 400
            throw error
        }
        const duplicate = await userModel.findOne({email}).collation({locale: 'en', strength: 2}).lean().exec()
        if(duplicate){
            const error = new Error('User already exists')
            error.statusCode = 409
            throw error
        }
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(password,salt)

        const userObj = (!Array.isArray(role) || !role)
        ? {email, password:hashedPassword}
        : {email, password:hashedPassword, role}

        const newUser = await userModel.create(userObj)
        if (newUser){
            return { message: 'User created', statusCode: 201 };
        }

    }catch (err){
        throw err
    }
}

module.exports = {
    RegisterUser
}