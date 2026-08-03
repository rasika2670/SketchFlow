import { useEffect } from 'react';
import { getBoardSocket } from './socket';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import * as tasksApi from '@/api/tasks.api';

/**
 * useTaskSocket — listens for real-time task events on the board socket
 * and pushes them into the task store.
 *
 * Task events are broadcast from the REST controllers via getIO(),
 * so this hook only listens (no client-initiated task events).
 *
 * @param {string} boardId — The board to listen for task events on
 */
export function useTaskSocket(boardId) {
  useEffect(() => {
    if (!boardId) return;

    const socket = getBoardSocket();
    if (!socket) return;

    const currentUserId = useAuthStore.getState().user?.id;
    const store = useTaskStore.getState();

    // ─── Load initial tasks via REST ──────────────────────────────────────
    const loadTasks = async () => {
      try {
        const { data } = await tasksApi.listByBoard(boardId);
        const tasks = data.data?.tasks || data.tasks || [];
        useTaskStore.setState({ tasks, isLoading: false });
      } catch (err) {
        console.error('[useTaskSocket] Failed to load tasks:', err);
      }
    };

    loadTasks();

    // ─── Socket event handlers ───────────────────────────────────────────

    const handleTaskCreated = ({ task, userId }) => {
      // Avoid duplicating if we're the creator (REST response already added it)
      if (userId === currentUserId) return;
      useTaskStore.getState().upsertTask(task);
    };

    const handleTaskUpdated = ({ task, userId }) => {
      if (userId === currentUserId) return;
      useTaskStore.getState().upsertTask(task);
    };

    const handleTaskStatusChanged = ({ task, userId }) => {
      if (userId === currentUserId) return;
      useTaskStore.getState().upsertTask(task);
    };

    const handleTaskAssigned = ({ task, userId }) => {
      if (userId === currentUserId) return;
      useTaskStore.getState().upsertTask(task);
    };

    const handleTaskDeleted = ({ taskId, userId }) => {
      if (userId === currentUserId) return;
      useTaskStore.getState().removeTask(taskId);
    };

    // ─── Register listeners ──────────────────────────────────────────────
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:status_changed', handleTaskStatusChanged);
    socket.on('task:assigned', handleTaskAssigned);
    socket.on('task:deleted', handleTaskDeleted);

    // On reconnect, reload tasks
    const handleReconnect = () => {
      loadTasks();
    };
    socket.io.on('reconnect', handleReconnect);

    // ─── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:status_changed', handleTaskStatusChanged);
      socket.off('task:assigned', handleTaskAssigned);
      socket.off('task:deleted', handleTaskDeleted);
      socket.io.off('reconnect', handleReconnect);
      useTaskStore.getState().reset();
    };
  }, [boardId]);
}
