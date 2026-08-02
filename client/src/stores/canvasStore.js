import { create } from 'zustand';

/**
 * Normalize numeric fields that PostgreSQL returns as strings (DECIMAL columns).
 * Without this, viewport culling and position math break via string concatenation.
 */
function normalizeElement(el) {
  return {
    ...el,
    x: Number(el.x) || 0,
    y: Number(el.y) || 0,
    width: el.width != null ? Number(el.width) : null,
    height: el.height != null ? Number(el.height) : null,
    version: Number(el.version) || 1,
  };
}

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
  pendingTempIds: new Map(), // Map<tempId, elementData> for optimistic creation reconciliation

  // ─── Element CRUD ───────────────────────────────────────────────────────────

  /** Replace entire elements array (used on initial load / full resync) */
  setElements: (elements) => {
    set({ elements: elements.map(normalizeElement) });
  },

  /** Append a new element (optimistic or from socket) */
  addElement: (element) => {
    const normalized = normalizeElement(element);
    set((state) => {
      // Prevent duplicates
      if (state.elements.some((el) => el.id === normalized.id)) return state;
      return { elements: [...state.elements, normalized] };
    });
  },

  /** Replace a temp-prefixed optimistic element with the server-confirmed version */
  replaceTempElement: (tempId, serverElement) => {
    const normalized = normalizeElement(serverElement);
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === tempId ? normalized : el
      ),
      // Update selectedIds if the temp element was selected
      selectedIds: state.selectedIds.map((sid) =>
        sid === tempId ? normalized.id : sid
      ),
    }));
  },

  /** Register a pending optimistic creation for reconciliation */
  addPendingTemp: (tempId, elementData) => {
    get().pendingTempIds.set(tempId, elementData);
  },

  /** Consume a pending temp ID (returns the tempId if found, null otherwise) */
  consumePendingTemp: (tempId) => {
    const map = get().pendingTempIds;
    if (map.has(tempId)) {
      map.delete(tempId);
      return tempId;
    }
    return null;
  },

  /** Merge changes into an existing element (optimistic or from socket) */
  updateElement: (id, changes) => {
    // Coerce any numeric fields that may arrive as strings from PostgreSQL
    const normalized = { ...changes };
    if (normalized.x !== undefined) normalized.x = Number(normalized.x) || 0;
    if (normalized.y !== undefined) normalized.y = Number(normalized.y) || 0;
    if (normalized.width !== undefined) normalized.width = normalized.width != null ? Number(normalized.width) : null;
    if (normalized.height !== undefined) normalized.height = normalized.height != null ? Number(normalized.height) : null;
    if (normalized.version !== undefined) normalized.version = Number(normalized.version) || 1;

    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...normalized } : el
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
    const normalized = normalizeElement(serverState);
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...normalized } : el
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
    // Clear the pending map (it's mutable, not part of set state)
    get().pendingTempIds.clear();
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
