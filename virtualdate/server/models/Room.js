const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  password: {
    type: String,
    default: '',
  },
  currentActivity: {
    type: String,
    enum: ['chat', 'movie', 'music', 'whiteboard', 'games'],
    default: 'chat',
  },
  movieState: {
    url: { type: String, default: '' },
    playing: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
  },
  musicState: {
    videoId: { type: String, default: '' },
    title: { type: String, default: '' },
    playing: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
  },
  whiteboardState: {
    canvasJSON: { type: String, default: '' },
  },
  gameState: {
    url: { type: String, default: '' },
    type: { type: String, default: 'embed' },
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index - auto-delete expired rooms
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Room', roomSchema);
