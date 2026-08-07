import { create } from 'zustand';
import * as chatApi from '@/api/chat.api';
import toast from 'react-hot-toast';

const MESSAGE_LIMIT = 50;

/**
 * Generate a temporary ID for optimistic message insertion.
 * Replaced by server ID once the POST response arrives.
 */
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  messages: [],
  hasMore: true,
  isLoading: false,
  cursor: null,
  unreadCount: 0,

  // Thread view state
  threadParent: null,
  threadMessages: [],
  isThreadLoading: false,

  // ─── Unread Count ───────────────────────────────────────────────────────────
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),

  // ─── Fetch initial messages ─────────────────────────────────────────────────
  fetchMessages: async (boardId) => {
    set({ isLoading: true });
    try {
      const { data } = await chatApi.getMessages(boardId, { limit: MESSAGE_LIMIT });
      const messages = Array.isArray(data.data) ? data.data : [];
      
      let cursor = null;
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        cursor = { cursor_created_at: lastMsg.created_at, cursor_id: lastMsg.id };
      }

      set({
        messages,
        hasMore: messages.length >= MESSAGE_LIMIT,
        cursor,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('[chatStore] Failed to fetch messages:', error);
    }
  },

  // ─── Load older messages (infinite scroll up) ──────────────────────────────
  loadMore: async (boardId) => {
    const { hasMore, isLoading, cursor } = get();
    if (!hasMore || isLoading || !cursor) return;

    set({ isLoading: true });
    try {
      const { data } = await chatApi.getMessages(boardId, {
        cursor_created_at: cursor.cursor_created_at,
        cursor_id: cursor.cursor_id,
        limit: MESSAGE_LIMIT,
      });
      const olderMessages = Array.isArray(data.data) ? data.data : [];
      
      let nextCursor = null;
      if (olderMessages.length > 0) {
        const lastMsg = olderMessages[olderMessages.length - 1];
        nextCursor = { cursor_created_at: lastMsg.created_at, cursor_id: lastMsg.id };
      }

      set((state) => ({
        // Append older messages at the end (messages are newest-first from API)
        messages: [...state.messages, ...olderMessages],
        hasMore: olderMessages.length >= MESSAGE_LIMIT,
        cursor: nextCursor,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      console.error('[chatStore] Failed to load more messages:', error);
    }
  },

  // ─── Send message (optimistic) ─────────────────────────────────────────────
  sendMessage: async (boardId, messageData, currentUser) => {
    const tempId = generateTempId();

    // Optimistic: insert at beginning (newest first)
    const optimisticMessage = {
      id: tempId,
      message: messageData.message,
      parent_id: messageData.parent_id || null,
      user_id: currentUser?.id,
      user_name: currentUser?.name,
      user_avatar_url: currentUser?.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_count: 0,
      _optimistic: true,
    };

    set((state) => ({
      messages: [optimisticMessage, ...state.messages],
    }));

    try {
      const { data } = await chatApi.sendMessage(boardId, messageData);
      const serverMessage = data.data; // The server returns the message object directly

      // Replace optimistic message with server version
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId ? { ...serverMessage, _optimistic: false } : m
        ),
      }));

      return serverMessage;
    } catch (error) {
      // Remove optimistic message on failure
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempId),
      }));
      const message = error.response?.data?.message || 'Failed to send message.';
      toast.error(message);
      return null;
    }
  },

  // ─── Edit message ──────────────────────────────────────────────────────────
  editMessage: async (boardId, messageId, newText) => {
    // Optimistic
    const previousMessages = get().messages;
    const previousThreadMessages = get().threadMessages;
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, message: newText, updated_at: new Date().toISOString() } : m
      ),
      threadMessages: state.threadMessages.map((m) =>
        m.id === messageId ? { ...m, message: newText, updated_at: new Date().toISOString() } : m
      ),
    }));

    try {
      await chatApi.updateMessage(boardId, messageId, { message: newText });
    } catch (error) {
      // Rollback
      set({ messages: previousMessages, threadMessages: previousThreadMessages });
      const message = error.response?.data?.message || 'Failed to edit message.';
      toast.error(message);
    }
  },

  // ─── Delete message ────────────────────────────────────────────────────────
  deleteMsg: async (boardId, messageId) => {
    const previousMessages = get().messages;
    const previousThreadMessages = get().threadMessages;
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
      threadMessages: state.threadMessages.filter((m) => m.id !== messageId),
    }));

    try {
      await chatApi.deleteMessage(boardId, messageId);
    } catch (error) {
      set({ messages: previousMessages, threadMessages: previousThreadMessages });
      const message = error.response?.data?.message || 'Failed to delete message.';
      toast.error(message);
    }
  },

  // ─── Socket-driven mutations ───────────────────────────────────────────────

  /** Add a new message from socket (deduplicates by ID) */
  addMessage: (message) => {
    set((state) => {
      // Deduplicate: skip if we already have this message or a temp version was replaced
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [message, ...state.messages] };
    });
  },

  /** Update an existing message from socket */
  updateMessage: (messageId, updates) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m
      ),
      threadMessages: state.threadMessages.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m
      ),
    }));
  },

  /** Remove a message from socket */
  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
      threadMessages: state.threadMessages.filter((m) => m.id !== messageId),
    }));
  },

  // ─── Thread support ────────────────────────────────────────────────────────

  fetchThreadReplies: async (boardId, parentId) => {
    const parent = get().messages.find((m) => m.id === parentId);
    set({ threadParent: parent || { id: parentId }, isThreadLoading: true, threadMessages: [] });

    try {
      const { data } = await chatApi.getThreadReplies(boardId, parentId);
      const replies = Array.isArray(data.data) ? data.data : [];
      set({ threadMessages: replies, isThreadLoading: false });
    } catch (error) {
      set({ isThreadLoading: false });
      console.error('[chatStore] Failed to fetch thread replies:', error);
      toast.error('Failed to load thread replies.');
    }
  },

  addThreadMessage: (message) => {
    set((state) => {
      if (state.threadMessages.some((m) => m.id === message.id)) return state;
      return { threadMessages: [...state.threadMessages, message] };
    });

    // Also increment reply_count on the parent in the main messages list
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === message.parent_id
          ? { ...m, reply_count: (m.reply_count || 0) + 1 }
          : m
      ),
    }));
  },

  closeThread: () => {
    set({ threadParent: null, threadMessages: [], isThreadLoading: false });
  },

  // ─── Reset ─────────────────────────────────────────────────────────────────
  clearMessages: () => {
    set({
      messages: [],
      hasMore: true,
      isLoading: false,
      cursor: null,
    });
  },

  reset: () => {
    set({
      messages: [],
      hasMore: true,
      isLoading: false,
      cursor: null,
      threadParent: null,
      threadMessages: [],
      isThreadLoading: false,
    });
  },
}));
