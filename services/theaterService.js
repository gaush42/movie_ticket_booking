const PendingTheater = require('../models/pendingTheaterModel')
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
const { sendTheaterApprovalEmail } = require('../utils/emailSender')
const Screen = require('../models/screenModel')

const applyForTheater = async (data) => {
    const { email, theaterName, managerName, phone, city } = data

    if (!email || !theaterName || !managerName || !phone || !city) {
        const error = new Error("All fields are required")
        error.statusCode = 400
        throw error
    }

    const existing = await PendingTheater.findOne({ email }).lean()
    if (existing) {
        const error = new Error("Application with this email already exists")
        error.statusCode = 409
        throw error
    }

    await PendingTheater.create(data)
    return { message: "Application submitted successfully", statusCode: 201 }
}

const approveTheater = async (id) => {
    const pending = await PendingTheater.findById(id)
    if (!pending || pending.status !== "Pending") {
        const error = new Error("Invalid or already processed request")
        error.statusCode = 400
        throw error
    }

    // Create user with Theater_Manager role
    const password = Math.random().toString(36).slice(-8)
    const hashedPassword = bcrypt.hashSync(password, 10)

    const user = await User.create({
        email: pending.email,
        password: hashedPassword,
        role: ["Theater_Manager"]
    })

    pending.status = "Approved"
    await pending.save()
    await sendTheaterApprovalEmail(pending.email, pending.managerName, password)

    return {
        message: `Theater approved. Temporary password: ${password}`,
        statusCode: 200
    }
}
const createScreen = async (screenData) => {
    const { name, seatLayout, theaterId } = screenData
    if (!name || !seatLayout || !theaterId) {
        const error = new Error("Missing required fields")
        error.statusCode = 400
        throw error
    }
    return await Screen.create({ name, seatLayout, theater: theaterId })
}
const updateScreen = async (id, data) => {
    const screen = await Screen.findByIdAndUpdate(id, data, { new: true })
    if (!screen) throw new Error('Screen not found')
    return screen
}

const deleteScreen = async (id) => {
    const result = await Screen.findByIdAndDelete(id)
    if (!result) throw new Error('Screen not found')
    return true
}


module.exports = {
    applyForTheater,
    approveTheater
}
