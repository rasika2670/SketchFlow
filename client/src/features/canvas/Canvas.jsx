import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthStore } from '@/stores/authStore';
import { getBoardSocket } from '@/sockets/socket';

import RectangleElement from './components/RectangleElement';
import CircleElement from './components/CircleElement';
import StickyNoteElement from './components/StickyNoteElement';
import LineElement from './components/LineElement';
import TextElement from './components/TextElement';
import ImageElement from './components/ImageElement';
import SelectionBox from './components/SelectionBox';
import CursorOverlay from './components/CursorOverlay';
import LockIndicator from './components/LockIndicator';
import ElementContextMenu from './components/ElementContextMenu';
import ConvertStickyModal from '@/features/tasks/components/ConvertStickyModal';

const ELEMENT_COMPONENTS = {
  rectangle: RectangleElement,
  circle: CircleElement,
  sticky: StickyNoteElement,
  line: LineElement,
  text: TextElement,
  image: ImageElement,
};

// Default dimensions for new elements by type
const DEFAULT_DIMENSIONS = {
  rectangle: { width: 150, height: 100 },
  circle: { width: 100, height: 100 },
  sticky: { width: 200, height: 160 },
  line: { width: 200, height: 0 },
  text: { width: 200, height: 40 },
  image: { width: 200, height: 150 },
};

/** Generate a temporary ID for optimistic creation */
let tempCounter = 0;
function generateTempId() {
  return `temp_${Date.now()}_${++tempCounter}`;
}

/**
 * Canvas — React-Konva infinite canvas with element rendering, selection,
 * zoom/pan, viewport culling, and context menu support.
 *
 * @param {{ boardId: string, sendCursorMove: Function, requestLock: Function, releaseLock: Function }} props
 */
export default function Canvas({ boardId, sendCursorMove, requestLock, releaseLock }) {
  const stageRef = useRef(null);
  const nodeRefs = useRef(new Map());
  const transformerRef = useRef(null);

  // ─── Canvas store subscriptions ─────────────────────────────────────────
  const elements = useCanvasStore((s) => s.elements);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const tool = useCanvasStore((s) => s.tool);
  const zoom = useCanvasStore((s) => s.zoom);
  const panOffset = useCanvasStore((s) => s.panOffset);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const lockedElements = useCanvasStore((s) => s.lockedElements);

  // ─── Sync Transformer ───────────────────────────────────────────────────
  useEffect(() => {
    if (transformerRef.current) {
      const nodes = selectedIds
        .filter((id) => !lockedElements[id]) // Don't allow resizing locked elements
        .map((id) => nodeRefs.current.get(id))
        .filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, elements, lockedElements]);

  // ─── Local state ────────────────────────────────────────────────────────
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [convertElementId, setConvertElementId] = useState(null);
  const [editingElement, setEditingElement] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  // ─── Container ref for dynamic sizing ───────────────────────────────────
  const containerRef = useCallback((node) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ─── Convert screen coords to canvas coords ────────────────────────────
  const screenToCanvas = useCallback(
    (screenX, screenY) => {
      return {
        x: (screenX - panOffset.x * zoom) / zoom,
        y: (screenY - panOffset.y * zoom) / zoom,
      };
    },
    [zoom, panOffset]
  );

  const getPointerCanvasPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return {
      x: (pos.x / zoom) - panOffset.x,
      y: (pos.y / zoom) - panOffset.y,
    };
  }, [zoom, panOffset]);

  // ─── Viewport culling ──────────────────────────────────────────────────
  const visibleElements = useMemo(() => {
    const vw = containerSize.width / zoom;
    const vh = containerSize.height / zoom;
    const vx = -panOffset.x;
    const vy = -panOffset.y;
    const padding = 100; // render slightly outside viewport for smooth panning

    return elements.filter((el) => {
      const ew = el.width || 200;
      const eh = el.height || 200;
      return (
        el.x + ew > vx - padding &&
        el.x < vx + vw + padding &&
        el.y + eh > vy - padding &&
        el.y < vy + vh + padding
      );
    });
  }, [elements, zoom, panOffset, containerSize]);

  // ─── Wheel zoom (zoom toward cursor) ───────────────────────────────────
  const handleWheel = useCallback(
    (e) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldZoom = zoom;
      const pointer = stage.getPointerPosition();

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.08;
      const newZoom = Math.max(0.1, Math.min(5.0, direction > 0 ? oldZoom * factor : oldZoom / factor));

      // Zoom toward cursor position
      const mousePointTo = {
        x: (pointer.x / oldZoom) - panOffset.x,
        y: (pointer.y / oldZoom) - panOffset.y,
      };

      const newPanOffset = {
        x: -(mousePointTo.x - pointer.x / newZoom),
        y: -(mousePointTo.y - pointer.y / newZoom),
      };

      useCanvasStore.getState().setZoom(newZoom);
      useCanvasStore.getState().setPanOffset(newPanOffset);
    },
    [zoom, panOffset]
  );

  // ─── Stage mouse events ────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e) => {
      // Close context menu
      if (contextMenu) {
        setContextMenu(null);
        return;
      }

      // Only handle clicks on the stage background (not on elements)
      const clickedOnEmpty = e.target === e.target.getStage();
      if (!clickedOnEmpty) return;

      const pos = getPointerCanvasPos();
      if (!pos) return;

      if (tool === 'select') {
        // Start selection box
        setIsSelecting(true);
        setSelectionBox({ startX: pos.x, startY: pos.y, width: 0, height: 0 });
        useCanvasStore.getState().clearSelection();
      }
    },
    [tool, contextMenu, getPointerCanvasPos]
  );

  const handleMouseMove = useCallback(
    (e) => {
      // Send cursor position in canvas coordinates
      const pos = getPointerCanvasPos();
      if (pos) {
        sendCursorMove?.(pos.x, pos.y);
      }

      // Update selection box
      if (isSelecting && selectionBox) {
        const canvasPos = getPointerCanvasPos();
        if (canvasPos) {
          setSelectionBox((prev) => ({
            ...prev,
            width: canvasPos.x - prev.startX,
            height: canvasPos.y - prev.startY,
          }));
        }
      }
    },
    [isSelecting, selectionBox, sendCursorMove, getPointerCanvasPos]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionBox) {
      // Compute which elements are within the selection box
      const minX = Math.min(selectionBox.startX, selectionBox.startX + selectionBox.width);
      const maxX = Math.max(selectionBox.startX, selectionBox.startX + selectionBox.width);
      const minY = Math.min(selectionBox.startY, selectionBox.startY + selectionBox.height);
      const maxY = Math.max(selectionBox.startY, selectionBox.startY + selectionBox.height);

      // Only trigger area select if the drag area is meaningful
      if (Math.abs(selectionBox.width) > 5 || Math.abs(selectionBox.height) > 5) {
        const matchedIds = elements
          .filter((el) => {
            const ew = el.width || 100;
            const eh = el.height || 100;
            return el.x < maxX && el.x + ew > minX && el.y < maxY && el.y + eh > minY;
          })
          .map((el) => el.id);

        useCanvasStore.getState().selectArea(matchedIds);
      }

      setSelectionBox(null);
      setIsSelecting(false);
    }
  }, [isSelecting, selectionBox, elements]);

  const handleClick = useCallback(
    (e) => {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (!clickedOnEmpty) return;

      const pos = getPointerCanvasPos();
      if (!pos) return;

      // If a drawing tool is selected, create a new element on click
      if (tool !== 'select' && tool !== 'image') {
        const socket = getBoardSocket();
        if (!socket) return;

        const dims = DEFAULT_DIMENSIONS[tool] || { width: 100, height: 100 };
        const tempId = generateTempId();
        const elementData = {
          type: tool,
          x: pos.x,
          y: pos.y,
          ...dims,
          color: fillColor,
          text: tool === 'text' ? '' : tool === 'sticky' ? '' : null,
        };

        // Optimistic: add to store immediately with temp ID for instant visual feedback
        useCanvasStore.getState().addElement({ id: tempId, ...elementData, version: 1 });

        // Track the temp ID so useBoardSocket can reconcile when the server responds
        useCanvasStore.getState().addPendingTemp(tempId, elementData);

        socket.emit('element:created', { boardId, element: elementData, tempId });

        // Switch back to select tool after creating
        useCanvasStore.getState().setTool('select');
      } else if (tool === 'image') {
        // Open file picker for image upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (ev) => {
          const file = ev.target.files?.[0];
          if (!file) return;
          const objectUrl = URL.createObjectURL(file);
          const socket = getBoardSocket();
          if (!socket) return;

          const tempId = generateTempId();
          const dims = DEFAULT_DIMENSIONS.image;
          const elementData = {
            type: 'image',
            x: pos.x,
            y: pos.y,
            ...dims,
            text: objectUrl,
          };

          // Optimistic: add immediately
          useCanvasStore.getState().addElement({ id: tempId, ...elementData, version: 1 });
          useCanvasStore.getState().addPendingTemp(tempId, elementData);

          socket.emit('element:created', {
            boardId,
            element: elementData,
            tempId,
          });

          useCanvasStore.getState().setTool('select');
        };
        input.click();
      } else {
        // Select tool — clear selection when clicking empty space
        useCanvasStore.getState().clearSelection();
      }
    },
    [tool, boardId, fillColor, getPointerCanvasPos]
  );

  // ─── Element event handlers ────────────────────────────────────────────

  const handleElementSelect = useCallback((id, isShift) => {
    if (isShift) {
      useCanvasStore.getState().toggleSelect(id);
    } else {
      useCanvasStore.getState().selectElement(id);
    }
  }, []);

  const handleElementDragStart = useCallback(
    (id) => {
      requestLock?.(id);
    },
    [requestLock]
  );

  const handleElementDragEnd = useCallback(
    (id, newPos) => {
      const socket = getBoardSocket();
      const el = elements.find((e) => e.id === id);
      if (!el || !socket) return;

      // Optimistic update
      useCanvasStore.getState().updateElement(id, newPos);

      // Emit move to server
      socket.emit('element:moved', {
        boardId,
        elementId: id,
        x: newPos.x,
        y: newPos.y,
        version: el.version,
      });

      releaseLock?.(id);
    },
    [boardId, elements, releaseLock]
  );

  const handleElementDblClick = useCallback((id) => {
    setEditingElement(id);
  }, []);

  const handleContextMenuOpen = useCallback((id, pos) => {
    // Ensure the element is selected
    const store = useCanvasStore.getState();
    if (!store.selectedIds.includes(id)) {
      store.selectElement(id);
    }
    setContextMenu(pos);
  }, []);

  // ─── Context menu actions ──────────────────────────────────────────────

  const handleDuplicate = useCallback(() => {
    const socket = getBoardSocket();
    if (!socket) return;

    selectedIds.forEach((id) => {
      const el = elements.find((e) => e.id === id);
      if (!el) return;
      socket.emit('element:created', {
        boardId,
        element: {
          type: el.type,
          x: el.x + 20,
          y: el.y + 20,
          width: el.width,
          height: el.height,
          color: el.color,
          text: el.text,
        },
      });
    });
  }, [selectedIds, elements, boardId]);

  const handleDelete = useCallback(() => {
    const socket = getBoardSocket();
    if (!socket) return;

    selectedIds.forEach((id) => {
      socket.emit('element:deleted', { boardId, elementId: id });
      useCanvasStore.getState().removeElement(id);
    });
    useCanvasStore.getState().clearSelection();
  }, [selectedIds, boardId]);

  const handleColorChange = useCallback(
    (color) => {
      const socket = getBoardSocket();
      if (!socket) return;

      selectedIds.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        if (!el) return;
        useCanvasStore.getState().updateElement(id, { color });
        socket.emit('element:updated', {
          boardId,
          elementId: id,
          updates: { color },
          version: el.version,
        });
      });
    },
    [selectedIds, elements, boardId]
  );

  // ─── Inline text editing ───────────────────────────────────────────────

  const editingEl = editingElement ? elements.find((el) => el.id === editingElement) : null;
  const editTextareaStyle = editingEl
    ? {
        position: 'absolute',
        left: (editingEl.x + panOffset.x) * zoom,
        top: (editingEl.y + panOffset.y) * zoom,
        width: (editingEl.width || 200) * zoom,
        minHeight: 40 * zoom,
        transform: `scale(1)`,
        transformOrigin: 'top left',
        fontSize: `${(editingEl.type === 'sticky' ? 14 : 16) * zoom}px`,
        lineHeight: '1.4',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: editingEl.type === 'sticky' ? '#1A1A24' : '#F4F4FC',
        background: editingEl.type === 'sticky' ? (editingEl.color || '#FBBF24') : 'transparent',
        border: '2px solid #6E56CF',
        borderRadius: '4px',
        padding: `${12 * zoom}px`,
        outline: 'none',
        resize: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }
    : null;

  const handleTextEditBlur = useCallback(
    (e) => {
      if (!editingElement) return;
      const newText = e.target.value;
      const el = elements.find((el) => el.id === editingElement);
      if (!el) return;

      useCanvasStore.getState().updateElement(editingElement, { text: newText });

      const socket = getBoardSocket();
      if (socket) {
        socket.emit('element:updated', {
          boardId,
          elementId: editingElement,
          updates: { text: newText },
          version: el.version,
        });
      }

      setEditingElement(null);
    },
    [editingElement, elements, boardId]
  );

  // ─── Cursor style ─────────────────────────────────────────────────────
  const cursorStyle =
    tool === 'select'
      ? 'default'
      : tool === 'image'
        ? 'copy'
        : 'crosshair';

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-slate-950"
      style={{ cursor: cursorStyle }}
    >
      {/* Canvas grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(#F4F4FC 1px, transparent 1px),
            linear-gradient(90deg, #F4F4FC 1px, transparent 1px)
          `,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundPosition: `${panOffset.x * zoom}px ${panOffset.y * zoom}px`,
        }}
      />

      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x * zoom}
        y={panOffset.y * zoom}
        draggable={tool === 'select'}
        onDragEnd={(e) => {
          // Only handle stage drag (pan), not element drags
          if (e.target === stageRef.current) {
            useCanvasStore.getState().setPanOffset({
              x: e.target.x() / zoom,
              y: e.target.y() / zoom,
            });
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <Layer>
          {/* Render visible elements */}
          {visibleElements.map((el) => {
            const Component = ELEMENT_COMPONENTS[el.type];
            if (!Component) return null;

            const isSelected = selectedIds.includes(el.id);
            const lockedBy = lockedElements[el.id] || null;

            return (
              <Component
                key={el.id}
                element={el}
                isSelected={isSelected}
                lockedBy={lockedBy}
                shapeRef={(node) => {
                  if (node) nodeRefs.current.set(el.id, node);
                  else nodeRefs.current.delete(el.id);
                }}
                onSelect={handleElementSelect}
                onDragStart={handleElementDragStart}
                onDragEnd={handleElementDragEnd}
                onDblClick={handleElementDblClick}
                onContextMenu={handleContextMenuOpen}
              />
            );
          })}

          {/* Lock indicators */}
          {visibleElements.map((el) => {
            const lockedBy = lockedElements[el.id];
            if (!lockedBy) return null;
            return (
              <LockIndicator
                key={`lock-${el.id}`}
                x={el.x}
                y={el.y}
                lockedBy={lockedBy}
              />
            );
          })}

          {/* Selection box */}
          <SelectionBox box={selectionBox} />

          {/* Transformer for resizing selected elements */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // limit resize
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
            onTransformStart={() => {
              selectedIds.forEach((id) => requestLock?.(id));
            }}
            onTransformEnd={() => {
              const nodes = transformerRef.current.nodes();
              const socket = getBoardSocket();

              nodes.forEach((node) => {
                const id = node.id();
                const el = elements.find((e) => e.id === id);
                if (!el) return;

                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                // Reset scale to 1 for crisp rendering, apply to width/height
                node.scaleX(1);
                node.scaleY(1);

                const newWidth = Math.max(5, node.width() * scaleX);
                const newHeight = Math.max(5, node.height() * scaleY);

                const updates = {
                  x: node.x(),
                  y: node.y(),
                  width: newWidth,
                  height: newHeight,
                  rotation: node.rotation(),
                };

                // Optimistic update
                useCanvasStore.getState().updateElement(id, updates);

                // Emit to server
                if (socket) {
                  socket.emit('element:updated', {
                    boardId,
                    elementId: id,
                    updates,
                    version: el.version,
                  });
                }

                releaseLock?.(id);
              });
            }}
          />

          {/* Cursor overlay — other users' cursors */}
          <CursorOverlay />
        </Layer>
      </Stage>

      {/* Inline text editor (HTML overlay) */}
      {editingEl && editTextareaStyle && (
        <textarea
          autoFocus
          defaultValue={editingEl.text || ''}
          style={editTextareaStyle}
          onBlur={handleTextEditBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.target.blur();
            }
          }}
        />
      )}

      {/* Context menu (HTML overlay) */}
      <ElementContextMenu
        position={contextMenu}
        selectedIds={selectedIds}
        elements={elements}
        onClose={() => setContextMenu(null)}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onColorChange={handleColorChange}
        onEdit={(id) => setEditingElement(id)}
        onConvertToTask={(id) => setConvertElementId(id)}
      />

      {/* Convert sticky to task modal */}
      <ConvertStickyModal
        isOpen={!!convertElementId}
        onClose={() => setConvertElementId(null)}
        boardId={boardId}
        elementId={convertElementId}
      />
    </div>
  );
}
