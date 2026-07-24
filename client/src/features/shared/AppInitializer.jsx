import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import LoadingSpinner from './LoadingSpinner';

export default function AppInitializer({ children }) {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initializeTheme = useUIStore((state) => state.initializeTheme);

  useEffect(() => {
    initialize();
    initializeTheme();
  }, [initialize, initializeTheme]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-sf-deep flex flex-col items-center justify-center gap-sf-6">
        {/* SketchFlow Logo/Name */}
        <div className="flex items-center gap-sf-3">
          <div className="w-10 h-10 rounded-sf-md bg-primary-500 flex items-center justify-center">
            <svg
              width="24"
              height="24"
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
          <span className="text-sf-2xl font-bold text-slate-50 tracking-tight">
            SketchFlow
          </span>
        </div>

        {/* Loading spinner */}
        <LoadingSpinner size={28} />

        <p className="text-sf-sm text-slate-400">Loading your workspace...</p>
      </div>
    );
  }

  return children;
}
