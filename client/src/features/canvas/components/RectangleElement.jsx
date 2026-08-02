import React from 'react';
import { Rect, Group, Circle as KonvaCircle } from 'react-konva';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#6E56CF';

/**
 * RectangleElement — renders a Konva Rect with selection and resize handles.
 */
const RectangleElement = React.memo(function RectangleElement({
  element,
  isSelected,
  lockedBy,
  onSelect,
  onDragEnd,
  onTransform,
  onContextMenu,
  shapeRef,
}) {
  const { id, x, y, width = 150, height = 100, color = '#6E56CF' } = element;

  const handleDragEnd = (e) => {
    const node = e.target;
    onDragEnd?.(id, {
      x: node.x(),
      y: node.y(),
    });
  };

  const handleClick = (e) => {
    e.cancelBubble = true;
    onSelect?.(id, e.evt.shiftKey);
  };

  const handleContextMenu = (e) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu?.(id, { x: e.evt.clientX, y: e.evt.clientY });
  };
  return (
    <Group>
      <Rect
        id={id}
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={lockedBy ? 0.6 : 1}
        cornerRadius={4}
        draggable={!lockedBy}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={() => onDragStart?.(id)}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        stroke={isSelected ? HANDLE_COLOR : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={isSelected ? 8 : 4}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.5}
      />
    </Group>
  );
});

export default RectangleElement;
