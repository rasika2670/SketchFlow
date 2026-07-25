import { useNavigate } from 'react-router-dom';
import { Shapes, CheckSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BoardCard({ board }) {
  const navigate = useNavigate();

  // Use actual counts when backend provides them, otherwise show placeholder
  const elementCount = board.element_count ?? board.elementCount ?? '-';
  const taskCount = board.task_count ?? board.taskCount ?? '-';

  const lastActivity = board.updated_at || board.created_at;

  return (
    <button
      onClick={() => navigate(`/boards/${board.id}`)}
      className="sf-card group text-left w-full relative overflow-hidden hover:border-sf-hover hover:shadow-sf-overlay cursor-pointer transition-all duration-sf-normal"
      id={`board-card-${board.id}`}
    >
      {/* Top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-primary-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-sf-normal" />

      {/* Board name */}
      <h3 className="text-sf-lg font-semibold text-slate-50 mb-sf-3 group-hover:text-accent transition-colors duration-sf-fast truncate">
        {board.name}
      </h3>

      {/* Stats */}
      <div className="flex items-center gap-sf-4 text-sf-xs text-slate-400 mb-sf-3">
        <span className="flex items-center gap-sf-1" title="Elements">
          <Shapes size={14} className="text-slate-500" />
          {elementCount}
        </span>
        <span className="flex items-center gap-sf-1" title="Tasks">
          <CheckSquare size={14} className="text-slate-500" />
          {taskCount}
        </span>
      </div>

      {/* Timestamp */}
      {lastActivity && (
        <div className="flex items-center gap-sf-1 text-sf-xs text-slate-500">
          <Clock size={12} />
          {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
        </div>
      )}
    </button>
  );
}
