import { create } from 'zustand';
import * as authApi from '@/api/auth.api';
import { setAuthStoreAccessor } from '@/api/axios';
import { connectGlobalSocket, disconnectGlobalSocket } from '@/sockets/socketManager';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // ─── Actions ────────────────────────────────────────────────────────────────

  // Set access token (used by axios interceptor after refresh)
  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  // Initialize — called once on app load by AppInitializer
  // Attempts silent refresh to restore session from httpOnly cookie
  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data: refreshRes } = await authApi.refresh();
      const accessToken = refreshRes.data.accessToken;
      
      // Update token so getMe can use it
      set({ accessToken });
      
      const { data: meRes } = await authApi.getMe();
      
      set({
        user: meRes.data.user,
        isAuthenticated: true,
      });
      
      connectGlobalSocket();
    } catch {
      // No valid session — user needs to log in
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login(email, password);
      const user = data.data.user;
      const accessToken = data.data.accessToken;
      
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      
      connectGlobalSocket();
      
      toast.success(`Welcome back, ${user.name}!`);
      return true;
    } catch (error) {
      set({ isLoading: false });
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return false;
    }
  },

  // Register
  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.register(name, email, password);
      set({
        user: data.data.user,
        accessToken: data.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      
      connectGlobalSocket();
      
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      set({ isLoading: false });
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return false;
    }
  },

  // Logout
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors — clear state regardless
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
      disconnectGlobalSocket();
    }
  },

  // Refresh token — used by axios interceptor and socket reauthentication
  refreshToken: async () => {
    try {
      const { data } = await authApi.refresh();
      set({ accessToken: data.data.accessToken });
      return data.data.accessToken;
    } catch (error) {
      get().logout();
      throw error;
    }
  },
}));

// Register the auth store accessor with axios to break circular dependency
setAuthStoreAccessor(() => useAuthStore.getState());
