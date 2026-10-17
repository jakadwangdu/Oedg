const Room = require('../models/Room');
const LocalDb = require('../config/localDb');

// In-memory strokes cache per room for instant sync
const roomStrokes = new Map();

const handleWhiteboard = (socket, io, roomParticipants) => {
  // Draw event - broadcast immediately to everyone else
  socket.on('wb:draw', ({ roomId, canvasJSON }) => {
    if (!roomId || !canvasJSON) return;

    if (!roomStrokes.has(roomId)) {
      roomStrokes.set(roomId, []);
    }
    const strokes = roomStrokes.get(roomId);
    strokes.push(canvasJSON);
    if (strokes.length > 2000) strokes.shift();

    // Broadcast to everyone except sender
    socket.to(roomId).emit('wb:update', { canvasJSON });

    // Non-blocking background persistence
    try {
      LocalDb.updateRoom(roomId, { 'whiteboardState.canvasJSON': JSON.stringify(strokes) });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { 'whiteboardState.canvasJSON': JSON.stringify(strokes) }).catch(() => {});
      }
    } catch (e) {}
  });

  // Live cursor / pointer movement
  socket.on('wb:pointer', ({ roomId, x, y, isDrawing, color }) => {
    if (!roomId) return;
    socket.to(roomId).emit('wb:pointer', {
      userId: socket.user?._id,
      username: socket.user?.username || 'Partner',
      x,
      y,
      isDrawing,
      color,
    });
  });

  // Clear whiteboard
  socket.on('wb:clear', ({ roomId }) => {
    if (!roomId) return;
    roomStrokes.set(roomId, []);
    io.to(roomId).emit('wb:cleared');

    try {
      LocalDb.updateRoom(roomId, { 'whiteboardState.canvasJSON': '' });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { 'whiteboardState.canvasJSON': '' }).catch(() => {});
      }
    } catch (e) {}
  });

  // Send current canvas state to newly joined user
  socket.on('wb:request_state', async ({ roomId }) => {
    if (!roomId) return;
    try {
      const memoryStrokes = roomStrokes.get(roomId);
      if (memoryStrokes && memoryStrokes.length > 0) {
        socket.emit('wb:state', { strokes: memoryStrokes });
        return;
      }

      const room = LocalDb.getRoom(roomId);
      if (room && room.whiteboardState?.canvasJSON) {
        try {
          const parsed = JSON.parse(room.whiteboardState.canvasJSON);
          socket.emit('wb:state', { strokes: Array.isArray(parsed) ? parsed : [parsed] });
          return;
        } catch (pe) {}
      }

      if (require('mongoose').connection.readyState === 1) {
        const mgRoom = await Room.findOne({ roomId });
        if (mgRoom && mgRoom.whiteboardState?.canvasJSON) {
          const parsed = JSON.parse(mgRoom.whiteboardState.canvasJSON);
          socket.emit('wb:state', { strokes: Array.isArray(parsed) ? parsed : [parsed] });
        }
      }
    } catch (err) {}
  });
};

module.exports = { handleWhiteboard };
