const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Room = require('../models/Room');
const Message = require('../models/Message');
const LocalDb = require('../config/localDb');

const isMongooseConnected = () => mongoose.connection.readyState === 1;

// @desc    Create a new room
// @route   POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required' });

    const roomPassword = password && password.trim() ? password.trim() : '';

    if (isMongooseConnected()) {
      try {
        const room = await Room.create({
          roomId: uuidv4(),
          name,
          password: roomPassword,
          createdBy: req.user._id,
        });
        const safeRoom = room.toObject();
        safeRoom.hasPassword = !!roomPassword;
        delete safeRoom.password;
        return res.status(201).json(safeRoom);
      } catch (dbErr) {
        console.warn('Mongoose createRoom failed, falling back to local DB:', dbErr.message);
      }
    }

    const room = LocalDb.createRoom({
      name,
      password: roomPassword,
      createdBy: req.user._id,
    });
    const safeRoom = { ...room, hasPassword: !!roomPassword };
    delete safeRoom.password;
    res.status(201).json(safeRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get room by roomId
// @route   GET /api/rooms/:roomId
const getRoom = async (req, res) => {
  try {
    let room = null;
    if (isMongooseConnected()) {
      try {
        room = await Room.findOne({ roomId: req.params.roomId }).populate('createdBy', 'username avatar');
      } catch (dbErr) {
        console.warn('Mongoose getRoom failed, checking local DB:', dbErr.message);
      }
    }

    if (!room) {
      room = LocalDb.getRoom(req.params.roomId);
    }

    if (!room) return res.status(404).json({ message: 'Room not found' });

    const safeRoom = room.toObject ? room.toObject() : { ...room };
    safeRoom.hasPassword = !!safeRoom.password;
    delete safeRoom.password;
    res.json(safeRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify optional room password
// @route   POST /api/rooms/:roomId/verify-password
const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    let room = null;
    if (isMongooseConnected()) {
      try {
        room = await Room.findOne({ roomId: req.params.roomId });
      } catch (e) {}
    }
    if (!room) {
      room = LocalDb.getRoom(req.params.roomId);
    }
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (!room.password) {
      return res.json({ success: true, message: 'No password required' });
    }

    if (room.password === (password || '').trim()) {
      return res.json({ success: true, message: 'Password verified' });
    }

    return res.status(401).json({ success: false, message: 'Incorrect room password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rooms created by current user
// @route   GET /api/rooms
const getUserRooms = async (req, res) => {
  try {
    if (isMongooseConnected()) {
      try {
        const rooms = await Room.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        return res.json(rooms);
      } catch (dbErr) {
        console.warn('Mongoose getUserRooms failed, checking local DB:', dbErr.message);
      }
    }

    const rooms = LocalDb.getUserRooms(req.user._id);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:roomId
const deleteRoom = async (req, res) => {
  try {
    if (isMongooseConnected()) {
      try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (room) {
          if (room.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
          }
          await room.deleteOne();
          await Message.deleteMany({ roomId: req.params.roomId });
          return res.json({ message: 'Room deleted' });
        }
      } catch (dbErr) {}
    }

    LocalDb.deleteRoom(req.params.roomId);
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat history for a room
// @route   GET /api/rooms/:roomId/messages
const getRoomMessages = async (req, res) => {
  try {
    let rawMessages = [];
    if (isMongooseConnected()) {
      try {
        rawMessages = await Message.find({ roomId: req.params.roomId })
          .populate('sender', 'username avatar')
          .sort({ sentAt: 1 })
          .limit(100);
      } catch (dbErr) {}
    }

    if (!rawMessages || rawMessages.length === 0) {
      rawMessages = LocalDb.getMessages(req.params.roomId);
    }

    const safeMessages = rawMessages.map((m) => {
      const isPopulated = m.sender && typeof m.sender === 'object' && m.sender.username;
      const senderObj = isPopulated
        ? { _id: m.sender._id, username: m.sender.username, avatar: m.sender.avatar || '' }
        : {
            _id: m.sender?._id || m.sender || 'unknown',
            username: m.senderName || m.sender?.username || 'Partner',
            avatar: m.senderAvatar || m.sender?.avatar || '',
          };

      return {
        _id: m._id,
        roomId: m.roomId,
        sender: senderObj,
        text: m.text,
        type: m.type || 'text',
        sentAt: m.sentAt,
      };
    });

    res.json(safeMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRoom, getRoom, verifyPassword, getUserRooms, deleteRoom, getRoomMessages };
