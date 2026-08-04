import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '@/features/shared/LoadingSpinner';

/**
 * Format a date into a human-readable day separator label.
 */
function formatDaySeparator(date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/**
 * MessageList — scrollable list of chat messages with infinite scroll up.
 * Messages are stored newest-first in the store, but displayed oldest-at-top
 * (reversed for rendering) so the user sees the most recent messages at the bottom.
 */
export default function MessageList({ boardId }) {
  const messages = useChatStore((s) => s.messages);
  const hasMore = useChatStore((s) => s.hasMore);
  const isLoading = useChatStore((s) => s.isLoading);
  const loadMore = useChatStore((s) => s.loadMore);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const wasAtBottomRef = useRef(true);

  // Reverse messages so oldest are at top, newest at bottom
  const displayMessages = [...messages].reverse();

  // ─── Auto-scroll to bottom on new message ─────────────────────────────
  useEffect(() => {
    if (wasAtBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Track whether user is near the bottom
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    wasAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // ─── Infinite scroll up with IntersectionObserver ─────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore(boardId);
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [boardId, hasMore, isLoading, loadMore]);

  // ─── Scroll to bottom on initial load ─────────────────────────────────
  useEffect(() => {
    if (containerRef.current && displayMessages.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayMessages.length === 0]); // Only on transition from 0 to loaded

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 py-2"
    >
      {/* Sentinel for infinite scroll — at the top */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-3">
          <LoadingSpinner size={20} />
        </div>
      )}

      {/* No more messages indicator */}
      {!hasMore && displayMessages.length > 0 && (
        <p className="text-center text-sf-xs text-slate-500 py-2">
          Beginning of conversation
        </p>
      )}

      {/* Empty state */}
      {!isLoading && displayMessages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <p className="text-sf-base text-slate-400 font-medium">No messages yet</p>
          <p className="text-sf-sm text-slate-500 mt-1">
            Start the conversation below
          </p>
        </div>
      )}

      {/* Messages with day separators */}
      {displayMessages.map((msg, index) => {
        const msgDate = new Date(msg.created_at);
        const prevMsg = index > 0 ? displayMessages[index - 1] : null;
        const showDaySeparator =
          !prevMsg || !isSameDay(msgDate, new Date(prevMsg.created_at));

        return (
          <div key={msg.id}>
            {showDaySeparator && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-slate-700/50" />
                <span className="text-sf-xs text-slate-500 font-medium whitespace-nowrap">
                  {formatDaySeparator(msgDate)}
                </span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>
            )}
            <MessageBubble message={msg} boardId={boardId} />
          </div>
        );
      })}
    </div>
  );
}
