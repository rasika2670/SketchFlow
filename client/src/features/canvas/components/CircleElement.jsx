import React from 'react';
import { Circle, Group, Circle as KonvaCircle } from 'react-konva';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#6E56CF';

/**
 * CircleElement — renders a Konva Circle with selection handles.
 */
const CircleElement = React.memo(function CircleElement({
  element,
  isSelected,
  lockedBy,
  onSelect,
  onDragStart,
  onDragEnd,
  onContextMenu,
}) {
  const { id, x, y, width = 100, height = 100, color = '#38BDF8' } = element;
  const radius = Math.min(width, height) / 2;

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
      <Circle
        x={x + radius}
        y={y + radius}
        radius={radius}
        fill={color}
        opacity={lockedBy ? 0.6 : 1}
        draggable={!lockedBy}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={() => onDragStart?.(id)}
        onDragEnd={(e) => {
          const node = e.target;
          onDragEnd?.(id, {
            x: node.x() - radius,
            y: node.y() - radius,
          });
        }}
        onContextMenu={handleContextMenu}
        stroke={isSelected ? HANDLE_COLOR : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={isSelected ? 8 : 4}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.5}
      />
      {isSelected && !lockedBy && (
        <>
          {[
            { cx: x, cy: y },
            { cx: x + width, cy: y },
            { cx: x, cy: y + height },
            { cx: x + width, cy: y + height },
          ].map((pos, i) => (
            <KonvaCircle
              key={i}
              x={pos.cx}
              y={pos.cy}
              radius={HANDLE_SIZE / 2}
              fill="white"
              stroke={HANDLE_COLOR}
              strokeWidth={2}
            />
          ))}
        </>
      )}
    </Group>
  );
});

export default CircleElement;
