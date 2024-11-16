const bcrypt = require('bcryptjs')
const userModel = require('../models/userModel')
require('dotenv').config()

const RegisterUser = async(userData, next) => {
    try{
        email = userData.email
        password = userData.password
        role = userData.role

        if(!email || !password){
            return res.status(400).json('All fields are required')
        }
        const duplicate = await userModel.findOne(email).collation({locale: 'en', strength: 2}).lean().exec()
        if(duplicate){
            return res.status(409).json({message: 'user already exist'})
        }
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(password,salt)

        const userObj = (!Array.isArray(role) || !role)
        ? {email, password:hashedPassword}
        : {email, password:hashedPassword, role}

        const newUser = await userModel.create(userObj)
        if (newUser){
            res.status(201).json({message: 'User created'})
        }

    }catch (err){
        next(err)
    }
}

module.exports = {
    RegisterUser
}