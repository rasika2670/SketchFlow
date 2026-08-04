import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ThreadView from './components/ThreadView';

/**
 * ChatPanel — real-time board chat panel displayed inside the right sidebar.
 * Layout: MessageList (scrollable) + MessageInput (fixed bottom).
 * When a thread is active, ThreadView overlays the main chat.
 */
export default function ChatPanel() {
  const { boardId } = useParams();
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const threadParent = useChatStore((s) => s.threadParent);

  useEffect(() => {
    if (boardId) {
      fetchMessages(boardId);
    }
  }, [boardId, fetchMessages]);

  return (
    <div className="flex flex-col h-full -m-4 relative">
      {/* Main chat view */}
      <div className="flex flex-col flex-1 min-h-0">
        <MessageList boardId={boardId} />
        <MessageInput boardId={boardId} />
      </div>

      {/* Thread overlay */}
      {threadParent && (
        <ThreadView boardId={boardId} />
      )}
    </div>
  );
}
