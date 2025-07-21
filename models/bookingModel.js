const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' },
    seats: [{type: String, require:true}],
    totalPrice: Number,
    bookingTime: { type: Date, default: Date.now },
    orderId: {type: String,required: true,unique: true},
    paymentSessionId: {type: String,required: true},
    status: {type: String,enum: ['PENDING', 'CONFIRMED', 'FAILED'],default: 'PENDING'}
},
{
  timestamps: true
});


module.exports = mongoose.model("Booking", bookingSchema)