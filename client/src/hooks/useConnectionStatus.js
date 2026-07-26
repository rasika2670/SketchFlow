import { useEffect } from 'react';
import { getBoardSocket } from '@/sockets/socket';
import { useUIStore } from '@/stores/uiStore';
import toast from 'react-hot-toast';

/**
 * useConnectionStatus — listens to board socket events and updates uiStore.
 * Shows toast notifications on reconnect and disconnect.
 */
export function useConnectionStatus() {
  useEffect(() => {
    const socket = getBoardSocket();
    if (!socket) return;

    const handleConnect = () => {
      useUIStore.getState().setConnectionStatus('connected');
    };

    const handleDisconnect = (reason) => {
      useUIStore.getState().setConnectionStatus('disconnected');
      // Only show toast for unexpected disconnects
      if (reason !== 'io client disconnect') {
        toast.error('Connection lost. Trying to reconnect...', { duration: 3000 });
      }
    };

    const handleReconnectAttempt = () => {
      useUIStore.getState().setConnectionStatus('connecting');
    };

    const handleReconnect = () => {
      useUIStore.getState().setConnectionStatus('connected');
      toast.success('Back online!', { duration: 2000 });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
    };
  }, []);
}
