import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { getUserColor } from '@/utils/userColors';

/**
 * LockIndicator — bounding box and name badge for elements locked/edited by another user.
 */
const LockIndicator = React.memo(function LockIndicator({ element, lockedBy }) {
  if (!lockedBy || !element) return null;

  const label = lockedBy.userName || 'Someone';
  const color = getUserColor(lockedBy.userId, label);
  
  // Element dimensions
  const width = element.width || 100;
  const height = element.height || 100;
  const displayHeight = Math.max(height, 2); // Handle lines/arrows which might have 0 height

  return (
    <Group x={element.x} y={element.y}>

      {/* Name badge */}
      <Group x={0} y={-24}>
        <Rect
          width={label.length * 7 + 16}
          height={20}
          fill={color}
          cornerRadius={4}
          shadowColor="rgba(0,0,0,0.1)"
          shadowBlur={2}
          shadowOffset={{ x: 0, y: 1 }}
        />
        <Text
          x={8}
          y={5}
          text={label}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fill="white"
          fontStyle="bold"
        />
      </Group>
    </Group>
  );
});

export default LockIndicator;
