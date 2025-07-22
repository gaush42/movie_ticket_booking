const mongoose = require('mongoose');

const seatLockSchema = new mongoose.Schema({
  showtime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime',
    required: true
  },
  seat: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['LOCKED', 'RELEASED'],
    default: 'LOCKED'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  }
}, {
  timestamps: true
});

// Compound index to ensure one lock per seat per showtime
seatLockSchema.index({ showtime: 1, seat: 1 }, { unique: true });

// Index for efficient queries
seatLockSchema.index({ showtime: 1, userId: 1 });
seatLockSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('SeatLock', seatLockSchema);