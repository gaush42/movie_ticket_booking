const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  showtime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime',
    required: true
  },
  seats: [{
    type: String,
    required: true
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  // Payment-related fields
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentSessionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING'
  },
  // Seat lock references
  seatLockIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SeatLock'
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
bookingSchema.index({ orderId: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ showtime: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);