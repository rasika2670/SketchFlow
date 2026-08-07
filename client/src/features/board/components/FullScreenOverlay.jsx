
import { useUIStore } from '@/stores/uiStore';
import TaskPanel from '@/features/tasks/TaskPanel';
import ChatPanel from '@/features/chat/ChatPanel';
import FilesPanel from '@/features/files/FilesPanel';

export default function FullScreenOverlay() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const activePanel = useUIStore((s) => s.activePanel);

  if (!sidebarOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-slate-900 flex animate-fade-in">
      <div className="relative flex flex-col w-full h-full overflow-hidden">
        <div className="flex-1 overflow-hidden p-6 relative">
          {activePanel === 'tasks' && <TaskPanel />}
          {activePanel === 'chat' && <ChatPanel />}
          {activePanel === 'files' && <FilesPanel />}
        </div>
      </div>
    </div>
  );
}
