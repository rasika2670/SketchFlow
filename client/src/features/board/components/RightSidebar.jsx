import { ClipboardList, MessageCircle, FolderOpen, X, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const TABS = [
  { id: 'tasks', icon: ClipboardList, label: 'Tasks' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
];

/**
 * RightSidebar — collapsible panel on the right side of the board.
 * Tabs: Tasks | Chat | Files (placeholder panels for Phase 4/5).
 */
export default function RightSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const activePanel = useUIStore((s) => s.activePanel);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

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
    <div className="w-80 flex-shrink-0 flex flex-col bg-slate-900/95 backdrop-blur-md border-l border-slate-700 z-30 animate-slide-in-right">
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

      {/* Panel content — placeholder for Phase 4/5 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activePanel === 'tasks' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ClipboardList size={40} className="text-slate-600 mb-3" />
            <p className="text-sf-base text-slate-400 font-medium">Task Panel</p>
            <p className="text-sf-sm text-slate-500 mt-1">Coming in Phase 4</p>
          </div>
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
