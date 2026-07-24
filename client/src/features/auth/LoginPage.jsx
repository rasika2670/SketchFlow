import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from './components/AuthLayout';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/features/shared/LoadingSpinner';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your SketchFlow account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-sf-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="sf-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="sf-input"
            autoComplete="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />
          {errors.email && (
            <p className="sf-error">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-sf-1">
            <label htmlFor="password" className="sf-label mb-0">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sf-xs sf-link"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="sf-input"
            autoComplete="current-password"
            {...register('password', {
              required: 'Password is required',
            })}
          />
          {errors.password && (
            <p className="sf-error">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="sf-btn-primary w-full mt-sf-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size={18} className="text-white" />
          ) : (
            <LogIn size={18} />
          )}
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-sf-6 text-center text-sf-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="sf-link font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
