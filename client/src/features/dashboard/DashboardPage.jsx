import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, LogOut, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import Avatar from '@/features/shared/Avatar';
import EmptyState from '@/features/shared/EmptyState';
import LoadingSpinner from '@/features/shared/LoadingSpinner';
import WorkspaceCard from './components/WorkspaceCard';
import CreateWorkspaceModal from './components/CreateWorkspaceModal';
import NotificationsDropdown from './components/NotificationsDropdown';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { workspaces, isLoading, fetchWorkspaces } = useWorkspaceStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-sf-deep">
      {/* ─── Top Navigation ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-sf-raised/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-sf-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-sf-3">
            <div className="w-9 h-9 rounded-sf-md bg-primary-500 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sf-lg font-bold text-slate-50 tracking-tight">
              SketchFlow
            </span>
          </div>

          {/* Right side: notifications and profile dropdown */}
          <div className="flex items-center gap-sf-2">
            <NotificationsDropdown />
            
            <div className="relative ml-sf-2" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-sf-2 px-sf-2 py-sf-1 rounded-sf-md hover:bg-slate-700/50 transition-colors duration-sf-fast"
              id="profile-menu-button"
            >
              <Avatar user={user} size="sm" />
              <span className="text-sf-sm text-slate-200 hidden sm:block">
                {user?.name}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-sf-2 w-56 bg-sf-raised border border-slate-700 rounded-sf-md shadow-sf-floating animate-slide-up origin-top-right">
                {/* User info */}
                <div className="px-sf-4 py-sf-3 border-b border-slate-700">
                  <p className="text-sf-sm font-medium text-slate-50 truncate">
                    {user?.name}
                  </p>
                  <p className="text-sf-xs text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="py-sf-1">
                  {/* Theme toggle */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-sf-3 px-sf-4 py-sf-2 text-sf-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-50 transition-colors duration-sf-fast"
                    id="theme-toggle-button"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-sf-3 px-sf-4 py-sf-2 text-sf-sm text-error hover:bg-error/10 transition-colors duration-sf-fast"
                    id="logout-button"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </nav>

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-sf-6 py-sf-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-sf-8">
          <div>
            <h1 className="text-sf-2xl font-bold text-slate-50">Workspaces</h1>
            <p className="text-sf-base text-slate-400 mt-sf-1">
              Manage your projects and collaborate with your team
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="sf-btn-primary"
            id="create-workspace-button"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Workspace</span>
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-sf-16">
            <LoadingSpinner />
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No workspaces yet"
            description="Create your first workspace to start collaborating with your team on boards and projects."
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="sf-btn-primary"
              >
                <Plus size={18} />
                Create Workspace
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sf-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
