# Oedg — QuiteSpace

> A dusk-lit, real-time shared workspace for friends to connect, stream, draw, play, and talk.

[![Vercel Deployment](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![GitHub License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Design](https://img.shields.io/badge/Design_System-Dimension-6b62f2)](https://github.com/jakadwangdu/Oedg)

---

## ✦ Overview

**Oedg** is an intimate Space sanctuary built with pure React, Socket.IO, WebRTC, and the editorial **Dimension** aesthetic (frosted glass panels, 9999px pills, DM Sans medium typography, and 1px hairline edges).

It enables two or more people to share interactive moments in real time across smartphones, tablets, and laptops without required account registrations or friction.

---

## ✨ Features

- 🎬 **Universal Cinema Sync**: Synchronize playback, pause, and seeking for YouTube videos, direct video streams (`.mp4`, `.webm`, `.m3u8`, `.mov`), and embedded web players.
- 🎵 **Dhun Music & Audio Player**: Curated lofi, starlight romance, and rain audio streams, alongside full integration with the [Dhun Music Player](https://music.lancebuddy.in) and custom stream links.
- 📹 **Encrypted Video Calling**: Direct peer-to-peer WebRTC video and voice calling with automatic STUN routing, camera/mic toggles, and incoming call ringing modals.
- 🖥️ **Screen Sharing**: One-click screen sharing across laptops and supported mobile browsers with real-time video track replacement.
- 🎨 **Real-Time Canvas**: Collaborative whiteboard with live stroke broadcasting, customizable colors from the Dimension palette, emoji stamp placement, and pointer awareness.
- 🎮 **Arcade Games**: Built-in real-time Tic-Tac-Toe and embedded web games (Skribbl.io, Gartic Phone, Smash Karts, Lichess, or any custom URL).
- 💬 ** Notes & Pulse Reactions**: Real-time optimistic messaging, and instant status updates.
- 📱 **QR Code Direct Entry**: Generate a scannable QR code or link for instant mobile access with zero signup required for your Friends.
---

## 🎨 Dimension Design System

Built following the dusk-lit AI workspace paradigm:
- **Void Canvas (`#0a0a0a`)**: Deep matte-black background surface.
- **Graphite (`#161616`)**: Elevated surface for cards, modal drawers, and floating panels.
- **Frosted Glass (`rgba(212, 212, 212, 0.1)`)**: Translucent blur overlays with 12px backdrop filtering.
- **Snow White (`#ffffff`)**: Inverted high-contrast pill CTAs and primary focal points.
- **Bone (`#ededed`)**: Primary readable typography.
- **Dusk Violet (`#6b62f2`)**: Subtle signature chromatic pulse accent.
- **Hairlines (`1px solid rgba(229, 229, 229, 0.14)`)**: Crisp definition without heavy drop shadows.

---

## 📁 Repository Structure

```
Oedg/
├── vercel.json                 # Vercel deployment configuration & SPA routing
├── package.json                # Root orchestration scripts
├── .gitignore                  # Git exclusions for builds & secrets
├── virtualdate/
│   ├── client/                 # Vite + React Frontend SPA
│   │   ├── src/
│   │   │   ├── components/     # Media players, call grid, canvas, games, chat
│   │   │   ├── pages/          # LandingPage, AuthPage, DashboardPage, RoomPage
│   │   │   ├── services/       # Axios API client & Socket.IO client
│   │   │   └── store/          # Zustand auth and room state management
│   │   ├── vercel.json         # Client-level SPA rewrites
│   │   └── package.json
│   └── server/                 # Express + Socket.IO Backend
│       ├── controllers/        # Auth, user, and room management
│       ├── models/             # Mongoose schemas (with LocalDb resilience fallback)
│       ├── routes/             # REST endpoints (/api/auth, /api/rooms)
│       ├── socket/             # Real-time WebRTC, chat, movie, music, and game handlers
│       ├── config/             # Dual-engine DB (Atlas + Local JSON)
│       └── server.js
└── README.md
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** v18+ (tested with Node 20 & 22)
- **npm** or **pnpm**

### 2. Clone the Repository
```bash
git clone https://github.com/jakadwangdu/Oedg.git
cd Oedg
```

### 3. Install Dependencies
```bash
# Install client dependencies
cd virtualdate/client
npm install

# Install server dependencies
cd ../server
npm install
```

### 4. Run the Dev Environment
- **Terminal 1 (Backend)**:
  ```bash
  cd virtualdate/server
  node server.js
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  cd virtualdate/client
  npm run dev
  ```

Open `http://localhost:5173` in your browser.

---

