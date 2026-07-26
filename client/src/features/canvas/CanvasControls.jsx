import { Minus, Plus, Maximize2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';

/**
 * CanvasControls — floating glassmorphism control bar at bottom-center.
 * Zoom in/out, zoom percentage display, fit-to-screen.
 */
export default function CanvasControls() {
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPanOffset = useCanvasStore((s) => s.setPanOffset);
  const elements = useCanvasStore((s) => s.elements);

  const zoomPercent = Math.round(zoom * 100);

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);

  const handleFitToScreen = () => {
    if (elements.length === 0) {
      setZoom(1.0);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach((el) => {
      const w = el.width || 100;
      const h = el.height || 100;
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 80;

    // Get viewport size (approximate via window inner dimensions minus UI)
    const viewportWidth = window.innerWidth - 120; // toolbar + sidebar
    const viewportHeight = window.innerHeight - 56; // header

    const scaleX = viewportWidth / (contentWidth + padding * 2);
    const scaleY = viewportHeight / (contentHeight + padding * 2);
    const newZoom = Math.max(0.1, Math.min(5.0, Math.min(scaleX, scaleY)));

    // Center content in viewport
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const offsetX = viewportWidth / 2 / newZoom - centerX;
    const offsetY = viewportHeight / 2 / newZoom - centerY;

    setZoom(newZoom);
    setPanOffset({ x: offsetX, y: offsetY });
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-sf-lg shadow-sf-floating">
      <button
        onClick={handleZoomOut}
        disabled={zoom <= 0.1}
        className="p-1.5 rounded-sf-sm text-slate-300 hover:text-slate-50 hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom out"
      >
        <Minus size={16} />
      </button>

      <span className="min-w-[48px] text-center text-sf-xs font-mono text-slate-300 select-none">
        {zoomPercent}%
      </span>

      <button
        onClick={handleZoomIn}
        disabled={zoom >= 5.0}
        className="p-1.5 rounded-sf-sm text-slate-300 hover:text-slate-50 hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom in"
      >
        <Plus size={16} />
      </button>

      <div className="w-px h-5 bg-slate-600 mx-1" />

      <button
        onClick={handleFitToScreen}
        className="p-1.5 rounded-sf-sm text-slate-300 hover:text-slate-50 hover:bg-slate-700/50 transition-colors"
        title="Fit to screen"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  );
}
