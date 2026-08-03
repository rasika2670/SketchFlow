import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Flag, User } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { TASK_PRIORITIES } from '@/stores/taskStore';

/**
 * TaskCard — a draggable card displaying task summary.
 * Used inside KanbanColumn and as the DragOverlay ghost.
 */
export default function TaskCard({ task, onClick, isDragOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isDragOverlay,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const priority = TASK_PRIORITIES.find((p) => p.id === task.priority);
  const hasDueDate = !!task.due_date;
  const dueDate = hasDueDate ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && task.status !== 'done';

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`
        group relative px-3 py-2.5 rounded-sf-sm cursor-pointer select-none
        bg-slate-800/80 border border-slate-700/60
        hover:border-slate-600 hover:bg-slate-700/60
        transition-all duration-sf-fast
        ${isDragging ? 'opacity-40' : ''}
        ${isDragOverlay ? 'shadow-sf-drag rotate-[2deg] border-primary-500/40 bg-slate-800' : ''}
      `}
    >
      {/* Title */}
      <p className="text-sf-sm text-slate-100 font-medium leading-snug line-clamp-2 mb-1.5">
        {task.title || 'Untitled task'}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority badge */}
        {priority && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-sf-sm"
            style={{
              color: priority.color,
              backgroundColor: `${priority.color}15`,
            }}
          >
            <Flag size={10} />
            {priority.label}
          </span>
        )}

        {/* Due date */}
        {hasDueDate && (
          <span
            className={`
              inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-sf-sm
              ${isOverdue
                ? 'text-error bg-error/10'
                : 'text-slate-400'
              }
            `}
          >
            <Calendar size={10} />
            {format(dueDate, 'MMM d')}
          </span>
        )}

        {/* Assignee */}
        {task.assignee_name && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
            <User size={10} />
            {task.assignee_name.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  );
}
