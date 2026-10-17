const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const LocalDb = require('../config/localDb');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_vd_2026');

    if (mongoose.connection.readyState === 1) {
      try {
        req.user = await User.findById(decoded.id).select('-passwordHash');
        if (req.user) return next();
      } catch (dbErr) {}
    }

    // Local DB fallback
    const localUser = LocalDb.findUser({ _id: decoded.id });
    if (localUser) {
      req.user = localUser;
      return next();
    }

    // Guest token fallback
    if (decoded.id && (String(decoded.id).startsWith('guest_') || decoded.isGuest)) {
      req.user = {
        _id: decoded.id,
        username: decoded.username || `Guest_${String(decoded.id).slice(-4)}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${decoded.id}`,
        isGuest: true,
      };
      return next();
    }
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
