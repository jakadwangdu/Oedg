const handleWebRTC = (socket, io) => {
  // Ring/Call notification to partner
  socket.on('webrtc:call_user', ({ roomId, isAudioOnly }) => {
    if (!roomId) return;
    socket.to(roomId).emit('webrtc:incoming_call', {
      fromSocketId: socket.id,
      fromUsername: socket.user?.username || 'Partner',
      fromAvatar: socket.user?.avatar,
      isAudioOnly: !!isAudioOnly,
    });
  });

  // Decline/Reject call
  socket.on('webrtc:reject_call', ({ targetSocketId, roomId }) => {
    if (targetSocketId) {
      socket.to(targetSocketId).emit('webrtc:call_rejected', {
        fromUsername: socket.user?.username || 'Partner',
      });
    } else if (roomId) {
      socket.to(roomId).emit('webrtc:call_rejected', {
        fromUsername: socket.user?.username || 'Partner',
      });
    }
  });

  // Relay offer to another peer in the room
  socket.on('webrtc:offer', ({ roomId, offer, targetSocketId }) => {
    const payload = {
      offer,
      fromSocketId: socket.id,
      user: {
        username: socket.user?.username || 'Partner',
        avatar: socket.user?.avatar,
      },
    };

    if (targetSocketId) {
      socket.to(targetSocketId).emit('webrtc:offer', payload);
    } else {
      socket.to(roomId).emit('webrtc:offer', payload);
    }
  });

  // Relay answer to the specific peer
  socket.on('webrtc:answer', ({ targetSocketId, answer }) => {
    if (targetSocketId) {
      socket.to(targetSocketId).emit('webrtc:answer', {
        answer,
        fromSocketId: socket.id,
      });
    }
  });

  // Relay ICE candidate
  socket.on('webrtc:candidate', ({ targetSocketId, candidate, roomId }) => {
    if (targetSocketId) {
      socket.to(targetSocketId).emit('webrtc:candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    } else if (roomId) {
      socket.to(roomId).emit('webrtc:candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    }
  });

  // Screen share status broadcast
  socket.on('webrtc:screen_status', ({ roomId, isScreenSharing }) => {
    if (roomId) {
      socket.to(roomId).emit('webrtc:screen_status', {
        socketId: socket.id,
        isScreenSharing: !!isScreenSharing,
        username: socket.user?.username || 'Partner',
      });
    }
  });

  // User ended or hung up call
  socket.on('webrtc:leave', ({ roomId }) => {
    if (roomId) {
      socket.to(roomId).emit('webrtc:peer_left', { socketId: socket.id });
    }
  });
};

module.exports = { handleWebRTC };
