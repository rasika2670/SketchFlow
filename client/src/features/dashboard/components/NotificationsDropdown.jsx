import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pendingInvites = useWorkspaceStore((state) => state.pendingInvites);
  const fetchInvites = useWorkspaceStore((state) => state.fetchInvites);
  const acceptInvite = useWorkspaceStore((state) => state.acceptInvite);
  const declineInvite = useWorkspaceStore((state) => state.declineInvite);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = pendingInvites.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-hover transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-default rounded-sf-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="px-4 py-3 border-b border-default bg-raised font-medium text-text-primary flex justify-between items-center shrink-0">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {pendingInvites.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-sm">
                No new notifications.
              </div>
            ) : (
              <ul className="divide-y divide-default">
                {pendingInvites.map((invite) => (
                  <li key={invite.id} className="p-4 hover:bg-surface-hover transition-colors">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-text-primary">
                        <span className="font-semibold">{invite.invited_by_name}</span> invited you to join <span className="font-semibold">{invite.workspace_name}</span>
                      </p>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-text-secondary">
                          {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptInvite(invite.id)}
                            className="p-1.5 text-success hover:bg-success/10 rounded transition-colors tooltip"
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => declineInvite(invite.id)}
                            className="p-1.5 text-error hover:bg-error/10 rounded transition-colors tooltip"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
