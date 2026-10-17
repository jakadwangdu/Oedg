const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRoom,
  verifyPassword,
  getUserRooms,
  deleteRoom,
  getRoomMessages,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRoom);
router.get('/', protect, getUserRooms);
router.get('/:roomId', getRoom);
router.post('/:roomId/verify-password', verifyPassword);
router.delete('/:roomId', protect, deleteRoom);
router.get('/:roomId/messages', getRoomMessages);

module.exports = router;
