import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthLayout from './components/AuthLayout';
import * as authApi from '@/api/auth.api';
import LoadingSpinner from '@/features/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setIsReset(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to reset password. The link may have expired.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isReset) {
    return (
      <AuthLayout title="Password reset!">
        <div className="text-center py-sf-4">
          <div className="flex justify-center mb-sf-4">
            <div className="p-sf-4 rounded-full bg-success/10">
              <CheckCircle size={32} className="text-success" />
            </div>
          </div>
          <p className="text-sf-base text-slate-300 mb-sf-6">
            Your password has been reset successfully. You can now sign in with
            your new password.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="sf-btn-primary"
          >
            Go to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-sf-4">
        {/* New Password */}
        <div>
          <label htmlFor="password" className="sf-label">
            New password
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
                message: 'Must include uppercase, lowercase, and a number',
              },
            })}
          />
          {errors.password && (
            <p className="sf-error">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="sf-label">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className="sf-input"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === passwordValue || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && (
            <p className="sf-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="sf-btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size={18} className="text-white" />
          ) : (
            <KeyRound size={18} />
          )}
          {isLoading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-sf-6 text-center text-sf-sm text-slate-400">
        <Link to="/login" className="sf-link font-medium inline-flex items-center gap-1">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
