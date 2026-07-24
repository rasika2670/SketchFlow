import { Routes, Route, Navigate } from 'react-router-dom';

// Auth pages
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';

// Shared
import ProtectedRoute from '@/features/shared/ProtectedRoute';

// Placeholder for protected pages (Phase 2+)
function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-sf-deep flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-sf-2xl font-bold text-slate-50 mb-sf-2">Dashboard</h1>
        <p className="text-sf-base text-slate-400">Workspace management coming in Phase 2</p>
      </div>
    </div>
  );
}

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
        <Route path="/" element={<DashboardPlaceholder />} />
        {/* Phase 2: /workspaces/:workspaceId */}
        {/* Phase 3: /boards/:boardId */}
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
