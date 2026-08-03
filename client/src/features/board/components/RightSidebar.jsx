import { useRef, useState, useCallback, useEffect } from 'react';
import { ClipboardList, MessageCircle, FolderOpen, X, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import TaskPanel from '@/features/tasks/TaskPanel';

const TABS = [
  { id: 'tasks', icon: ClipboardList, label: 'Tasks' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
];

const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;
const STORAGE_KEY = 'sf-sidebar-width';

/**
 * RightSidebar — collapsible, resizable panel on the right side of the board.
 * Tabs: Tasks | Chat | Files.
 * Drag the left edge to resize (240–600px, persisted in localStorage).
 */
export default function RightSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const activePanel = useUIStore((s) => s.activePanel);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  // ─── Resizable width ───────────────────────────────────────────────────
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : NaN;
    return !isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH ? parsed : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);
  const widthRef = useRef(width);

  // Keep ref in sync so mouseUp can read the latest value
  useEffect(() => { widthRef.current = width; }, [width]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = widthRef.current;
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      // Handle is on the LEFT edge of a RIGHT-aligned sidebar:
      // dragging left (clientX decreases) → sidebar expands leftward
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem(STORAGE_KEY, String(widthRef.current));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-slate-800/80 backdrop-blur-md border border-slate-700 border-r-0 rounded-l-sf-md text-slate-400 hover:text-slate-50 transition-colors"
        title="Open sidebar"
      >
        <ChevronRight size={16} className="rotate-180" />
      </button>
    );
  }

  return (
    <div
      className="relative flex-shrink-0 flex flex-col bg-slate-900/95 backdrop-blur-md border-l border-slate-700 z-30 animate-slide-in-right"
      style={{ width }}
    >
      {/* Resize handle — left edge */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-40
          group flex items-center justify-center
          hover:bg-primary-500/20 active:bg-primary-500/30
          transition-colors duration-sf-fast
          ${isResizing ? 'bg-primary-500/30' : ''}
        `}
        title="Drag to resize"
      >
        {/* Visual indicator — subtle dots on hover */}
        <div className={`
          w-0.5 h-8 rounded-full transition-opacity duration-sf-fast
          ${isResizing ? 'bg-primary-400 opacity-100' : 'bg-slate-500 opacity-0 group-hover:opacity-60'}
        `} />
      </div>

      {/* Tabs + close button */}
      <div className="flex items-center border-b border-slate-700">
        <div className="flex flex-1">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-3 text-sf-sm font-medium transition-colors border-b-2
                ${activePanel === id
                  ? 'text-primary-400 border-primary-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
                }
              `}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 mr-1 text-slate-400 hover:text-slate-50 hover:bg-slate-700/50 rounded-sf-sm transition-colors"
          title="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activePanel === 'tasks' && (
          <TaskPanel />
        )}
        {activePanel === 'chat' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={40} className="text-slate-600 mb-3" />
            <p className="text-sf-base text-slate-400 font-medium">Chat Panel</p>
            <p className="text-sf-sm text-slate-500 mt-1">Coming in Phase 5</p>
          </div>
        )}
        {activePanel === 'files' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderOpen size={40} className="text-slate-600 mb-3" />
            <p className="text-sf-base text-slate-400 font-medium">Files Panel</p>
            <p className="text-sf-sm text-slate-500 mt-1">Coming in Phase 5</p>
          </div>
        )}
      </div>
    </div>
  );
}
