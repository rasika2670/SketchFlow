import {
  MousePointer2,
  Square,
  Circle,
  StickyNote,
  Minus,
  Type,
  Image,
  ArrowUpRight,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';

const FILL_COLORS = [
  '#6E56CF', '#38BDF8', '#34D399', '#FBBF24', '#FB7185',
  '#A78BFA', '#F97316', '#2DD4BF', '#F4F4FC', '#1A1A24',
];

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)', key: 'v' },
  { id: 'rectangle', icon: Square, label: 'Rectangle (R)', key: 'r' },
  { id: 'circle', icon: Circle, label: 'Circle (C)', key: 'c' },
  { id: 'sticky', icon: StickyNote, label: 'Sticky Note (S)', key: 's' },
  { id: 'line', icon: Minus, label: 'Line (L)', key: 'l' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow (A)', key: 'a' },
  { id: 'text', icon: Type, label: 'Text (T)', key: 't' },
  { id: 'image', icon: Image, label: 'Image (I)', key: 'i' },
];

/**
 * Toolbar — vertical tool bar on the left side of the canvas.
 * Glassmorphism styling with Lucide icons and tooltips.
 */
export default function Toolbar() {
  const tool = useCanvasStore((s) => s.tool);
  const setTool = useCanvasStore((s) => s.setTool);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const setFillColor = useCanvasStore((s) => s.setFillColor);

  return (
    <div className="h-14 flex-shrink-0 flex flex-row items-center px-4 gap-2 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-30 w-full overflow-x-auto overflow-y-hidden">
      {/* Tool buttons */}
      {TOOLS.map(({ id, icon: Icon, label }, index) => {
        const isActive = tool === id;
        const numberKey = index + 1; // 1 to 8
        return (
          <button
            key={id}
            onClick={() => setTool(id)}
            className={`
              relative w-10 h-10 flex items-center justify-center rounded-sf-md transition-all duration-sf-fast
              ${isActive
                ? 'bg-primary-500/20 text-primary-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
            title={`${label} — ${numberKey}`}
          >
            <Icon size={20} />
            <span className={`absolute bottom-0.5 right-1 text-[9px] font-bold pointer-events-none select-none ${isActive ? 'text-primary-400/80' : 'text-slate-500'}`}>
              {numberKey}
            </span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="h-7 w-px bg-slate-700 mx-2" />

      {/* Color picker */}
      <div className="flex flex-row items-center gap-1">
        {FILL_COLORS.slice(0, 6).map((color) => (
          <button
            key={color}
            onClick={() => setFillColor(color)}
            className={`
              w-5 h-5 rounded-full transition-all
              ${fillColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'}
            `}
            style={{ backgroundColor: color }}
            title={`Color: ${color}`}
          />
        ))}
      </div>
    </div>
  );
}
