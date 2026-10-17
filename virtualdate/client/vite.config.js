import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dimension Design System Theme Definition
export const dimensionTheme = {
  name: 'dimension-dusk',
  colors: {
    voidCanvas: '#0a0a0a',
    graphite: '#161616',
    frostedGlass: 'rgba(212, 212, 212, 0.1)',
    inkBlack: '#000000',
    snowWhite: '#ffffff',
    bone: '#ededed',
    ash: '#c2c2c2',
    slate: '#686868',
    smoke: '#b2b2b2',
    hairline: 'rgba(229, 229, 229, 0.14)',
    duskViolet: 'linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0) 40%, rgba(107, 98, 242, 0.565) 50%, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0))',
  },
  typography: {
    display: "'DM Sans', -apple-system, sans-serif",
    editorial: "'Geist', -apple-system, sans-serif",
    mono: "'Geist Mono', monospace",
  },
  radii: {
    pill: '9999px',
    card: '24px',
    ui: '10px',
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __THEME__: JSON.stringify(dimensionTheme),
  },
  server: {
    host: true, // Listen on all network interfaces
    port: 5173,
    allowedHosts: true, // Allow all tunnel hosts (e.g. trycloudflare.com)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
});
