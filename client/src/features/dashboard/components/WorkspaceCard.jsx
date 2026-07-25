import { useNavigate } from 'react-router-dom';
import { Users, LayoutGrid } from 'lucide-react';

export default function WorkspaceCard({ workspace }) {
  const navigate = useNavigate();

  const memberCount = workspace.member_count ?? workspace.memberCount ?? 0;
  const boardCount = workspace.board_count ?? workspace.boardCount ?? 0;

  return (
    <button
      onClick={() => navigate(`/workspaces/${workspace.id}`)}
      className="sf-card group text-left w-full relative overflow-hidden hover:border-sf-hover hover:shadow-sf-overlay cursor-pointer transition-all duration-sf-normal"
      id={`workspace-card-${workspace.id}`}
    >
      {/* Top accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-500 via-accent to-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-sf-normal" />

      {/* Workspace name */}
      <h3 className="text-sf-lg font-semibold text-slate-50 mb-sf-1 group-hover:text-primary-400 transition-colors duration-sf-fast truncate">
        {workspace.name}
      </h3>

      {/* Description */}
      {workspace.description ? (
        <p className="text-sf-sm text-slate-400 mb-sf-4 line-clamp-2 min-h-[40px]">
          {workspace.description}
        </p>
      ) : (
        <p className="text-sf-sm text-slate-500 italic mb-sf-4 min-h-[40px]">
          No description
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-sf-4 text-sf-xs text-slate-400">
        <span className="flex items-center gap-sf-1">
          <Users size={14} className="text-slate-500" />
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        <span className="flex items-center gap-sf-1">
          <LayoutGrid size={14} className="text-slate-500" />
          {boardCount} {boardCount === 1 ? 'board' : 'boards'}
        </span>
      </div>
    </button>
  );
}
