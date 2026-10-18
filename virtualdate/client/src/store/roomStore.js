import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  room: null,
  participants: [],
  messages: [],
  currentActivity: 'chat',
  movieState: { url: '', playing: false, currentTime: 0 },
  musicState: { videoId: '', title: '', playing: false, currentTime: 0 },
  gameState: { url: '', type: 'embed' },

  setRoom: (room) => set({ room }),
  setParticipants: (participants) => set({ participants }),
  addMessage: (message) => set((state) => {
    if (!message) return state;
    // 1. Prevent duplicate by exact _id
    if (message._id && state.messages.some((m) => m._id === message._id)) {
      return state;
    }
    // 2. Prevent duplicate of optimistic messages: if this matches a pending temp message with same text
    const tempIdx = state.messages.findIndex(
      (m) => String(m._id || '').startsWith('temp_') && m.text === message.text
    );
    if (tempIdx !== -1) {
      const updated = [...state.messages];
      updated[tempIdx] = message;
      return { messages: updated };
    }
    return { messages: [...state.messages, message] };
  }),
  setMessages: (messages) => set({ messages }),
  setCurrentActivity: (activity) => set({ currentActivity: activity }),
  setMovieState: (movieState) => set((state) => ({ movieState: { ...state.movieState, ...movieState } })),
  setMusicState: (musicState) => set((state) => ({ musicState: { ...state.musicState, ...musicState } })),
  setGameState: (gameState) => set({ gameState }),
  clearRoom: () => set({
    room: null,
    participants: [],
    messages: [],
    currentActivity: 'chat',
    movieState: { url: '', playing: false, currentTime: 0 },
    musicState: { videoId: '', title: '', playing: false, currentTime: 0 },
    gameState: { url: '', type: 'embed' },
  }),
}));
