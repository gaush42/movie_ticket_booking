const bcrypt = require('bcryptjs')
const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const RegisterUser = async(userData) => {
    try{
        const { fullname, email, password, role } = userData

        if(!fullname || !email || !password){
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
        ? {fullname, email, password:hashedPassword}
        : {fullname, email, password:hashedPassword, role}

        const newUser = await userModel.create(userObj)
        if (newUser){
            return { message: 'User created', statusCode: 201 };
        }

    }catch (err){
        throw err
    }
}

const LoginUser = async ({ email, password }) => {
    if (!email || !password) {
        const error = new Error("Email and password are required")
        error.statusCode = 400
        throw error
    }

    const foundUser = await userModel.findOne({ email }).exec()
    if (!foundUser) {
        const error = new Error("User not found")
        error.statusCode = 404
        throw error
    }

    const isMatch = await bcrypt.compare(password, foundUser.password)
    if (!isMatch) {
        const error = new Error("Invalid credentials")
        error.statusCode = 401
        throw error
    }

    // JWT payload
    const userInfo = {
        username: foundUser.email,
        roles: foundUser.role
    }

    const token = jwt.sign(
        { userInfo },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE || '1d' }
    )

    return {
        message: 'Login successful',
        token,
        statusCode: 200
    }
}

module.exports = {
    RegisterUser,
    LoginUser
}