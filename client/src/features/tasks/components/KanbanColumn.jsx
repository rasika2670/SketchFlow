import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

/**
 * KanbanColumn — a droppable column representing a task status.
 * Renders as a collapsible section in the sidebar's vertical layout.
 */
export default function KanbanColumn({ status, tasks, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-sf-md border transition-all duration-sf-fast
        ${isOver
          ? 'border-primary-500/50 bg-primary-500/5'
          : 'border-slate-700/50 bg-slate-800/30'
        }
      `}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: status.color }}
        />
        <span className="text-sf-xs font-semibold text-slate-300 uppercase tracking-wider flex-1">
          {status.label}
        </span>
        <span className="text-sf-xs text-slate-500 font-medium tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div className="px-1.5 pb-1.5 space-y-1.5 min-h-[4px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
}
