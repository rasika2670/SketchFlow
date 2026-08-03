import { create } from 'zustand';
import * as tasksApi from '@/api/tasks.api';
import toast from 'react-hot-toast';

/**
 * Status column definitions used by the Kanban board.
 */
export const TASK_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#81819A' },
  { id: 'in_progress', label: 'In Progress', color: '#38BDF8' },
  { id: 'review', label: 'Review', color: '#FBBF24' },
  { id: 'done', label: 'Done', color: '#34D399' },
];

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low', color: '#81819A' },
  { id: 'medium', label: 'Medium', color: '#FBBF24' },
  { id: 'high', label: 'High', color: '#F97316' },
  { id: 'urgent', label: 'Urgent', color: '#FB7185' },
];

export const useTaskStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  tasks: [],
  selectedTask: null,
  filters: {
    status: null,
    assignee_id: null,
    priority: null,
  },
  isLoading: false,

  // ─── Derived: group tasks by status ─────────────────────────────────────────
  getTasksByStatus: () => {
    const { tasks, filters } = get();
    const grouped = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    tasks.forEach((task) => {
      // Apply client-side filters (server already filters but we double-check for live updates)
      if (filters.status && task.status !== filters.status) return;
      if (filters.assignee_id && task.assignee_id !== filters.assignee_id) return;
      if (filters.priority && task.priority !== filters.priority) return;

      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  },

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  fetchTasks: async (boardId) => {
    set({ isLoading: true });
    try {
      const { data } = await tasksApi.listByBoard(boardId, get().filters);
      const tasksList = data.data?.tasks || data.tasks || [];
      set({ tasks: tasksList, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to load tasks.';
      toast.error(message);
    }
  },

  // ─── CRUD Actions ───────────────────────────────────────────────────────────

  createTask: async (boardId, taskData) => {
    try {
      const { data } = await tasksApi.create(boardId, taskData);
      const task = data.data?.task || data.task;
      // Socket will add the task to state; no optimistic add needed here
      // since the REST response arrives quickly and socket broadcasts.
      // But add it defensively to avoid a gap.
      set((state) => {
        if (state.tasks.some((t) => t.id === task.id)) return state;
        return { tasks: [...state.tasks, task] };
      });
      toast.success('Task created!');
      return task;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create task.';
      toast.error(message);
      return null;
    }
  },

  convertFromSticky: async (boardId, elementId, taskData) => {
    try {
      const { data } = await tasksApi.convertFromSticky(boardId, {
        element_id: elementId,
        ...taskData,
      });
      const task = data.data?.task || data.task;
      set((state) => {
        if (state.tasks.some((t) => t.id === task.id)) return state;
        return { tasks: [...state.tasks, task] };
      });
      toast.success('Sticky note converted to task!');
      return task;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to convert sticky note.';
      toast.error(message);
      return null;
    }
  },

  updateTask: async (taskId, updates, version) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    try {
      const { data } = await tasksApi.update(taskId, updates, version);
      const task = data.data?.task || data.task;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
      return task;
    } catch (error) {
      // Rollback — refetch
      const message = error.response?.data?.message || 'Failed to update task.';
      toast.error(message);
      return null;
    }
  },

  updateTaskStatus: async (taskId, status, version) => {
    // Optimistic: move the card immediately
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status } : t
      ),
    }));

    try {
      const { data } = await tasksApi.updateStatus(taskId, status, version);
      const task = data.data?.task || data.task;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
      return task;
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks });
      const message = error.response?.data?.message || 'Failed to update status.';
      toast.error(message);
      return null;
    }
  },

  assignTask: async (taskId, assigneeId, version) => {
    try {
      const { data } = await tasksApi.assignTask(taskId, assigneeId, version);
      const task = data.data?.task || data.task;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
      return task;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to assign task.';
      toast.error(message);
      return null;
    }
  },

  deleteTask: async (taskId) => {
    // Optimistic removal
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
    }));

    try {
      await tasksApi.remove(taskId);
    } catch (error) {
      // Rollback
      set({ tasks: previousTasks });
      const message = error.response?.data?.message || 'Failed to delete task.';
      toast.error(message);
    }
  },

  // ─── Socket-driven state mutations ──────────────────────────────────────────

  /** Upsert a task from a socket event */
  upsertTask: (task) => {
    set((state) => {
      const exists = state.tasks.find((t) => t.id === task.id);
      if (exists) {
        return {
          tasks: state.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
        };
      }
      return { tasks: [...state.tasks, task] };
    });
  },

  /** Remove a task by id (from socket) */
  removeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
    }));
  },

  // ─── Selection & Filters ────────────────────────────────────────────────────

  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({ filters: { status: null, assignee_id: null, priority: null } });
  },

  // ─── Reset ──────────────────────────────────────────────────────────────────
  reset: () => {
    set({
      tasks: [],
      selectedTask: null,
      filters: { status: null, assignee_id: null, priority: null },
      isLoading: false,
    });
  },
}));
