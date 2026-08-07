import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { usePresenceStore } from '@/stores/presenceStore';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '@/features/shared/Avatar';
import ConnectionStatus from './ConnectionStatus';
import BoardSettingsModal from './BoardSettingsModal';

/**
 * BoardHeader — fixed top bar with board navigation, presence avatars, and connection status.
 * Glassmorphism styling consistent with canvas floating elements.
 */
export default function BoardHeader({ board }) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const [showSettings, setShowSettings] = useState(false);

  const onlineUserList = Object.values(onlineUsers).filter(
    (u) => u.id !== currentUser?.id
  );

  const handleBack = () => {
    if (board?.workspace_id) {
      navigate(`/workspaces/${board.workspace_id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-40">
      {/* Left section — back + board name */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-sf-sm text-slate-400 hover:text-slate-50 hover:bg-slate-700/50 transition-colors"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="h-5 w-px bg-slate-700" />

        <h1 className="text-sf-lg font-semibold text-slate-50 truncate max-w-[240px]">
          {board?.name || 'Loading...'}
        </h1>
      </div>

      {/* Center section — Connection status */}
      <ConnectionStatus />

      {/* Right section — Presence avatars + settings */}
      <div className="flex items-center gap-3">
        {/* Online user avatars (show max 5) */}
        <div className="flex items-center -space-x-2">
          {onlineUserList.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="relative"
              title={user.name}
            >
              <Avatar
                user={{ id: user.id, name: user.name, avatar_url: user.avatar_url }}
                size="sm"
              />
              {/* Online indicator dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-slate-900" />
            </div>
          ))}
          {onlineUserList.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-medium ring-2 ring-slate-900">
              +{onlineUserList.length - 5}
            </div>
          )}
        </div>

        {/* Current user avatar */}
        {currentUser && (
          <div className="relative" title={`${currentUser.name} (you)`}>
            <Avatar user={currentUser} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-slate-900" />
          </div>
        )}

        {/* Settings gear */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded-sf-sm text-slate-400 hover:text-slate-50 hover:bg-slate-700/50 transition-colors"
          title="Board settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <BoardSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          board={board}
          onDeleted={handleBack}
        />
      )}
    </header>
  );
}
