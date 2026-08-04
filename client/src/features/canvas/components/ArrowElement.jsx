import React from 'react';
import { Arrow, Line, Group } from 'react-konva';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#6E56CF';

/**
 * ArrowElement — renders a Konva Arrow with endpoint handles.
 */
const ArrowElement = React.memo(function ArrowElement({
  element,
  isSelected,
  lockedBy,
  onSelect,
  onDragEnd,
  onContextMenu,
  shapeRef,
}) {
  const {
    id,
    x = 0,
    y = 0,
    width = 200,
    height = 0,
    color = '#F4F4FC',
  } = element;

  // Line is drawn from (0, 0) to (width, height) within the group
  const points = [0, 0, width, height];

  const handleClick = (e) => {
    e.cancelBubble = true;
    onSelect?.(id, e.evt.shiftKey);
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
      onDragStart={() => onDragStart?.(id)}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
    >
      {/* Wider invisible hit area for easier clicking */}
      <Line
        points={points}
        stroke="transparent"
        strokeWidth={16}
        hitStrokeWidth={16}
      />
      {/* Visible arrow */}
      <Arrow
        points={points}
        stroke={color}
        fill={color}
        strokeWidth={2}
        opacity={lockedBy ? 0.6 : 1}
        lineCap="round"
        lineJoin="round"
        pointerLength={10}
        pointerWidth={10}
      />
    </Group>
  );
});

export default ArrowElement;
