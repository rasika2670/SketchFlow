import React, { useEffect, useState } from 'react';
import { Image, Group, Rect, Circle as KonvaCircle } from 'react-konva';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#6E56CF';

/**
 * ImageElement — renders an image on the Konva canvas.
 * Uses native Image API for async loading with a placeholder while loading.
 * The `text` field stores the image URL (Cloudinary or object URL).
 */
const ImageElement = React.memo(function ImageElement({
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
    x,
    y,
    width = 200,
    height = 150,
    text: imageUrl = '',
  } = element;

  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load image asynchronously
  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

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
      {/* Loading placeholder */}
      {isLoading && (
        <Rect
          width={width}
          height={height}
          fill="#242430"
          cornerRadius={4}
          stroke="#3F3F50"
          strokeWidth={1}
        />
      )}

      {/* Loaded image */}
      {image && (
        <Image
          image={image}
          width={width}
          height={height}
          opacity={lockedBy ? 0.6 : 1}
          cornerRadius={4}
        />
      )}

      {/* No image placeholder */}
      {!isLoading && !image && (
        <Rect
          width={width}
          height={height}
          fill="#1A1A24"
          cornerRadius={4}
          stroke="#3F3F50"
          strokeWidth={1}
          dash={[6, 4]}
        />
      )}

      {/* Selection border */}
      {isSelected && (
        <Rect
          width={width}
          height={height}
          fill="transparent"
          stroke={HANDLE_COLOR}
          strokeWidth={2}
          cornerRadius={4}
        />
      )}

      {/* Selection handles */}
      {isSelected && !lockedBy && (
        <>
          {[
            { cx: 0, cy: 0 },
            { cx: width, cy: 0 },
            { cx: 0, cy: height },
            { cx: width, cy: height },
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

export default ImageElement;
