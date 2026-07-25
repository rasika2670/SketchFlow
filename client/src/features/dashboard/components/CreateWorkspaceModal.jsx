import { useForm } from 'react-hook-form';
import Modal from '@/features/shared/Modal';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export default function CreateWorkspaceModal({ isOpen, onClose }) {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data) => {
    const result = await createWorkspace(data);
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Workspace" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-sf-4">
        {/* Name */}
        <div>
          <label htmlFor="workspace-name" className="sf-label">
            Workspace Name <span className="text-error">*</span>
          </label>
          <input
            id="workspace-name"
            type="text"
            className="sf-input"
            placeholder="e.g. Marketing Team"
            autoFocus
            {...register('name', {
              required: 'Workspace name is required',
              maxLength: {
                value: 50,
                message: 'Name must be 50 characters or less',
              },
            })}
          />
          {errors.name && <p className="sf-error">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="workspace-description" className="sf-label">
            Description
          </label>
          <textarea
            id="workspace-description"
            className="sf-input resize-none"
            rows={3}
            placeholder="What is this workspace for?"
            {...register('description', {
              maxLength: {
                value: 200,
                message: 'Description must be 200 characters or less',
              },
            })}
          />
          {errors.description && (
            <p className="sf-error">{errors.description.message}</p>
          )}
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
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
