import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // State
  sidebarOpen: true,
  activePanel: 'tasks', // 'tasks' | 'chat' | 'files'
  theme: localStorage.getItem('sf-theme') || 'dark',
  connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected'

  // Actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  setActivePanel: (panel) => {
    set({ activePanel: panel });
  },



  // Initialize theme from localStorage on app load
  initializeTheme: () => {
    document.documentElement.classList.add('dark');
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },
}));
