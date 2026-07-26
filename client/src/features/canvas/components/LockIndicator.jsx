import React from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * LockIndicator — small lock badge overlaid on elements locked by another user.
 * Shows a 🔒 icon and "Editing: [name]" tooltip.
 */
const LockIndicator = React.memo(function LockIndicator({ x, y, lockedBy }) {
  if (!lockedBy) return null;

  const label = lockedBy.userName || 'Someone';

  return (
    <Group x={x} y={y - 28}>
      {/* Badge background */}
      <Rect
        width={label.length * 7 + 40}
        height={22}
        fill="rgba(251, 113, 133, 0.9)"
        cornerRadius={11}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
      />
      {/* Lock icon */}
      <Text
        x={6}
        y={3}
        text="🔒"
        fontSize={12}
      />
      {/* Name */}
      <Text
        x={24}
        y={4}
        text={label}
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fill="white"
        fontStyle="bold"
      />
    </Group>
  );
});

export default LockIndicator;
