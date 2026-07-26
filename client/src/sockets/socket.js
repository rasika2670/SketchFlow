import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

/**
 * Board Socket — separate from the global socket in socketManager.js.
 *
 * The global socket handles workspace-level events (invites, member updates).
 * This board socket handles real-time canvas operations: element CRUD,
 * presence, cursor tracking, and element locking.
 *
 * autoConnect: false — we manually connect when entering the board page
 * and disconnect when leaving.
 */

let boardSocket = null;

let SOCKET_URL = import.meta.env.VITE_WS_URL;

if (!SOCKET_URL) {
  if (import.meta.env.DEV) {
    // In dev mode, if VITE_WS_URL is missing, default to the backend server
    SOCKET_URL = 'http://localhost:5000';
  } else {
    // In production, fallback to same-origin if no specific WS URL is provided
    SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
  }
}

/**
 * Connect the board socket with the current access token.
 * @param {string} [token] — override token (optional; reads from authStore by default)
 * @returns {import('socket.io-client').Socket}
 */
export const connectBoardSocket = (token) => {
  if (boardSocket?.connected) return boardSocket;

  const accessToken = token || useAuthStore.getState().accessToken;
  if (!accessToken) {
    console.warn('[BoardSocket] No access token available');
    return null;
  }

  boardSocket = io(SOCKET_URL, {
    auth: { token: accessToken },
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: Infinity,
  });

  // ─── Connection Status → uiStore ──────────────────────────────────────────

  boardSocket.on('connect', () => {
    console.log('[BoardSocket] Connected:', boardSocket.id);
    useUIStore.getState().setConnectionStatus('connected');
  });

  boardSocket.on('disconnect', (reason) => {
    console.log('[BoardSocket] Disconnected:', reason);
    useUIStore.getState().setConnectionStatus('disconnected');
  });

  boardSocket.io.on('reconnect_attempt', (attempt) => {
    console.log('[BoardSocket] Reconnect attempt:', attempt);
    useUIStore.getState().setConnectionStatus('connecting');
  });

  boardSocket.io.on('reconnect', () => {
    console.log('[BoardSocket] Reconnected');
    useUIStore.getState().setConnectionStatus('connected');
  });

  // ─── Reauthentication on connect_error ────────────────────────────────────

  boardSocket.on('connect_error', async (err) => {
    console.error('[BoardSocket] Connect error:', err.message);

    if (
      err.message === 'Access token expired' ||
      err.message === 'Authentication failed' ||
      err.message === 'AUTH_ERROR' ||
      err.message === 'TOKEN_EXPIRED'
    ) {
      try {
        const newToken = await useAuthStore.getState().refreshToken();
        if (newToken && boardSocket) {
          boardSocket.auth.token = newToken;
          boardSocket.connect();
        }
      } catch {
        console.error('[BoardSocket] Token refresh failed, logging out');
        useAuthStore.getState().logout();
      }
    }
  });

  boardSocket.connect();
  useUIStore.getState().setConnectionStatus('connecting');

  return boardSocket;
};

/**
 * Disconnect the board socket and clean up.
 */
export const disconnectBoardSocket = () => {
  if (boardSocket) {
    boardSocket.removeAllListeners();
    boardSocket.disconnect();
    boardSocket = null;
    useUIStore.getState().setConnectionStatus('disconnected');
  }
};

/**
 * Get the current board socket instance.
 * @returns {import('socket.io-client').Socket | null}
 */
export const getBoardSocket = () => boardSocket;
