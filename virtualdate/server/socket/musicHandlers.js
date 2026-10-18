const Room = require('../models/Room');
const LocalDb = require('../config/localDb');

const handleMusic = (socket, io) => {
  socket.on('music:load', ({ roomId, videoId, title, url, artist, cover }) => {
    if (!roomId) return;
    const musicState = {
      videoId: videoId || '',
      title: title || '',
      url: url || '',
      artist: artist || '',
      cover: cover || '',
      playing: true,
      currentTime: 0,
      updatedBy: socket.user?.username || 'Teammate',
    };

    io.to(roomId).emit('music:sync', musicState);

    try {
      LocalDb.updateRoom(roomId, { musicState });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { musicState }).catch(() => {});
      }
    } catch (e) {}
  });

  socket.on('music:play', ({ roomId, currentTime }) => {
    if (!roomId) return;
    const time = currentTime || 0;
    io.to(roomId).emit('music:sync', { playing: true, currentTime: time, updatedBy: socket.user?.username });

    try {
      LocalDb.updateRoom(roomId, { 'musicState.playing': true, 'musicState.currentTime': time });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { 'musicState.playing': true, 'musicState.currentTime': time }).catch(() => {});
      }
    } catch (e) {}
  });

  socket.on('music:pause', ({ roomId, currentTime }) => {
    if (!roomId) return;
    const time = currentTime || 0;
    io.to(roomId).emit('music:sync', { playing: false, currentTime: time, updatedBy: socket.user?.username });

    try {
      LocalDb.updateRoom(roomId, { 'musicState.playing': false, 'musicState.currentTime': time });
      if (require('mongoose').connection.readyState === 1) {
        Room.findOneAndUpdate({ roomId }, { 'musicState.playing': false, 'musicState.currentTime': time }).catch(() => {});
      }
    } catch (e) {}
  });

  socket.on('music:seek', ({ roomId, currentTime }) => {
    if (!roomId) return;
    io.to(roomId).emit('music:sync', { currentTime: currentTime || 0, updatedBy: socket.user?.username });
  });
};

module.exports = { handleMusic };
