import { ClipboardList, MessageCircle, FolderOpen, PenTool } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useChatStore } from '@/stores/chatStore';

const TABS = [
  { id: 'canvas', icon: PenTool, label: 'Canvas' },
  { id: 'tasks', icon: ClipboardList, label: 'Tasks' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
];

/**
 * RightSidebar — A thin vertical strip of icons (Canva style).
 * Clicking an icon opens the FullScreenOverlay.
 */
export default function RightSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const activePanel = useUIStore((s) => s.activePanel);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  
  const unreadCount = useChatStore((s) => s.unreadCount);
  const clearUnread = useChatStore((s) => s.clearUnread);

  const handleTabClick = (id) => {
    if (id === 'canvas') {
      setSidebarOpen(false);
      return;
    }

    if (sidebarOpen && activePanel === id) {
      // Toggle off if already open
      setSidebarOpen(false);
    } else {
      setActivePanel(id);
      setSidebarOpen(true);
      if (id === 'chat') {
        clearUnread();
      }
    }
  };

  return (
    <div className="relative flex-shrink-0 flex flex-col w-16 bg-slate-900/95 backdrop-blur-md border-r border-slate-700 z-30 py-4 items-center space-y-4">
      {TABS.map(({ id, icon: Icon, label }) => {
        const isActive = id === 'canvas' ? !sidebarOpen : (sidebarOpen && activePanel === id);
        
        return (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`
              relative flex flex-col items-center justify-center w-12 h-12 rounded-sf-md transition-colors group
              ${isActive
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800'
              }
            `}
            title={label}
          >
            <Icon size={20} className="mb-1" />
            <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 absolute bottom-1 transition-opacity">
              {/* Optional: hover text or show below */}
            </span>
            
            {/* Unread Chat Badge */}
            {id === 'chat' && unreadCount > 0 && (
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 left-0 top-0"></span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
