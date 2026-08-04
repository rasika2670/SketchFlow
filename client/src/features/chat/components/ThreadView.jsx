import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import LoadingSpinner from '@/features/shared/LoadingSpinner';
import Avatar from '@/features/shared/Avatar';
import { formatDistanceToNow } from 'date-fns';

/**
 * ThreadView — slide-in overlay showing parent message + threaded replies.
 * Renders its own MessageInput scoped to the parent message.
 */
export default function ThreadView({ boardId }) {
  const threadParent = useChatStore((s) => s.threadParent);
  const threadMessages = useChatStore((s) => s.threadMessages);
  const isThreadLoading = useChatStore((s) => s.isThreadLoading);
  const closeThread = useChatStore((s) => s.closeThread);

  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new replies arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadMessages.length]);

  if (!threadParent) return null;

  const parentUser = {
    id: threadParent.user_id,
    name: threadParent.user_name || 'Unknown',
    avatar_url: threadParent.user_avatar_url,
  };

  const parentTimestamp = threadParent.created_at
    ? formatDistanceToNow(new Date(threadParent.created_at), { addSuffix: true })
    : '';

  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col z-10 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700">
        <button
          onClick={closeThread}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-sf-sm transition-colors"
          title="Back to chat"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sf-sm font-semibold text-slate-200">Thread</span>
        <span className="text-sf-xs text-slate-500">
          {threadMessages.length} {threadMessages.length === 1 ? 'reply' : 'replies'}
        </span>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        {/* Parent message (highlighted) */}
        <div className="mb-3 pb-3 border-b border-slate-700/50">
          <div className="flex gap-2.5">
            <div className="flex-shrink-0 mt-0.5">
              <Avatar user={parentUser} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sf-sm font-semibold text-slate-200">
                  {parentUser.name}
                </span>
                <span className="text-[11px] text-slate-500">{parentTimestamp}</span>
              </div>
              <p className="text-sf-sm text-slate-300 whitespace-pre-wrap break-words mt-0.5">
                {threadParent.message}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isThreadLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size={20} />
          </div>
        )}

        {/* Replies */}
        {threadMessages.map((reply) => (
          <MessageBubble key={reply.id} message={reply} boardId={boardId} />
        ))}

        {/* No replies yet */}
        {!isThreadLoading && threadMessages.length === 0 && (
          <p className="text-center text-sf-sm text-slate-500 py-4">
            No replies yet. Start the conversation!
          </p>
        )}
      </div>

      {/* Thread reply input */}
      <MessageInput
        boardId={boardId}
        parentId={threadParent.id}
        placeholder="Reply in thread..."
      />
    </div>
  );
}
