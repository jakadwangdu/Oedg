const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  // Supports both registered User ObjectId and guest string IDs (e.g. "guest_...")
  sender: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  senderName: {
    type: String,
    default: 'Partner',
  },
  senderAvatar: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['text', 'emoji', 'system'],
    default: 'text',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
