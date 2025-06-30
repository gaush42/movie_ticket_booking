const mongoose = require('mongoose')

const pendingTheaterSchema = new mongoose.Schema({
    theaterName: { type: String, required: true },
    managerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    status: { type: String, default: "Pending" }, // Pending | Approved | Rejected
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("PendingTheater", pendingTheaterSchema)
