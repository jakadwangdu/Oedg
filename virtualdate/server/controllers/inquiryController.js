const Inquiry = require('../models/Inquiry');
const LocalDb = require('../config/localDb');
const mongoose = require('mongoose');

const isMongooseConnected = () => mongoose.connection.readyState === 1;

// Strip HTML tags to prevent XSS
const sanitize = (str = '') => {
  return String(str)
    .replace(/<[^>]*>?/gm, '')
    .trim();
};

const isValidEmail = (email = '') => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

// @desc    Submit inquiry to buy / license website
// @route   POST /api/inquiries/buy
const submitBuyInquiry = async (req, res) => {
  try {
    const { name, email, inquiryType, budget, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const payload = {
      type: 'buy',
      name: sanitize(name).slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 150),
      inquiryType: sanitize(inquiryType || 'Full Acquisition').slice(0, 100),
      budget: sanitize(budget || 'Negotiable').slice(0, 50),
      message: sanitize(message).slice(0, 3000),
      status: 'new',
    };

    let saved;
    if (isMongooseConnected()) {
      try {
        saved = await Inquiry.create(payload);
      } catch (dbErr) {
        saved = LocalDb.createInquiry(payload);
      }
    } else {
      saved = LocalDb.createInquiry(payload);
    }

    return res.status(201).json({
      success: true,
      referenceId: saved._id,
      message: 'Thank you for your interest! Your acquisition inquiry has been received. We will respond promptly via email.',
    });
  } catch (err) {
    console.error('Buy inquiry error:', err);
    return res.status(500).json({ message: 'Failed to process inquiry. Please try again.' });
  }
};

// @desc    Submit help & technical support request
// @route   POST /api/inquiries/help
const submitHelpRequest = async (req, res) => {
  try {
    const { name, email, category, message, deviceInfo } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and issue description are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const payload = {
      type: 'help',
      name: sanitize(name).slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 150),
      category: sanitize(category || 'General').slice(0, 100),
      deviceInfo: sanitize(deviceInfo || '').slice(0, 500),
      message: sanitize(message).slice(0, 3000),
      status: 'new',
    };

    let saved;
    if (isMongooseConnected()) {
      try {
        saved = await Inquiry.create(payload);
      } catch (dbErr) {
        saved = LocalDb.createInquiry(payload);
      }
    } else {
      saved = LocalDb.createInquiry(payload);
    }

    return res.status(201).json({
      success: true,
      ticketId: saved._id,
      message: 'Support ticket submitted successfully. Our team will review the issue and reach out via email.',
    });
  } catch (err) {
    console.error('Help request error:', err);
    return res.status(500).json({ message: 'Failed to submit help ticket. Please try again.' });
  }
};

// @desc    Get all inquiries & help requests
// @route   GET /api/inquiries/all
const getAllInquiries = async (req, res) => {
  try {
    let inquiries = [];
    if (isMongooseConnected()) {
      inquiries = await Inquiry.find().sort({ createdAt: -1 });
    } else {
      const fs = require('fs');
      const path = require('path');
      const INQ_FILE = path.join(__dirname, '../data/inquiries.json');
      if (fs.existsSync(INQ_FILE)) {
        inquiries = JSON.parse(fs.readFileSync(INQ_FILE, 'utf-8') || '[]');
        inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }
    res.json(inquiries);
  } catch (err) {
    console.error('getAllInquiries error:', err);
    res.status(500).json({ message: 'Failed to retrieve inquiries.' });
  }
};

module.exports = { submitBuyInquiry, submitHelpRequest, getAllInquiries };
