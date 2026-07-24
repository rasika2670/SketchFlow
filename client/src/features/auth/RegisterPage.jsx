import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from './components/AuthLayout';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/features/shared/LoadingSpinner';

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-error' };
  if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-warning' };
  return { score: 3, label: 'Strong', color: 'bg-success' };
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data) => {
    const success = await registerUser(data.name, data.email, data.password);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating with your team on SketchFlow"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-sf-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="sf-label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            className="sf-input"
            autoComplete="name"
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
          />
          {errors.name && (
            <p className="sf-error">{errors.name.message}</p>
          )}
        </div>

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
          <label htmlFor="password" className="sf-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="sf-input"
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message:
                  'Must include uppercase, lowercase, and a number',
              },
              onChange: (e) => setPasswordValue(e.target.value),
            })}
          />
          {errors.password && (
            <p className="sf-error">{errors.password.message}</p>
          )}

          {/* Password strength indicator */}
          {passwordValue && (
            <div className="mt-sf-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors duration-sf-normal ${
                      level <= strength.score
                        ? strength.color
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-sf-xs ${
                strength.score === 1 ? 'text-error' :
                strength.score === 2 ? 'text-warning' :
                'text-success'
              }`}>
                {strength.label}
              </p>
            </div>
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
            <UserPlus size={18} />
          )}
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-sf-6 text-center text-sf-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="sf-link font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
