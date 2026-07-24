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

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    localStorage.setItem('sf-theme', newTheme);

    // Toggle dark class on <html>
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // Initialize theme from localStorage on app load
  initializeTheme: () => {
    const theme = get().theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },
}));
