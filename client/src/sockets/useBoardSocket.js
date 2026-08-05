import { useEffect, useRef } from 'react';
import { getBoardSocket } from './socket';
import { useCanvasStore } from '@/stores/canvasStore';
import * as elementsApi from '@/api/elements.api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

/**
 * useBoardSocket — manages board room join/leave and element real-time events.
 *
 * @param {string} boardId — The board to join
 */
export function useBoardSocket(boardId) {
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!boardId) return;

    const socket = getBoardSocket();
    if (!socket) return;

    const currentUserId = useAuthStore.getState().user?.id;

    // ─── Fetch initial elements via REST ───────────────────────────────────
    const loadElements = async () => {
      try {
        const { data } = await elementsApi.listByBoard(boardId);
        const elements = data.data?.elements || data.elements || [];
        useCanvasStore.getState().setElements(elements);
      } catch (err) {
        console.error('[useBoardSocket] Failed to load elements:', err);
        toast.error('Failed to load board elements');
      }
    };

    // ─── Join board room ──────────────────────────────────────────────────
    const handleJoined = ({ boardId: joinedBoardId }) => {
      console.log('[useBoardSocket] Joined board:', joinedBoardId);
      hasJoined.current = true;
      loadElements();
    };

    // ─── Element events ──────────────────────────────────────────────────

    const handleElementCreated = ({ element, userId, tempId }) => {
      const store = useCanvasStore.getState();

      if (userId === currentUserId && tempId) {
        // This is our own creation — reconcile the temp element with server data
        const consumed = store.consumePendingTemp(tempId);
        if (consumed) {
          store.replaceTempElement(tempId, element);
          return;
        }
      }

      // From another user, or no tempId — add normally (addElement deduplicates by id)
      store.addElement(element);
    };

    const handleElementUpdated = ({ element }) => {
      // Always update our local store to ensure we capture the new 'version'
      // from the server, preventing 409 Conflict errors on subsequent edits.
      useCanvasStore.getState().updateElement(element.id, element);
    };

    const handleElementMoved = ({ elementId, x, y, version }) => {
      // Always sync to get the new 'version'
      useCanvasStore.getState().updateElement(elementId, { x, y, version });
    };

    const handleElementDeleted = ({ elementId, userId }) => {
      if (userId !== currentUserId) {
        useCanvasStore.getState().removeElement(elementId);
      }
    };

    const handleElementConflict = ({ elementId, message }) => {
      toast.error(message || 'Conflict detected — refreshing element...');
      // Refetch the element from the full list
      loadElements();
    };

    const handleBoardStateSync = ({ elements }) => {
      // Full state resync (e.g. after reconnect)
      useCanvasStore.getState().setElements(elements || []);
    };

    // ─── Register listeners ───────────────────────────────────────────────
    socket.on('board:joined', handleJoined);
    socket.on('element:created', handleElementCreated);
    socket.on('element:updated', handleElementUpdated);
    socket.on('element:moved', handleElementMoved);
    socket.on('element:deleted', handleElementDeleted);
    socket.on('element:conflict', handleElementConflict);
    socket.on('board:state:sync', handleBoardStateSync);

    // Emit join
    socket.emit('board:join', { boardId });

    // On reconnect, rejoin the board
    const handleReconnect = () => {
      socket.emit('board:join', { boardId });
    };
    socket.io.on('reconnect', handleReconnect);

    // ─── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      socket.emit('board:leave', { boardId });
      socket.off('board:joined', handleJoined);
      socket.off('element:created', handleElementCreated);
      socket.off('element:updated', handleElementUpdated);
      socket.off('element:moved', handleElementMoved);
      socket.off('element:deleted', handleElementDeleted);
      socket.off('element:conflict', handleElementConflict);
      socket.off('board:state:sync', handleBoardStateSync);
      socket.io.off('reconnect', handleReconnect);
      hasJoined.current = false;
    };
  }, [boardId]);
}
