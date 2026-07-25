import { create } from 'zustand';
import * as boardsApi from '@/api/boards.api';
import toast from 'react-hot-toast';

export const useBoardStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  boards: [],
  currentBoard: null,
  isLoading: false,

  // ─── Actions ────────────────────────────────────────────────────────────────

  // Fetch all boards in a workspace
  fetchBoards: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const { data } = await boardsApi.listByWorkspace(workspaceId);
      const boardsList = data.data?.boards || data.boards || [];
      set({ boards: boardsList, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to load boards.';
      toast.error(message);
    }
  },

  // Create a new board
  createBoard: async ({ name, workspaceId }) => {
    try {
      const { data } = await boardsApi.create({ name, workspaceId });
      const board = data.data?.board || data.board;
      set((state) => ({
        boards: [...state.boards, board],
      }));
      toast.success('Board created!');
      return board;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create board.';
      toast.error(message);
      return null;
    }
  },

  // Update a board
  updateBoard: async (boardId, data) => {
    try {
      const { data: res } = await boardsApi.update(boardId, data);
      const updated = res.data?.board || res.board;
      set((state) => ({
        boards: state.boards.map((b) =>
          b.id === boardId ? { ...b, ...updated } : b
        ),
        currentBoard:
          state.currentBoard?.id === boardId
            ? { ...state.currentBoard, ...updated }
            : state.currentBoard,
      }));
      toast.success('Board updated!');
      return updated;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update board.';
      toast.error(message);
      return null;
    }
  },

  // Delete a board
  deleteBoard: async (boardId) => {
    try {
      await boardsApi.remove(boardId);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        currentBoard:
          state.currentBoard?.id === boardId ? null : state.currentBoard,
      }));
      toast.success('Board deleted.');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete board.';
      toast.error(message);
      return false;
    }
  },

  // Set the active board
  setCurrentBoard: (board) => {
    set({ currentBoard: board });
  },

  // Clear board state
  reset: () => {
    set({
      boards: [],
      currentBoard: null,
      isLoading: false,
    });
  },
}));
