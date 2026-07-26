import { create } from 'zustand';

export const useCanvasStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  elements: [],
  selectedIds: [],
  tool: 'select', // 'select' | 'rectangle' | 'circle' | 'sticky' | 'line' | 'text' | 'image'
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  isDrawing: false,
  fillColor: '#6E56CF', // Default fill color for new elements
  lockedElements: {}, // { [elementId]: { userId, userName } }

  // ─── Element CRUD ───────────────────────────────────────────────────────────

  /** Replace entire elements array (used on initial load / full resync) */
  setElements: (elements) => {
    set({ elements });
  },

  /** Append a new element (optimistic or from socket) */
  addElement: (element) => {
    set((state) => {
      // Prevent duplicates
      if (state.elements.some((el) => el.id === element.id)) return state;
      return { elements: [...state.elements, element] };
    });
  },

  /** Merge changes into an existing element (optimistic or from socket) */
  updateElement: (id, changes) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...changes } : el
      ),
    }));
  },

  /** Remove an element by id */
  removeElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
  },

  /** Revert an element to server state on conflict */
  revertElement: (id, serverState) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...serverState } : el
      ),
    }));
  },

  // ─── Selection ──────────────────────────────────────────────────────────────

  /** Select a single element */
  selectElement: (id) => {
    set({ selectedIds: [id] });
  },

  /** Toggle element in/out of multi-selection (Shift+click) */
  toggleSelect: (id) => {
    set((state) => {
      const exists = state.selectedIds.includes(id);
      return {
        selectedIds: exists
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id],
      };
    });
  },

  /** Select multiple elements from area selection */
  selectArea: (ids) => {
    set({ selectedIds: ids });
  },

  /** Clear all selection */
  clearSelection: () => {
    set({ selectedIds: [] });
  },

  // ─── Tools & Viewport ──────────────────────────────────────────────────────

  /** Change active drawing tool */
  setTool: (tool) => {
    set({ tool, selectedIds: [] });
  },

  /** Update zoom level (clamped 0.1–5.0) */
  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(5.0, zoom)) });
  },

  /** Update pan offset */
  setPanOffset: (offset) => {
    set({ panOffset: offset });
  },

  /** Set drawing state */
  setIsDrawing: (drawing) => {
    set({ isDrawing: drawing });
  },

  /** Set fill color for new elements */
  setFillColor: (color) => {
    set({ fillColor: color });
  },

  // ─── Locks ─────────────────────────────────────────────────────────────────

  /** Mark an element as locked by a user */
  lockElement: (elementId, user) => {
    set((state) => ({
      lockedElements: {
        ...state.lockedElements,
        [elementId]: user,
      },
    }));
  },

  /** Clear lock on an element */
  unlockElement: (elementId) => {
    set((state) => {
      const updated = { ...state.lockedElements };
      delete updated[elementId];
      return { lockedElements: updated };
    });
  },

  // ─── Reset ─────────────────────────────────────────────────────────────────

  reset: () => {
    set({
      elements: [],
      selectedIds: [],
      tool: 'select',
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      isDrawing: false,
      lockedElements: {},
    });
  },
}));
