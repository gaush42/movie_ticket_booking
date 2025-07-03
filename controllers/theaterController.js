const Theater = require('../models/theaterModel')
const User = require('../models/userModel')
const Screen = require('../models/screenModel')
const bcrypt = require('bcryptjs')
const { sendTheaterApprovalEmail } = require('../utils/emailSender')

// Apply for theater registration (Public)
const applyForTheater = async (req, res, next) => {
  try {
    const { email, theaterName, managerName, phone, city } = req.body

    if (!email || !theaterName || !managerName || !phone || !city) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existing = await Theater.findOne({ email }).lean()
    if (existing) {
      return res.status(409).json({ message: "Application with this email already exists" })
    }

    await Theater.create(req.body)
    res.status(201).json({ message: "Application submitted successfully" })
  } catch (err) {
    next(err)
  }
}

// Approve theater (Admin only)
const approveTheater = async (req, res, next) => {
  try {
    const theaterId = req.params.id
    const pending = await Theater.findById(theaterId)
    if (!pending || pending.status !== "Pending") {
      return res.status(400).json({ message: "Invalid or already processed request" })
    }

    const password = Math.random().toString(36).slice(-8)
    const hashedPassword = bcrypt.hashSync(password, 10)

    await User.create({
      email: pending.email,
      password: hashedPassword,
      role: ["Theater_Manager"]
    })

    pending.status = "Approved"
    await pending.save()
    await sendTheaterApprovalEmail(pending.email, pending.managerName, password)

    res.status(200).json({
      message: `Theater approved. Temporary password sent to ${pending.email}`
    })
  } catch (err) {
    next(err)
  }
}

// Create screen (Theater manager only)
const createScreen = async (req, res, next) => {
  try {
    const { name, seatLayout, theaterId } = req.body
    if (!name || !seatLayout || !theaterId) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const screen = await Screen.create({ name, seatLayout, theater: theaterId })
    res.status(201).json({ message: "Screen created", screen })
  } catch (err) {
    next(err)
  }
}

// Update screen (Admin or Manager)
const updateScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!screen) return res.status(404).json({ message: "Screen not found" })

    res.status(200).json({ message: "Screen updated", screen })
  } catch (err) {
    next(err)
  }
}

// Delete screen (Admin or Manager)
const deleteScreen = async (req, res, next) => {
  try {
    const result = await Screen.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ message: "Screen not found" })

    res.status(200).json({ message: "Screen deleted" })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  applyForTheater,
  approveTheater,
  createScreen,
  updateScreen,
  deleteScreen
}
