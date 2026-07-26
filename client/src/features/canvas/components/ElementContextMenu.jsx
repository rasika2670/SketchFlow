import { useEffect, useRef } from 'react';
import {
  Pencil,
  Copy,
  Palette,
  ClipboardList,
  Trash2,
} from 'lucide-react';

const COLORS = [
  '#6E56CF', '#38BDF8', '#34D399', '#FBBF24', '#FB7185',
  '#A78BFA', '#F97316', '#2DD4BF', '#E879F9', '#F4F4FC',
];

/**
 * ElementContextMenu — right-click context menu for canvas elements.
 * Rendered as an HTML overlay positioned at click point.
 */
export default function ElementContextMenu({
  position,
  selectedIds,
  elements,
  onClose,
  onDuplicate,
  onDelete,
  onColorChange,
  onEdit,
  onConvertToTask,
}) {
  const menuRef = useRef(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position || selectedIds.length === 0) return null;

  const isSingle = selectedIds.length === 1;
  const singleElement = isSingle
    ? elements.find((el) => el.id === selectedIds[0])
    : null;
  const isSticky = singleElement?.type === 'sticky';
  const isText = singleElement?.type === 'text';

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] bg-slate-800 border border-slate-700 rounded-sf-md shadow-sf-floating animate-fade-in py-1"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Edit (text/sticky only) */}
      {isSingle && (isSticky || isText) && (
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sf-sm text-slate-200 hover:bg-slate-700 transition-colors"
          onClick={() => { onEdit?.(selectedIds[0]); onClose(); }}
        >
          <Pencil size={14} />
          Edit
        </button>
      )}

      {/* Duplicate */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sf-sm text-slate-200 hover:bg-slate-700 transition-colors"
        onClick={() => { onDuplicate?.(); onClose(); }}
      >
        <Copy size={14} />
        {isSingle ? 'Duplicate' : `Duplicate (${selectedIds.length})`}
      </button>

      {/* Color picker */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-2 text-sf-sm text-slate-400">
          <Palette size={14} />
          Color
        </div>
        <div className="flex gap-1 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white transition-all hover:scale-110"
              style={{ backgroundColor: color }}
              onClick={() => { onColorChange?.(color); onClose(); }}
            />
          ))}
        </div>
      </div>

      {/* Convert to Task (sticky only) */}
      {isSingle && isSticky && (
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sf-sm text-slate-200 hover:bg-slate-700 transition-colors"
          onClick={() => { onConvertToTask?.(selectedIds[0]); onClose(); }}
        >
          <ClipboardList size={14} />
          Convert to Task
        </button>
      )}

      {/* Divider */}
      <div className="border-t border-slate-700 my-1" />

      {/* Delete */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-sf-sm text-error hover:bg-slate-700 transition-colors"
        onClick={() => { onDelete?.(); onClose(); }}
      >
        <Trash2 size={14} />
        {isSingle ? 'Delete' : `Delete (${selectedIds.length})`}
      </button>
    </div>
  );
}
