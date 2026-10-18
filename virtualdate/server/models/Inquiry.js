const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['buy', 'help', 'contact'],
    required: true,
    default: 'buy',
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    maxlength: 150,
  },
  inquiryType: {
    type: String,
    default: '',
    maxlength: 100,
  },
  budget: {
    type: String,
    default: '',
    maxlength: 50,
  },
  category: {
    type: String,
    default: 'General',
    maxlength: 100,
  },
  message: {
    type: String,
    required: [true, 'Message or issue description is required'],
    trim: true,
    maxlength: 3000,
  },
  deviceInfo: {
    type: String,
    default: '',
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['new', 'in_review', 'resolved'],
    default: 'new',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Inquiry', inquirySchema);
