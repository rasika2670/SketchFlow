import { useTaskStore, TASK_STATUSES, TASK_PRIORITIES } from '@/stores/taskStore';
import { Filter, X } from 'lucide-react';

/**
 * TaskFilters — compact filter controls for the Kanban board header.
 * Allows filtering by priority (the most common need in a sidebar).
 */
export default function TaskFilters() {
  const filters = useTaskStore((s) => s.filters);
  const setFilters = useTaskStore((s) => s.setFilters);
  const clearFilters = useTaskStore((s) => s.clearFilters);

  const hasActiveFilters = filters.status || filters.assignee_id || filters.priority;

  return (
    <div className="flex items-center gap-1.5">
      {/* Priority quick-filter */}
      <select
        value={filters.priority || ''}
        onChange={(e) => setFilters({ priority: e.target.value || null })}
        className="bg-slate-800/60 border border-slate-700/60 rounded-sf-sm text-[11px] text-slate-300 pl-1.5 pr-5 py-1 appearance-none cursor-pointer hover:border-slate-600 transition-colors focus:outline-none focus:border-primary-500"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2381819A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 4px center',
        }}
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          title="Clear filters"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
