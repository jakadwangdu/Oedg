import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data, token: data.token, loading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }
      },

      register: async (username, email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', { username, email, password });
          set({ user: data, token: data.token, loading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }
      },

      logout: () => {
        set({ user: null, token: null });
        delete api.defaults.headers.common['Authorization'];
      },

      guestLogin: async (customUsername) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/guest', { username: customUsername });
          set({ user: data, token: data.token, loading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true, user: data };
        } catch (err) {
          const msg = err.response?.data?.message || 'Guest login failed';
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'vd-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
