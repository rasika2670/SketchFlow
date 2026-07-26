import { useEffect, useRef, useCallback } from 'react';
import throttle from 'lodash.throttle';
import { getBoardSocket } from './socket';
import { usePresenceStore } from '@/stores/presenceStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const CURSOR_THROTTLE_MS = 66; // ~15 FPS
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

/**
 * usePresence — tracks cursor positions and user presence in a board room.
 *
 * @param {string} boardId — The board to track presence for
 */
export function usePresence(boardId) {
  const heartbeatRef = useRef(null);
  const throttledCursorRef = useRef(null);

  // ─── Send cursor position (canvas coordinates) ──────────────────────────
  const sendCursorMove = useCallback(
    (canvasX, canvasY) => {
      const socket = getBoardSocket();
      if (!socket?.connected || !boardId) return;

      if (!throttledCursorRef.current) {
        throttledCursorRef.current = throttle((x, y) => {
          socket.emit('cursor:move', { boardId, x, y });
        }, CURSOR_THROTTLE_MS);
      }

      throttledCursorRef.current(canvasX, canvasY);
    },
    [boardId]
  );

  useEffect(() => {
    if (!boardId) return;

    const socket = getBoardSocket();
    if (!socket) return;

    const currentUserId = useAuthStore.getState().user?.id;

    // ─── Emit presence join ─────────────────────────────────────────────
    socket.emit('presence:join', { boardId });

    // ─── Heartbeat every 30s ────────────────────────────────────────────
    heartbeatRef.current = setInterval(() => {
      socket.emit('presence:heartbeat', { boardId });
    }, HEARTBEAT_INTERVAL_MS);

    // ─── Presence listeners ─────────────────────────────────────────────

    const handleUserJoined = (user) => {
      if ((user.userId || user.id) === currentUserId) return;
      usePresenceStore.getState().addUser(user);
      toast(`${user.userName || user.name} joined the board`, { icon: '👋', duration: 2000 });
    };

    const handleUserLeft = ({ userId }) => {
      if (userId === currentUserId) return;
      const user = usePresenceStore.getState().onlineUsers[userId];
      usePresenceStore.getState().removeUser(userId);
      if (user) {
        toast(`${user.name} left the board`, { icon: '👋', duration: 2000 });
      }
    };

    const handleUserAway = ({ userId }) => {
      // Optionally mark as away — for now just ignore until they fully leave
    };

    const handleCursorMoved = ({ userId, x, y }) => {
      if (userId === currentUserId) return;
      usePresenceStore.getState().updateCursor(userId, { x, y });
    };

    const handlePresenceList = (users) => {
      usePresenceStore.getState().setOnlineUsers(users);
    };

    socket.on('presence:user_joined', handleUserJoined);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('presence:user_away', handleUserAway);
    socket.on('cursor:moved', handleCursorMoved);
    socket.on('presence:list', handlePresenceList);

    // ─── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      socket.emit('presence:leave', { boardId });

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      if (throttledCursorRef.current) {
        throttledCursorRef.current.cancel();
        throttledCursorRef.current = null;
      }

      socket.off('presence:user_joined', handleUserJoined);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('presence:user_away', handleUserAway);
      socket.off('cursor:moved', handleCursorMoved);
      socket.off('presence:list', handlePresenceList);

      usePresenceStore.getState().clearAll();
    };
  }, [boardId]);

  return { sendCursorMove };
}
