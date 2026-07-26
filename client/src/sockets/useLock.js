import { useEffect, useRef, useCallback } from 'react';
import { getBoardSocket } from './socket';
import { useCanvasStore } from '@/stores/canvasStore';
import toast from 'react-hot-toast';

const LOCK_HEARTBEAT_MS = 10000; // 10 seconds

/**
 * useLock — manages element-level locking to prevent simultaneous edits.
 *
 * @param {string} boardId — The current board ID
 */
export function useLock(boardId) {
  const heldLockRef = useRef(null);     // Currently held lock elementId
  const heartbeatRef = useRef(null);    // Heartbeat interval ref

  /** Request a lock on an element */
  const requestLock = useCallback(
    (elementId) => {
      const socket = getBoardSocket();
      if (!socket?.connected || !boardId) return;
      socket.emit('element:lock', { boardId, elementId });
    },
    [boardId]
  );

  /** Release a lock on an element */
  const releaseLock = useCallback(
    (elementId) => {
      const socket = getBoardSocket();
      if (!socket?.connected || !boardId) return;

      socket.emit('element:unlock', { boardId, elementId });

      if (heldLockRef.current === elementId) {
        heldLockRef.current = null;
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
      }
    },
    [boardId]
  );

  /** Release any currently held lock */
  const releaseCurrentLock = useCallback(() => {
    if (heldLockRef.current) {
      releaseLock(heldLockRef.current);
    }
  }, [releaseLock]);

  useEffect(() => {
    const socket = getBoardSocket();
    if (!socket) return;

    // ─── Lock event listeners ───────────────────────────────────────────

    const handleLockAcquired = ({ elementId }) => {
      heldLockRef.current = elementId;
      // Start heartbeat to keep the lock alive
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        socket.emit('element:lock:heartbeat', { elementId });
      }, LOCK_HEARTBEAT_MS);
    };

    const handleLocked = ({ elementId, lockedBy }) => {
      useCanvasStore.getState().lockElement(elementId, lockedBy);
    };

    const handleUnlocked = ({ elementId }) => {
      useCanvasStore.getState().unlockElement(elementId);
    };

    const handleLockDenied = ({ elementId }) => {
      const lock = useCanvasStore.getState().lockedElements[elementId];
      const name = lock?.userName || 'another user';
      toast.error(`Element is being edited by ${name}`);
    };

    socket.on('element:lock:acquired', handleLockAcquired);
    socket.on('element:locked', handleLocked);
    socket.on('element:unlocked', handleUnlocked);
    socket.on('element:lock:denied', handleLockDenied);

    // ─── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      // Release any held lock on unmount
      if (heldLockRef.current) {
        socket.emit('element:unlock', { boardId, elementId: heldLockRef.current });
        heldLockRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      socket.off('element:lock:acquired', handleLockAcquired);
      socket.off('element:locked', handleLocked);
      socket.off('element:unlocked', handleUnlocked);
      socket.off('element:lock:denied', handleLockDenied);
    };
  }, [boardId]);

  return { requestLock, releaseLock, releaseCurrentLock };
}
