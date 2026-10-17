const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { handleChat } = require('./chatHandlers');
const { handleMovie } = require('./movieHandlers');
const { handleMusic } = require('./musicHandlers');
const { handleWhiteboard } = require('./whiteboardHandlers');
const { handleGame } = require('./gameHandlers');
const { handleWebRTC } = require('./webrtcHandlers');

// Track participants per room: { roomId: Map<socketId, {userId, username, avatar}> }
const roomParticipants = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
    },
  });

  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));

      let decoded = null;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_vd_2026');
      } catch (jwtErr) {
        if (token === 'guest' || String(token).startsWith('guest_')) {
          decoded = { id: 'guest_' + socket.id, username: 'Guest', isGuest: true };
        } else {
          return next(new Error('Auth failed: ' + jwtErr.message));
        }
      }

      if (require('mongoose').connection.readyState === 1) {
        try {
          const user = await User.findById(decoded.id).select('-passwordHash');
          if (user) {
            socket.user = user;
            return next();
          }
        } catch (dbErr) {}
      }

      // Local DB fallback
      const LocalDb = require('../config/localDb');
      const localUser = LocalDb.findUser({ _id: decoded.id });
      if (localUser) {
        socket.user = localUser;
        return next();
      }

      // Guest fallback (works for any guest or token with id)
      if (decoded.id) {
        socket.user = {
          _id: decoded.id,
          username: decoded.username || `Guest_${String(decoded.id).slice(-4)}`,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${decoded.id}`,
          isGuest: true,
        };
        return next();
      }

      next(new Error('User not found'));
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.user?.username || 'Guest'})`);

    // Join room
    socket.on('room:join', async ({ roomId }) => {
      socket.join(roomId);
      socket.currentRoom = roomId;

      if (!roomParticipants.has(roomId)) {
        roomParticipants.set(roomId, new Map());
      }
      roomParticipants.get(roomId).set(socket.id, {
        userId: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar,
        socketId: socket.id,
      });

      // Broadcast updated participant list
      const participants = Array.from(roomParticipants.get(roomId).values());
      io.to(roomId).emit('room:participants', { participants });

      // Notify others someone joined
      socket.to(roomId).emit('room:user_joined', {
        username: socket.user.username,
        avatar: socket.user.avatar,
      });

      console.log(`👥 ${socket.user.username} joined room ${roomId}`);
    });

    // Synchronized Activity Change across partners
    socket.on('room:activity_change', ({ roomId, activity }) => {
      if (!roomId || !activity) return;
      const LocalDb = require('../config/localDb');
      LocalDb.updateRoom(roomId, { currentActivity: activity });
      if (require('mongoose').connection.readyState === 1) {
        const Room = require('../models/Room');
        Room.findOneAndUpdate({ roomId }, { currentActivity: activity }).catch(() => {});
      }
      // Broadcast to everyone in the room
      io.to(roomId).emit('room:activity_change', {
        activity,
        username: socket.user.username,
      });
    });

    // Real-time Romantic Reactions (Hearts, Kisses, Sparkles, Candles)
    socket.on('room:reaction', ({ roomId, emoji }) => {
      if (!roomId || !emoji) return;
      io.to(roomId).emit('room:reaction', {
        emoji,
        username: socket.user.username,
        timestamp: Date.now(),
      });
    });

    // Leave room
    socket.on('room:leave', ({ roomId }) => {
      leaveRoom(socket, roomId, io);
    });

    // Register feature handlers
    handleChat(socket, io);
    handleMovie(socket, io);
    handleMusic(socket, io);
    handleWhiteboard(socket, io, roomParticipants);
    handleGame(socket, io);
    handleWebRTC(socket, io);

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        leaveRoom(socket, socket.currentRoom, io);
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const leaveRoom = (socket, roomId, io) => {
  socket.leave(roomId);
  const participants = roomParticipants.get(roomId);
  if (participants) {
    participants.delete(socket.id);
    const updatedList = Array.from(participants.values());
    io.to(roomId).emit('room:participants', { participants: updatedList });
    socket.to(roomId).emit('room:user_left', { username: socket.user.username });
  }
};

module.exports = { initSocket };
