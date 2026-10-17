import axios from 'axios';

// Use VITE_API_URL if configured, otherwise relative /api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default api;
