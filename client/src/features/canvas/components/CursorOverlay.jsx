import React from 'react';
import { Group, Line, Rect, Text } from 'react-konva';
import { usePresenceStore } from '@/stores/presenceStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * CursorOverlay — renders other users' cursor positions on the canvas.
 * Each cursor is a small arrow + name label pill with the user's assigned color.
 * Positions are in canvas coordinates (already converted before sending).
 */
const CursorOverlay = React.memo(function CursorOverlay() {
  const cursors = usePresenceStore((s) => s.cursors);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const cursorEntries = Object.entries(cursors).filter(
    ([userId]) => userId !== currentUserId && onlineUsers[userId]
  );

  if (cursorEntries.length === 0) return null;

  return (
    <>
      {cursorEntries.map(([userId, pos]) => {
        const user = onlineUsers[userId];
        if (!user) return null;
        const color = user.color || '#38BDF8';
        const name = user.name || 'User';

        return (
          <Group key={userId} x={pos.x} y={pos.y}>
            {/* Cursor arrow shape */}
            <Line
              points={[0, 0, 4, 14, 8, 10, 16, 14, 0, 0]}
              fill={color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
              closed
            />
            {/* Name label pill */}
            <Rect
              x={16}
              y={8}
              width={name.length * 7 + 16}
              height={20}
              fill={color}
              cornerRadius={10}
              opacity={0.9}
            />
            <Text
              x={24}
              y={11}
              text={name}
              fontSize={11}
              fontFamily="Inter, system-ui, sans-serif"
              fill="white"
              fontStyle="bold"
            />
          </Group>
        );
      })}
    </>
  );
});

export default CursorOverlay;
