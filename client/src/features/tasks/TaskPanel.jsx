import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useTaskStore, TASK_STATUSES } from '@/stores/taskStore';
import { useParams } from 'react-router-dom';

import KanbanColumn from './components/KanbanColumn';
import TaskCard from './components/TaskCard';
import TaskFilters from './components/TaskFilters';
import CreateTaskModal from './components/CreateTaskModal';
import TaskDetailModal from './components/TaskDetailModal';
import { Plus, Loader2 } from 'lucide-react';

/**
 * TaskPanel — main Kanban board rendered inside the Right Sidebar's "Tasks" tab.
 * Implements @dnd-kit DndContext for drag-and-drop across status columns.
 */
export default function TaskPanel() {
  const { boardId } = useParams();
  const tasks = useTaskStore((s) => s.tasks);
  const isLoading = useTaskStore((s) => s.isLoading);
  const getTasksByStatus = useTaskStore((s) => s.getTasksByStatus);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const selectedTask = useTaskStore((s) => s.selectedTask);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const grouped = useMemo(() => getTasksByStatus(), [tasks, getTasksByStatus]);

  // Find the task currently being dragged
  const activeTask = useMemo(
    () => (activeId ? tasks.find((t) => t.id === activeId) : null),
    [activeId, tasks]
  );

  // DnD sensors — require 5px of movement to start drag (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id; // Column id is the status string

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic status update via store (handles rollback on error)
    updateTaskStatus(taskId, newStatus, task.version);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={24} className="text-primary-400 animate-spin-slow mb-2" />
        <p className="text-sf-sm text-slate-400">Loading tasks…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header — filters + create button */}
      <div className="flex items-center justify-between mb-3">
        <TaskFilters />
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-2 py-1.5 text-sf-xs font-medium text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-sf-sm transition-colors"
          title="Create task"
          id="create-task-btn"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex flex-row overflow-x-auto gap-4 p-1">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={grouped[status.id] || []}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        {/* Drag overlay — rendered outside columns for smooth cross-column drag */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCard task={activeTask} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create task modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        boardId={boardId}
      />

      {/* Task detail modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        boardId={boardId}
      />
    </div>
  );
}
