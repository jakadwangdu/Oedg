const Room = require('../models/Room');
const LocalDb = require('../config/localDb');

const handleMovie = (socket, io) => {
  // Load a new video (YouTube or any video URL over the internet)
  socket.on('movie:load', ({ roomId, url, type }) => {
    if (!roomId || !url) return;
    const isYt = url.includes('youtube.com') || url.includes('youtu.be');
    const movieState = {
      url: url.trim(),
      type: type || (isYt ? 'youtube' : 'direct'),
      playing: true,
      currentTime: 0,
      updatedBy: socket.user?.username || 'Partner',
    };

    io.to(roomId).emit('movie:sync', movieState);

    try {
      LocalDb.updateRoom(roomId, { movieState });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { movieState }).catch(() => {});
      }
    } catch (e) {}
  });

  // Play
  socket.on('movie:play', ({ roomId, currentTime }) => {
    if (!roomId) return;
    const time = currentTime || 0;
    io.to(roomId).emit('movie:sync', { playing: true, currentTime: time, updatedBy: socket.user?.username });

    try {
      LocalDb.updateRoom(roomId, { 'movieState.playing': true, 'movieState.currentTime': time });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { 'movieState.playing': true, 'movieState.currentTime': time }).catch(() => {});
      }
    } catch (e) {}
  });

  // Pause
  socket.on('movie:pause', ({ roomId, currentTime }) => {
    if (!roomId) return;
    const time = currentTime || 0;
    io.to(roomId).emit('movie:sync', { playing: false, currentTime: time, updatedBy: socket.user?.username });

    try {
      LocalDb.updateRoom(roomId, { 'movieState.playing': false, 'movieState.currentTime': time });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { 'movieState.playing': false, 'movieState.currentTime': time }).catch(() => {});
      }
    } catch (e) {}
  });

  // Seek
  socket.on('movie:seek', ({ roomId, currentTime }) => {
    if (!roomId) return;
    io.to(roomId).emit('movie:sync', { currentTime: currentTime || 0, updatedBy: socket.user?.username });
  });
};

module.exports = { handleMovie };
