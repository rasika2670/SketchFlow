import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import Modal from '@/features/shared/Modal';
import { useWorkspaceStore } from '@/stores/workspaceStore';

// Role options for the selector
const ROLES = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view boards and elements',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Can create and edit boards & elements',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access including member management',
  },
];

export default function InviteMemberModal({ isOpen, onClose, workspaceId }) {
  const inviteMember = useWorkspaceStore((s) => s.inviteMember);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      role: 'editor',
    },
  });

  const onSubmit = async (data) => {
    const result = await inviteMember(workspaceId, data.email, data.role);
    if (result) {
      reset();
      onClose();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Member" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-sf-5">
        {/* Email Input — designed for future debounced search/autocomplete */}
        <div>
          <label htmlFor="invite-email" className="sf-label">
            Email Address <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-sf-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="invite-email"
              type="email"
              className="sf-input pl-10"
              placeholder="colleague@example.com"
              autoFocus
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
          </div>
          {errors.email && <p className="sf-error">{errors.email.message}</p>}
        </div>

        {/* Role Selector */}
        <div>
          <label className="sf-label">Role</label>
          <div className="space-y-sf-2">
            {ROLES.map((role) => (
              <label
                key={role.value}
                className="flex items-start gap-sf-3 p-sf-3 rounded-sf-md border border-slate-700 hover:border-sf-hover cursor-pointer transition-colors duration-sf-fast has-[:checked]:border-primary-500 has-[:checked]:bg-primary-500/5"
              >
                <input
                  type="radio"
                  value={role.value}
                  className="mt-0.5 accent-primary-500"
                  {...register('role')}
                />
                <div>
                  <p className="text-sf-sm font-medium text-slate-200">
                    {role.label}
                  </p>
                  <p className="text-sf-xs text-slate-400">
                    {role.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-sf-3 pt-sf-2">
          <button
            type="button"
            onClick={handleClose}
            className="sf-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="sf-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Inviting...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
