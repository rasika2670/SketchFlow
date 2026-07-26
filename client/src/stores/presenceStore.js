import { create } from 'zustand';

// Deterministic color palette for cursor display
const CURSOR_COLORS = [
  '#38BDF8', // cyan
  '#34D399', // emerald
  '#FBBF24', // amber
  '#FB7185', // rose
  '#A78BFA', // violet
  '#F97316', // orange
  '#2DD4BF', // teal
  '#E879F9', // fuchsia
  '#60A5FA', // blue
  '#4ADE80', // green
];

/** Get a deterministic color from user ID */
const getColorForUser = (userId) => {
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

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
          color: getColorForUser(u.userId || u.id),
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
          color: getColorForUser(userId),
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
