const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
require('dotenv').config()

// Register Controller
const register = async (req, res, next) => {
  try {
    const { fullname, email, password, role } = req.body

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const duplicate = await userModel.findOne({ email })
      .collation({ locale: 'en', strength: 2 })
      .lean()

    if (duplicate) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    const userObj = (!Array.isArray(role) || !role)
      ? { fullname, email, password: hashedPassword }
      : { fullname, email, password: hashedPassword, role }

    await userModel.create(userObj)

    res.status(201).json({ message: 'User created successfully' })
  } catch (err) {
    next(err)
  }
}

// Login Controller
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const userInfo = {
      userId: user._id.toString(),
      username: user.email,
      roles: user.role
    }

    const token = jwt.sign(
      { userInfo },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE || '1d' }
    )

    res.status(200).json({
      message: 'Login successful',
      token
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login
}
