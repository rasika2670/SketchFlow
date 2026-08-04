import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * MessageInput — compact textarea with Enter-to-send and Shift+Enter for newlines.
 * Auto-grows up to 4 lines.
 */
export default function MessageInput({ boardId, parentId = null, placeholder = 'Type a message...' }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const currentUser = useAuthStore((s) => s.user);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    const payload = { message: trimmed };
    if (parentId) payload.parent_id = parentId;

    await sendMessage(boardId, payload, currentUser);
    setText('');
    setIsSending(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isSending, boardId, parentId, sendMessage, currentUser]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-grow textarea
  const handleInput = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'; // max ~4 lines
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-slate-700/50 p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="
            flex-1 resize-none bg-slate-800 border border-slate-700 rounded-sf-md
            px-3 py-2 text-sf-sm text-slate-50 placeholder:text-slate-500
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30
            transition-colors duration-sf-fast
          "
          style={{ minHeight: '36px', maxHeight: '96px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="
            flex-shrink-0 p-2 rounded-sf-md
            bg-primary-500 text-white
            hover:bg-primary-600 active:bg-primary-700
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-sf-fast
          "
          title="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
