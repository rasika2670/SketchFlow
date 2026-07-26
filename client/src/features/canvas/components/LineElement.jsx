import React from 'react';
import { Line, Group, Circle as KonvaCircle } from 'react-konva';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#6E56CF';

/**
 * LineElement — renders a Konva Line with endpoint handles.
 */
const LineElement = React.memo(function LineElement({
  element,
  isSelected,
  lockedBy,
  onSelect,
  onDragStart,
  onDragEnd,
  onContextMenu,
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
      x={x}
      y={y}
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
      {/* Visible line */}
      <Line
        points={points}
        stroke={color}
        strokeWidth={2}
        opacity={lockedBy ? 0.6 : 1}
        lineCap="round"
        lineJoin="round"
      />
      {/* Endpoint handles */}
      {isSelected && !lockedBy && (
        <>
          <KonvaCircle
            x={0}
            y={0}
            radius={HANDLE_SIZE / 2}
            fill="white"
            stroke={HANDLE_COLOR}
            strokeWidth={2}
          />
          <KonvaCircle
            x={width}
            y={height}
            radius={HANDLE_SIZE / 2}
            fill="white"
            stroke={HANDLE_COLOR}
            strokeWidth={2}
          />
        </>
      )}
    </Group>
  );
});

export default LineElement;
