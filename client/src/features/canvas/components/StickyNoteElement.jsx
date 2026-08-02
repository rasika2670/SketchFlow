import React from 'react';
import { Group, Rect, Text, Circle as KonvaCircle } from 'react-konva';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#6E56CF';
const STICKY_COLORS = ['#FBBF24', '#34D399', '#FB7185', '#38BDF8', '#A78BFA', '#F97316'];

/**
 * StickyNoteElement — a warm-colored sticky note with editable text.
 * Double-click activates inline editing via an HTML overlay (managed by Canvas.jsx).
 */
const StickyNoteElement = React.memo(function StickyNoteElement({
  element,
  isSelected,
  lockedBy,
  onSelect,
  onDragStart,
  onDblClick,
  onContextMenu,
  shapeRef,
}) {
  const {
    id,
    x,
    y,
    width = 200,
    height = 160,
    color = STICKY_COLORS[0],
    text = '',
  } = element;

  const handleClick = (e) => {
    e.cancelBubble = true;
    onSelect?.(id, e.evt.shiftKey);
  };

  const handleDblClick = (e) => {
    e.cancelBubble = true;
    onDblClick?.(id);
  };

  const handleDragEnd = (e) => {
    const node = e.target;
    onDragEnd?.(id, {
      x: node.x(),
      y: node.y(),
    });
  };

  const handleContextMenu = (e) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu?.(id, { x: e.evt.clientX, y: e.evt.clientY });
  };

  return (
    <Group
      id={id}
      ref={shapeRef}
      x={x}
      y={y}
      width={width}
      height={height}
      draggable={!lockedBy}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onDragStart={() => onDragStart?.(id)}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
    >
      {/* Sticky background */}
      <Rect
        width={width}
        height={height}
        fill={color}
        cornerRadius={4}
        opacity={lockedBy ? 0.6 : 1}
        stroke={isSelected ? HANDLE_COLOR : 'rgba(0,0,0,0.1)'}
        strokeWidth={isSelected ? 2 : 1}
        shadowColor="rgba(0,0,0,0.25)"
        shadowBlur={isSelected ? 12 : 6}
        shadowOffset={{ x: 0, y: 3 }}
        shadowOpacity={0.5}
      />

      {/* Fold effect — small triangle at top-right corner */}
      <Rect
        x={width - 16}
        y={0}
        width={16}
        height={16}
        fill="rgba(0,0,0,0.08)"
        cornerRadius={[0, 4, 0, 0]}
      />

      {/* Sticky text */}
      <Text
        x={12}
        y={12}
        width={width - 24}
        height={height - 24}
        text={text || 'Double-click to edit...'}
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fill={text ? '#1A1A24' : '#666'}
        lineHeight={1.4}
        wrap="word"
        ellipsis={true}
      />
    </Group>
  );
});

export default StickyNoteElement;
