import React from 'react';
import { Text, Group, Rect, Circle as KonvaCircle } from 'react-konva';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#6E56CF';

/**
 * TextElement — renders editable text on the canvas.
 * Double-click activates inline editing via an HTML overlay (managed by Canvas.jsx).
 */
const TextElement = React.memo(function TextElement({
  element,
  isSelected,
  lockedBy,
  onSelect,
  onDragEnd,
  onDblClick,
  onContextMenu,
  shapeRef,
}) {
  const {
    id,
    x,
    y,
    width = 200,
    text = 'Double-click to edit',
    color = '#F4F4FC',
    properties = {},
  } = element;

  const textColor = properties.fillColor || properties.strokeColor || color;
  const baseOpacity = properties.opacity !== undefined ? properties.opacity : 1;
  const finalOpacity = lockedBy ? baseOpacity * 0.6 : baseOpacity;

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
      height={40}
      draggable={!lockedBy}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onDragStart={() => onDragStart?.(id)}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
    >
      {/* Invisible background for hit area */}
      <Rect
        width={width}
        height={40}
        fill="transparent"
      />

      <Text
        text={text || 'Double-click to edit'}
        fontSize={16}
        fontFamily="Inter, system-ui, sans-serif"
        fill={textColor}
        opacity={finalOpacity}
        width={width}
        wrap="word"
        lineHeight={1.5}
      />


    </Group>
  );
});

export default TextElement;
