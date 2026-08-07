import { useState } from 'react';
import { UserPlus, MoreVertical, Shield, Pencil, Eye, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import Avatar from '@/features/shared/Avatar';
import ConfirmDialog from '@/features/shared/ConfirmDialog';
import InviteMemberModal from './InviteMemberModal';

// ─── Consistent role color mapping ──────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    bgClass: 'bg-primary-500/15',
    textClass: 'text-primary-400',
    borderClass: 'border-primary-500/30',
    icon: Shield,
  },
  editor: {
    label: 'Editor',
    bgClass: 'bg-accent/15',
    textClass: 'text-accent',
    borderClass: 'border-accent/30',
    icon: Pencil,
  },
  viewer: {
    label: 'Viewer',
    bgClass: 'bg-slate-500/15',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-500/30',
    icon: Eye,
  },
};

function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;
  return (
    <span
      className={`inline-flex items-center gap-1 px-sf-2 py-0.5 rounded-sf-pill text-[11px] font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {config.label}
    </span>
  );
}

export default function MemberList({
  workspaceId,
  members,
  isAdmin,
  currentUserId,
}) {
  const { removeMember, updateMemberRole } = useWorkspaceStore();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // member id
  const [confirmRemove, setConfirmRemove] = useState(null); // member to remove
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRoleChange = async (userId, newRole) => {
    setActiveMenu(null);
    await updateMemberRole(workspaceId, userId, newRole);
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove) return;
    setIsRemoving(true);
    const userId = confirmRemove.user_id || confirmRemove.id;
    await removeMember(workspaceId, userId);
    setIsRemoving(false);
    setConfirmRemove(null);
  };

  return (
    <div className="bg-sf-raised border border-slate-700 rounded-sf-lg p-sf-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-sf-4">
        <h3 className="text-sf-sm font-semibold text-slate-200 uppercase tracking-wider">
          Members ({members.length})
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-sf-1 px-sf-2 py-sf-1 rounded-sf-sm text-sf-xs text-primary-400 hover:bg-primary-500/10 transition-colors duration-sf-fast"
            id="invite-member-button"
          >
            <UserPlus size={14} />
            Invite
          </button>
        )}
      </div>

      {/* Member List */}
      <ul className="space-y-sf-1">
        {members.map((member) => {
          const userId = member.user_id || member.id;
          const isCurrentUser = userId === currentUserId;
          const memberUser = member.user || member;

          return (
            <li
              key={userId}
              className="flex items-center gap-sf-3 px-sf-2 py-sf-2 rounded-sf-sm hover:bg-slate-700/30 transition-colors duration-sf-fast group"
            >
              <Avatar
                user={{
                  id: userId,
                  name: memberUser.name || member.name,
                  avatar_url: memberUser.avatar_url || member.avatar_url,
                }}
                size="sm"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sf-sm text-slate-200 truncate">
                  {memberUser.name || member.name}
                  {isCurrentUser && (
                    <span className="text-slate-500 ml-1">(you)</span>
                  )}
                </p>
                <p className="text-sf-xs text-slate-500 truncate">
                  {memberUser.email || member.email}
                </p>
              </div>

              <RoleBadge role={member.role} />

              {/* Admin actions menu */}
              {isAdmin && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveMenu(activeMenu === userId ? null : userId)
                    }
                    className="p-sf-1 rounded-sf-sm text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-300 hover:bg-slate-700 transition-all duration-sf-fast"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeMenu === userId && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-sf-raised border border-slate-700 rounded-sf-md shadow-sf-floating z-20 animate-fade-in">
                      <div className="py-sf-1">
                        <p className="px-sf-3 py-sf-1 text-sf-xs text-slate-500 uppercase tracking-wider">
                          Change Role
                        </p>
                        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(userId, role)}
                            disabled={member.role === role}
                            className={`w-full text-left px-sf-3 py-sf-2 text-sf-sm flex items-center gap-sf-2 transition-colors duration-sf-fast ${
                              member.role === role
                                ? 'text-slate-500 cursor-default'
                                : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-50'
                            }`}
                          >
                            <config.icon size={14} />
                            {config.label}
                            {member.role === role && (
                              <span className="ml-auto text-sf-xs text-slate-500">
                                Current
                              </span>
                            )}
                          </button>
                        ))}

                        <div className="border-t border-slate-700 my-sf-1" />

                        <button
                          onClick={() => {
                            setActiveMenu(null);
                            setConfirmRemove(member);
                          }}
                          className="w-full text-left px-sf-3 py-sf-2 text-sf-sm text-error hover:bg-error/10 flex items-center gap-sf-2 transition-colors duration-sf-fast"
                        >
                          <Trash2 size={14} />
                          Remove Member
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId}
      />

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${
          confirmRemove?.user?.name || confirmRemove?.name || 'this member'
        } from the workspace? They will lose access to all boards.`}
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </div>
  );
}
