import { useEffect } from 'react';
import { getBoardSocket } from './socket';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * useChatSocket — listens for real-time chat events on the board socket
 * and pushes them into the chat store.
 *
 * Chat events are broadcast from the REST controllers via getIO(),
 * so this hook only listens (no client-initiated chat events).
 *
 * Follows the same pattern as useTaskSocket.js.
 *
 * @param {string} boardId — The board to listen for chat events on
 */
export function useChatSocket(boardId) {
  useEffect(() => {
    if (!boardId) return;

    const socket = getBoardSocket();
    if (!socket) return;

    const currentUserId = useAuthStore.getState().user?.id;

    // ─── Socket event handlers ───────────────────────────────────────────

    const handleNewMessage = (message) => {
      // Avoid duplicating if we're the sender (optimistic already added it)
      if (message.user_id === currentUserId) return;
      useChatStore.getState().addMessage(message);

      // If thread view is open and this is a reply to the current thread parent
      const { threadParent } = useChatStore.getState();
      if (threadParent && message.parent_id === threadParent.id) {
        useChatStore.getState().addThreadMessage(message);
      }
    };

    const handleMessageUpdated = (message) => {
      if (message.user_id === currentUserId) return;
      if (message.id) {
        useChatStore.getState().updateMessage(message.id, message);
      }
    };

    const handleMessageDeleted = ({ id }) => {
      if (id) {
        useChatStore.getState().removeMessage(id);
      }
    };

    // ─── Register listeners ──────────────────────────────────────────────
    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:updated', handleMessageUpdated);
    socket.on('chat:deleted', handleMessageDeleted);

    // On reconnect, reload messages
    const handleReconnect = () => {
      useChatStore.getState().clearMessages();
      useChatStore.getState().fetchMessages(boardId);
    };
    socket.io.on('reconnect', handleReconnect);

    // ─── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:updated', handleMessageUpdated);
      socket.off('chat:deleted', handleMessageDeleted);
      socket.io.off('reconnect', handleReconnect);
      useChatStore.getState().reset();
    };
  }, [boardId]);
}
