import { create } from 'zustand';

import { getUserColor } from '@/utils/userColors';

export const usePresenceStore = create((set) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  onlineUsers: {}, // { [userId]: { id, name, avatar_url, color } }
  cursors: {},     // { [userId]: { x, y } }

  // ─── Actions ────────────────────────────────────────────────────────────────

  /** Replace entire online users map (on initial join) */
  setOnlineUsers: (users) => {
    const mapped = {};
    if (Array.isArray(users)) {
      users.forEach((u) => {
        mapped[u.userId || u.id] = {
          id: u.userId || u.id,
          name: u.userName || u.name,
          avatar_url: u.userAvatar || u.avatar_url,
          color: getUserColor(u.userId || u.id, u.userName || u.name),
        };
      });
    }
    set({ onlineUsers: mapped });
  },

  /** Add a single user to the presence list */
  addUser: (user) => {
    const userId = user.userId || user.id;
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: {
          id: userId,
          name: user.userName || user.name,
          avatar_url: user.userAvatar || user.avatar_url,
          color: getUserColor(userId, user.userName || user.name),
        },
      },
    }));
  },

  /** Remove a user from presence */
  removeUser: (userId) => {
    set((state) => {
      const updated = { ...state.onlineUsers };
      delete updated[userId];
      const updatedCursors = { ...state.cursors };
      delete updatedCursors[userId];
      return { onlineUsers: updated, cursors: updatedCursors };
    });
  },

  /** Update cursor position for a user */
  updateCursor: (userId, position) => {
    set((state) => ({
      cursors: {
        ...state.cursors,
        [userId]: position,
      },
    }));
  },

  /** Clear all presence data (on board leave) */
  clearAll: () => {
    set({ onlineUsers: {}, cursors: {} });
  },
}));
