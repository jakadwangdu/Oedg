const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const LocalDb = require('../config/localDb');

const handleChat = (socket, io) => {
  socket.on('chat:send', async ({ roomId, text, type = 'text' }) => {
    if (!roomId || !text || !text.trim()) return;

    try {
      const trimmedText = text.trim().slice(0, 1000);
      const senderObj = {
        _id: socket.user?._id || socket.id,
        username: socket.user?.username || 'Partner',
        avatar: socket.user?.avatar || '',
      };

      const messageData = {
        _id: uuidv4(),
        roomId,
        sender: senderObj,
        senderName: senderObj.username,
        senderAvatar: senderObj.avatar,
        text: trimmedText,
        type: type || 'text',
        sentAt: new Date().toISOString(),
      };

      // 1. Always save to LocalDb for instant persistence & 100% reliability
      LocalDb.addMessage(messageData);

      // 2. Broadcast immediately to everyone in the room (including sender)
      io.to(roomId).emit('chat:receive', messageData);

      // 3. Background non-blocking sync to Mongoose if Atlas is reachable
      if (require('mongoose').connection.readyState === 1) {
        Message.create({
          roomId,
          sender: senderObj._id,
          senderName: senderObj.username,
          senderAvatar: senderObj.avatar,
          text: trimmedText,
          type: type || 'text',
          sentAt: new Date(),
        }).catch((dbErr) => {
          console.warn('MongoDB chat save note:', dbErr.message);
        });
      }
    } catch (err) {
      console.error('Error handling chat:send:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};

module.exports = { handleChat };
