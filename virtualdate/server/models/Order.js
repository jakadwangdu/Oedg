const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 4500, // 4.5K INR for website purchase
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
  },
  buyerPhone: {
    type: String,
    required: [true, 'Buyer phone number is required to transfer website ownership'],
    trim: true,
  },
  buyerName: {
    type: String,
    trim: true,
    default: '',
  },
  buyerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  transferStatus: {
    type: String,
    enum: ['PENDING_TRANSFER', 'CONTACTED', 'TRANSFERRED'],
    default: 'PENDING_TRANSFER',
  },
  upiVpa: {
    type: String,
    default: '',
  },
  utr: {
    type: String,
    trim: true,
    default: '',
  },
  paymentGateway: {
    type: String,
    default: 'YouPI-PG',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
