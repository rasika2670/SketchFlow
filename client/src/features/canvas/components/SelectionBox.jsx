import React from 'react';
import { Rect } from 'react-konva';

/**
 * SelectionBox — blue dashed rectangle drawn during multi-select drag.
 */
const SelectionBox = React.memo(function SelectionBox({ box }) {
  if (!box) return null;

  const { startX, startY, width, height } = box;

  return (
    <Rect
      x={Math.min(startX, startX + width)}
      y={Math.min(startY, startY + height)}
      width={Math.abs(width)}
      height={Math.abs(height)}
      fill="rgba(110, 86, 207, 0.08)"
      stroke="#6E56CF"
      strokeWidth={1}
      dash={[6, 3]}
    />
  );
});

export default SelectionBox;
