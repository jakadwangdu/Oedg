# 🌙 VirtualDate

A cozy, aesthetic real-time web platform where couples and close friends can go on virtual dates — watch movies together in sync, chat, video/voice call, listen to music, play games, and draw on a collaborative whiteboard.

---

## ✨ Features

- 🎬 **Watch Together**: Synchronized YouTube player — host plays, pauses, or seeks, and partner's screen automatically syncs in real-time.
- 💬 **Room Chat**: Real-time messaging with avatars, timestamps, and romantic emoji quick-reactions.
- 📹 **Video & Voice Calling**: Agora WebRTC powered face-to-face video and voice chat with mute/camera toggle, plus a floating Picture-in-Picture window so you can see each other while doing activities.
- 🎵 **Music Sync**: Shared YouTube audio player with a rotating vinyl record animation and cozy chill / lofi playlists.
- 🎨 **Collaborative Whiteboard**: Real-time HTML5 canvas whiteboard with custom color palette and brush sizes.
- 🎮 **Game Room**: Built-in real-time Tic-Tac-Toe and embedded web games (Skribbl.io, Gartic Phone, Chess, etc.).
- 🚪 **Virtual Rooms**: UUID-based shareable private rooms, participant live indicators, and auto-cleanup.
- 👤 **Profiles & Auth**: Secure JWT authentication, custom username, bios, and avatar upload support.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Zustand, Socket.IO Client, Agora RTC SDK, Fabric.js / HTML5 Canvas
- **Backend**: Node.js, Express, Socket.IO, Mongoose, JWT, bcryptjs, Cloudinary
- **Database**: MongoDB (Atlas Cloud or local)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v26)
- **MongoDB**: Free MongoDB Atlas cluster or local MongoDB instance

---

### 2. Backend Setup

```bash
cd virtualdate/server
npm install
```

Create a `.env` file in `virtualdate/server/` (copy from `.env.example`):
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/virtualdate?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here

# Optional: Agora.io (for video calls)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# Optional: Cloudinary (for avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend:
```bash
npm run dev
# Server will run on http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd virtualdate/client
npm install
npm run dev
# Client will run on http://localhost:5173
```

---

## 💡 Notes on Free External Services

1. **MongoDB**: You can get a free 512MB cloud database at [MongoDB Atlas](https://cloud.mongodb.com).
2. **Video Calling**: Uses [Agora.io](https://www.agora.io) which includes **10,000 free minutes/month**. If not configured, the video component defaults to a local camera preview so you can test camera and microphone right away without an account.
3. **YouTube Movie & Music**: Runs completely free with no API keys needed via the YouTube IFrame API.
