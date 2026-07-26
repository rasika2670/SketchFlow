import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth pages
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';

// Dashboard & Workspace (Phase 2)
import DashboardPage from '@/features/dashboard/DashboardPage';
import WorkspacePage from '@/features/workspace/WorkspacePage';

// Board (Phase 3) — lazy loaded for code splitting
const BoardPage = lazy(() => import('@/features/board/BoardPage'));

// Shared
import ProtectedRoute from '@/features/shared/ProtectedRoute';
import LoadingSpinner from '@/features/shared/LoadingSpinner';

// 404 page
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-sf-deep flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-sf-3xl font-bold text-slate-50 mb-sf-2">404</h1>
        <p className="text-sf-base text-slate-400 mb-sf-6">Page not found</p>
        <a href="/" className="sf-btn-primary">Go home</a>
      </div>
    </div>
  );
}

// Loading fallback for lazy-loaded board page
function BoardLoadingFallback() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner />
        <p className="text-sf-sm text-slate-400">Loading board...</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
        <Route
          path="/boards/:boardId"
          element={
            <Suspense fallback={<BoardLoadingFallback />}>
              <BoardPage />
            </Suspense>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
