import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthLayout from './components/AuthLayout';
import * as authApi from '@/api/auth.api';
import LoadingSpinner from '@/features/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to send reset email. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your email">
        <div className="text-center py-sf-4">
          <div className="flex justify-center mb-sf-4">
            <div className="p-sf-4 rounded-full bg-success/10">
              <CheckCircle size={32} className="text-success" />
            </div>
          </div>
          <p className="text-sf-base text-slate-300 mb-sf-6">
            If an account exists with that email, we&apos;ve sent a password
            reset link. Check your inbox and spam folder.
          </p>
          <Link to="/login" className="sf-btn-secondary inline-flex">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
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

        {/* Submit */}
        <button
          type="submit"
          className="sf-btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size={18} className="text-white" />
          ) : (
            <Mail size={18} />
          )}
          {isLoading ? 'Sending...' : 'Send reset link'}
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
