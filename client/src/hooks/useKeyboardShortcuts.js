import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { getBoardSocket } from '@/sockets/socket';
import { useUIStore } from '@/stores/uiStore';

let tempCounter = 0;
function generateTempId() {
  return `temp_${Date.now()}_${++tempCounter}`;
}

const TOOL_KEYS = {
  '1': 'select',
  '2': 'rectangle',
  '3': 'circle',
  '4': 'sticky',
  '5': 'line',
  '6': 'arrow',
  '7': 'text',
  '8': 'image',
  'v': 'select',
  'r': 'rectangle',
  'c': 'circle',
  's': 'sticky',
  'l': 'line',
  't': 'text',
  'i': 'image',
  'a': 'arrow',
};

export function useKeyboardShortcuts(boardId) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input or textarea
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      const store = useCanvasStore.getState();
      const { selectedIds, elements, clipboard } = store;
      const socket = getBoardSocket();

      // Clear selection / close modals
      if (e.key === 'Escape') {
        e.preventDefault();
        store.clearSelection();
        useUIStore.getState().setActivePanel(null); // Optional: close right sidebar panel
        return;
      }

      // Tool switching
      if (TOOL_KEYS[e.key] && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        store.setTool(TOOL_KEYS[e.key]);
        return;
      }

      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        if (!socket) return;
        selectedIds.forEach((id) => {
          socket.emit('element:deleted', { boardId, elementId: id });
          store.removeElement(id);
        });
        store.clearSelection();
        return;
      }

      // Select All (Ctrl+A)
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        store.selectArea(elements.map(el => el.id));
        return;
      }

      // Copy (Ctrl+C)
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          store.copyElements();
        }
        return;
      }

      // Duplicate function
      const duplicateElementsList = (sourceElements) => {
        if (!socket || sourceElements.length === 0) return;
        
        const newIds = [];
        sourceElements.forEach((el) => {
          const tempId = generateTempId();
          newIds.push(tempId);
          const elementData = {
            type: el.type,
            x: el.x + 20,
            y: el.y + 20,
            width: el.width,
            height: el.height,
            color: el.color,
            text: el.text,
          };
          
          store.addElement({ id: tempId, ...elementData, version: 1 });
          store.addPendingTemp(tempId, elementData);
          socket.emit('element:created', { boardId, element: elementData, tempId });
        });
        
        store.selectArea(newIds);
      };

      // Paste (Ctrl+V)
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        if (clipboard.length > 0) {
          e.preventDefault();
          duplicateElementsList(clipboard);
        }
        return;
      }

      // Duplicate (Ctrl+D)
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const copied = elements.filter(el => selectedIds.includes(el.id));
          duplicateElementsList(copied);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardId]);
}
