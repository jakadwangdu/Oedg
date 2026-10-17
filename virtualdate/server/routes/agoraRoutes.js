const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateAgoraToken } = require('../utils/agoraToken');

// @route   GET /api/agora/token?channel=roomId&uid=uid
router.get('/token', protect, (req, res) => {
  const { channel, uid } = req.query;
  if (!channel || !uid) {
    return res.status(400).json({ message: 'channel and uid are required' });
  }

  const token = generateAgoraToken(channel, uid);
  res.json({
    token,
    appId: process.env.AGORA_APP_ID,
    channel,
    uid: parseInt(uid),
  });
});

module.exports = router;
