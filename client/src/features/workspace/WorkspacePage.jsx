import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Settings, LayoutGrid, ChevronRight, Users, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useBoardStore } from '@/stores/boardStore';
import { useAuthStore } from '@/stores/authStore';
import EmptyState from '@/features/shared/EmptyState';
import LoadingSpinner from '@/features/shared/LoadingSpinner';
import BoardCard from './components/BoardCard';
import CreateBoardModal from './components/CreateBoardModal';
import MemberList from './components/MemberList';
import WorkspaceSettings from './components/WorkspaceSettings';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const {
    currentWorkspace,
    members,
    isLoading: wsLoading,
    fetchWorkspaceById,
    fetchMembers,
  } = useWorkspaceStore();

  const {
    boards,
    isLoading: boardsLoading,
    fetchBoards,
  } = useBoardStore();

  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch workspace details, members, and boards on mount
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceById(workspaceId);
      fetchMembers(workspaceId);
      fetchBoards(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceById, fetchMembers, fetchBoards]);

  // Determine current user's role in this workspace
  const currentMember = members.find(
    (m) => (m.user_id || m.id) === user?.id
  );
  const isAdmin = currentMember?.role === 'admin';

  const isLoading = wsLoading || boardsLoading;

  if (isLoading && !currentWorkspace) {
    return (
      <div className="min-h-screen bg-sf-deep flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sf-deep">
      {/* ─── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-sf-raised/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-sf-6 h-14 flex items-center justify-between">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-sf-1 text-sf-sm" aria-label="Breadcrumb">
            <Link
              to="/"
              className="text-slate-400 hover:text-slate-50 transition-colors duration-sf-fast"
            >
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-slate-500" />
            <span className="text-slate-50 font-medium truncate max-w-[200px]">
              {currentWorkspace?.name || 'Workspace'}
            </span>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-sf-2">
            {isAdmin && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-sf-2 rounded-sf-sm text-slate-400 hover:text-slate-50 hover:bg-slate-700/50 transition-colors duration-sf-fast"
                title="Workspace Settings"
                id="workspace-settings-button"
              >
                <Settings size={18} />
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-sf-2 rounded-sf-sm text-slate-400 hover:text-slate-50 hover:bg-slate-700/50 transition-colors duration-sf-fast lg:hidden"
              title={sidebarOpen ? 'Hide members' : 'Show members'}
            >
              {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Layout ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-sf-6 py-sf-6 flex gap-sf-6">
        {/* Board Grid (main area) */}
        <main className="flex-1 min-w-0">
          {/* Section header */}
          <div className="flex items-center justify-between mb-sf-6">
            <div>
              <h1 className="text-sf-xl font-bold text-slate-50">
                {currentWorkspace?.name}
              </h1>
              {currentWorkspace?.description && (
                <p className="text-sf-sm text-slate-400 mt-sf-1">
                  {currentWorkspace.description}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowCreateBoardModal(true)}
              className="sf-btn-primary"
              id="create-board-button"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Board</span>
            </button>
          </div>

          {/* Boards */}
          {boardsLoading ? (
            <div className="flex items-center justify-center py-sf-16">
              <LoadingSpinner />
            </div>
          ) : boards.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="No boards yet"
              description="Create your first board to start sketching and collaborating with your team."
              action={
                <button
                  onClick={() => setShowCreateBoardModal(true)}
                  className="sf-btn-primary"
                >
                  <Plus size={18} />
                  Create Board
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-sf-4">
              {boards.map((board) => (
                <BoardCard key={board.id} board={board} />
              ))}
            </div>
          )}
        </main>

        {/* ─── Member Sidebar ─────────────────────────────────────────────── */}
        <aside
          className={`w-72 shrink-0 transition-all duration-sf-normal ${
            sidebarOpen
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0 w-0 overflow-hidden'
          } hidden lg:block`}
        >
          <MemberList
            workspaceId={workspaceId}
            members={members}
            isAdmin={isAdmin}
            currentUserId={user?.id}
          />
        </aside>
      </div>

      {/* Mobile member sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-sf-overlay backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-80 bg-sf-raised border-l border-slate-700 shadow-sf-floating animate-slide-in-right overflow-y-auto p-sf-4">
            <MemberList
              workspaceId={workspaceId}
              members={members}
              isAdmin={isAdmin}
              currentUserId={user?.id}
            />
          </aside>
        </div>
      )}

      {/* Modals */}
      <CreateBoardModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        workspaceId={workspaceId}
      />

      {showSettings && (
        <WorkspaceSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          workspace={currentWorkspace}
          onDeleted={() => navigate('/')}
        />
      )}
    </div>
  );
}
