const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

const readJSON = (file) => {
  try {
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
};

const writeJSON = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local DB file:', e);
  }
};

const LocalDb = {
  // USERS
  findUser: (query) => {
    const users = readJSON(USERS_FILE);
    return users.find((u) => {
      if (query.googleId && u.googleId === query.googleId) return true;
      if (query.email && u.email?.toLowerCase() === query.email.toLowerCase()) return true;
      if (query.username && u.username?.toLowerCase() === query.username.toLowerCase()) return true;
      if (query._id && u._id === query._id) return true;
      return false;
    });
  },

  createUser: async ({ username, email, password }) => {
    const users = readJSON(USERS_FILE);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = {
      _id: uuidv4(),
      username,
      email: email.toLowerCase(),
      passwordHash,
      googleId: '',
      avatar: '',
      bio: '',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  },

  createGoogleUser: async ({ username, email, avatar, googleId }) => {
    const users = readJSON(USERS_FILE);
    const newUser = {
      _id: uuidv4(),
      username,
      email: email.toLowerCase(),
      passwordHash: '',
      googleId: googleId || '',
      avatar: avatar || '',
      bio: 'Connected via Google account ✦',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  },

  comparePassword: async (plain, hash) => {
    return bcrypt.compare(plain, hash);
  },

  updateUser: (id, updates) => {
    const users = readJSON(USERS_FILE);
    const idx = users.findIndex((u) => u._id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    writeJSON(USERS_FILE, users);
    return users[idx];
  },

  createGuestUser: (customName) => {
    const users = readJSON(USERS_FILE);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const username = customName && customName.trim() ? customName.trim() : `DateGuest_${randomNum}`;
    const newGuest = {
      _id: 'guest_' + uuidv4(),
      username,
      email: `guest_${randomNum}@virtualdate.local`,
      isGuest: true,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      bio: 'Romantic date night guest ✨',
      createdAt: new Date().toISOString(),
    };
    users.push(newGuest);
    writeJSON(USERS_FILE, users);
    return newGuest;
  },

  // ROOMS
  createRoom: ({ name, createdBy, password }) => {
    const rooms = readJSON(ROOMS_FILE);
    const newRoom = {
      roomId: uuidv4(),
      name,
      createdBy,
      password: password && password.trim() ? password.trim() : '',
      currentActivity: 'movie',
      movieState: { url: '', playing: false, currentTime: 0 },
      musicState: { videoId: '', title: '', playing: false, currentTime: 0, url: '' },
      whiteboardState: { canvasJSON: '' },
      gameState: { url: '', type: 'embed' },
      createdAt: new Date().toISOString(),
    };
    rooms.push(newRoom);
    writeJSON(ROOMS_FILE, rooms);
    return newRoom;
  },

  getRoom: (roomId) => {
    const rooms = readJSON(ROOMS_FILE);
    return rooms.find((r) => r.roomId === roomId);
  },

  updateRoom: (roomId, updates) => {
    const rooms = readJSON(ROOMS_FILE);
    const idx = rooms.findIndex((r) => r.roomId === roomId);
    if (idx === -1) return null;
    rooms[idx] = { ...rooms[idx], ...updates };
    writeJSON(ROOMS_FILE, rooms);
    return rooms[idx];
  },

  getUserRooms: (userId) => {
    const rooms = readJSON(ROOMS_FILE);
    return rooms.filter((r) => r.createdBy === userId || r.createdBy?._id === userId);
  },

  deleteRoom: (roomId) => {
    let rooms = readJSON(ROOMS_FILE);
    rooms = rooms.filter((r) => r.roomId !== roomId);
    writeJSON(ROOMS_FILE, rooms);
  },

  // MESSAGES
  addMessage: ({ roomId, sender, senderName, senderAvatar, text, type, _id, sentAt }) => {
    const messages = readJSON(MESSAGES_FILE);
    const newMsg = {
      _id: _id || uuidv4(),
      roomId,
      sender,
      senderName: senderName || (sender && typeof sender === 'object' ? sender.username : 'Partner'),
      senderAvatar: senderAvatar || (sender && typeof sender === 'object' ? sender.avatar : ''),
      text,
      type: type || 'text',
      sentAt: sentAt || new Date().toISOString(),
    };
    messages.push(newMsg);
    writeJSON(MESSAGES_FILE, messages);
    return newMsg;
  },

  getMessages: (roomId) => {
    const messages = readJSON(MESSAGES_FILE);
    return messages.filter((m) => m.roomId === roomId).slice(-100);
  },

  // INQUIRIES (Buy website & Help requests)
  createInquiry: (inquiryData) => {
    const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
    const inquiries = readJSON(INQUIRIES_FILE);
    const newInquiry = {
      _id: 'inq_' + uuidv4(),
      ...inquiryData,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    inquiries.push(newInquiry);
    writeJSON(INQUIRIES_FILE, inquiries);
    return newInquiry;
  },
};

module.exports = LocalDb;
