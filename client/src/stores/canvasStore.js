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
    properties: el.properties || {},
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
  isSpacePanning: false,
  fillColor: '#6E56CF', // Default fill color for new elements
  lockedElements: {}, // { [elementId]: { userId, userName } }
  pendingTempIds: new Map(), // Map<tempId, elementData> for optimistic creation reconciliation
  clipboard: [], // Array of copied element data
  undoStack: [],
  redoStack: [],

  // ─── History (Undo/Redo) ────────────────────────────────────────────────────

  /** 
   * Push an action to the undo stack and clear the redo stack.
   * Action format: { type: 'UPDATE' | 'CREATE' | 'DELETE', elementId, previousData, nextData } 
   */
  pushHistory: (action) => {
    set((state) => ({
      undoStack: [...state.undoStack, action],
      redoStack: [],
    }));
  },

  undo: (socket, boardId) => {
    const { undoStack, elements, updateElement, removeElement, addElement } = get();
    if (undoStack.length === 0) return;

    const newUndo = [...undoStack];
    const action = newUndo.pop();
    
    // Apply inverse
    let targetEl;
    if (action.type === 'UPDATE') {
      targetEl = elements.find(e => e.id === action.elementId);
      if (targetEl) {
        updateElement(action.elementId, action.previousData);
        if (socket) {
          socket.emit('element:updated', {
            boardId,
            elementId: action.elementId,
            updates: action.previousData,
            version: targetEl.version
          });
        }
      }
    } else if (action.type === 'CREATE') {
      // Inverse of create is delete
      removeElement(action.elementId);
      if (socket) {
        socket.emit('element:deleted', { boardId, elementId: action.elementId });
      }
    } else if (action.type === 'DELETE') {
      // Inverse of delete is create
      addElement(action.previousData);
      if (socket) {
        socket.emit('element:created', { boardId, element: action.previousData });
      }
    }

    set((state) => ({
      undoStack: newUndo,
      redoStack: [...state.redoStack, action],
    }));
  },

  redo: (socket, boardId) => {
    const { redoStack, elements, updateElement, removeElement, addElement } = get();
    if (redoStack.length === 0) return;

    const newRedo = [...redoStack];
    const action = newRedo.pop();

    // Re-apply action
    let targetEl;
    if (action.type === 'UPDATE') {
      targetEl = elements.find(e => e.id === action.elementId);
      if (targetEl) {
        updateElement(action.elementId, action.nextData);
        if (socket) {
          socket.emit('element:updated', {
            boardId,
            elementId: action.elementId,
            updates: action.nextData,
            version: targetEl.version
          });
        }
      }
    } else if (action.type === 'CREATE') {
      addElement(action.nextData);
      if (socket) {
        socket.emit('element:created', { boardId, element: action.nextData });
      }
    } else if (action.type === 'DELETE') {
      removeElement(action.elementId);
      if (socket) {
        socket.emit('element:deleted', { boardId, elementId: action.elementId });
      }
    }

    set((state) => ({
      redoStack: newRedo,
      undoStack: [...state.undoStack, action],
    }));
  },

  // ─── Element CRUD ───────────────────────────────────────────────────────────

  /** Copy selected elements to clipboard */
  copyElements: () => {
    const { elements, selectedIds } = get();
    const copied = elements.filter(el => selectedIds.includes(el.id));
    set({ clipboard: copied });
  },

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
      // Update history stacks to use the new server ID
      undoStack: state.undoStack.map((action) =>
        action.elementId === tempId ? { ...action, elementId: normalized.id } : action
      ),
      redoStack: state.redoStack.map((action) =>
        action.elementId === tempId ? { ...action, elementId: normalized.id } : action
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
        el.id === id ? { 
          ...el, 
          ...normalized,
          properties: normalized.properties ? { ...(el.properties || {}), ...normalized.properties } : el.properties
        } : el
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

  /** Set space panning state */
  setSpacePanning: (panning) => {
    set({ isSpacePanning: panning });
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
