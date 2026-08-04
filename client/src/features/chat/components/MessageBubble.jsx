import { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Reply, Pencil, Trash2, Check, X, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '@/features/shared/Avatar';

/**
 * MessageBubble — renders a single chat message.
 * Own messages have a subtle primary tint.
 * Hover reveals action buttons (edit, delete for own; reply for all).
 */
function MessageBubble({ message, boardId }) {
  const currentUser = useAuthStore((s) => s.user);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMsg = useChatStore((s) => s.deleteMsg);
  const fetchThreadReplies = useChatStore((s) => s.fetchThreadReplies);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const isOwn = currentUser?.id === message.user_id;
  const isOptimistic = message._optimistic;

  const user = {
    id: message.user_id,
    name: message.user_name || 'Unknown',
    avatar_url: message.user_avatar_url,
  };

  const timestamp = message.created_at
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
    : '';

  const wasEdited = message.updated_at && message.created_at &&
    new Date(message.updated_at).getTime() - new Date(message.created_at).getTime() > 1000;

  // ─── Edit handlers ───────────────────────────────────────────────────
  const startEdit = () => {
    setEditText(message.message);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== message.message) {
      editMessage(boardId, message.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // ─── Thread handler ──────────────────────────────────────────────────
  const openThread = () => {
    fetchThreadReplies(boardId, message.id);
  };

  return (
    <div
      className={`
        group relative flex gap-2 w-full mb-3 transition-opacity duration-sf-fast
        ${isOwn ? 'flex-row-reverse' : 'flex-row'}
        ${isOptimistic ? 'opacity-60' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <Avatar user={user} size="sm" />
      </div>

      {/* Message Content Container */}
      <div className={`flex flex-col max-w-[75%] min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Name and Timestamp */}
        <div className={`flex items-baseline gap-1.5 mb-1 mx-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[11px] font-medium text-slate-400 truncate">
            {isOwn ? 'You' : user.name}
          </span>
          <span className="text-[10px] text-slate-500 flex-shrink-0">
            {timestamp}
          </span>
        </div>

        {/* Bubble */}
        <div className={`
          relative px-3 py-2 text-sf-sm whitespace-pre-wrap break-words leading-relaxed shadow-sm
          ${isOwn 
            ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm' 
            : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700/50'
          }
        `}>
          {isEditing ? (
            <div className="min-w-[200px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className={`
                  w-full resize-none min-h-[32px] p-1.5 rounded-sf-sm outline-none bg-black/20
                  ${isOwn ? 'text-white placeholder-white/50' : 'text-slate-200'}
                `}
                rows={2}
                autoFocus
              />
              <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? 'text-white/80' : 'text-slate-400'}`}>
                <button
                  onClick={saveEdit}
                  className="p-1 hover:bg-black/20 rounded-sf-sm transition-colors"
                  title="Save"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1 hover:bg-black/20 rounded-sf-sm transition-colors"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
                <span className="text-[10px] ml-1 opacity-75">
                  Enter to save · Esc to cancel
                </span>
              </div>
            </div>
          ) : (
            <>
              {message.message}
              {wasEdited && (
                <span className={`inline-block ml-2 text-[10px] italic ${isOwn ? 'text-white/60' : 'text-slate-500'}`}>
                  (edited)
                </span>
              )}
            </>
          )}
        </div>

        {/* Thread indicator */}
        {message.reply_count > 0 && !isEditing && (
          <button
            onClick={openThread}
            className={`
              inline-flex items-center gap-1 mt-1 text-[11px] transition-colors font-medium
              ${isOwn ? 'text-primary-400 hover:text-primary-300' : 'text-slate-400 hover:text-slate-300'}
            `}
          >
            <MessageSquare size={12} />
            {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Action buttons (hover) */}
      {isHovered && !isEditing && !isOptimistic && (
        <div className={`
          flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-sf-sm shadow-sf-raised px-1 py-0.5 self-center
          ${isOwn ? 'mr-1' : 'ml-1'}
        `}>
          {!message.parent_id && (
            <button
              onClick={openThread}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-sf-sm transition-colors"
              title="Reply in thread"
            >
              <Reply size={13} />
            </button>
          )}

          {isOwn && (
            <>
              <button
                onClick={startEdit}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-sf-sm transition-colors"
                title="Edit message"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => deleteMsg(boardId, message.id)}
                className="p-1 text-slate-400 hover:text-error hover:bg-error/10 rounded-sf-sm transition-colors"
                title="Delete message"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(MessageBubble);
