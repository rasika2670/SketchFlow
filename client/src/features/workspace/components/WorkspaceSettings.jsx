import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import Modal from '@/features/shared/Modal';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export default function WorkspaceSettings({
  isOpen,
  onClose,
  workspace,
  onDeleted,
}) {
  const { updateWorkspace, deleteWorkspace } = useWorkspaceStore();
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: workspace?.name || '',
      description: workspace?.description || '',
    },
  });

  const onSubmitEdit = async (data) => {
    const result = await updateWorkspace(workspace.id, data);
    if (result) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== workspace?.name) return;
    setIsDeleting(true);
    const success = await deleteWorkspace(workspace.id);
    setIsDeleting(false);
    if (success) {
      onClose();
      onDeleted?.();
    }
  };

  const canDelete = deleteConfirmName === workspace?.name;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspace Settings" size="md">
      <div className="space-y-sf-6">
        {/* ─── Edit Section ─────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-sf-4">
          <div>
            <label htmlFor="settings-name" className="sf-label">
              Workspace Name
            </label>
            <input
              id="settings-name"
              type="text"
              className="sf-input"
              {...register('name', {
                required: 'Name is required',
                maxLength: {
                  value: 50,
                  message: 'Name must be 50 characters or less',
                },
              })}
            />
            {errors.name && <p className="sf-error">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="settings-description" className="sf-label">
              Description
            </label>
            <textarea
              id="settings-description"
              className="sf-input resize-none"
              rows={3}
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

          <div className="flex justify-end">
            <button
              type="submit"
              className="sf-btn-primary"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* ─── Danger Zone ──────────────────────────────────────────────── */}
        <div className="border-t border-slate-700 pt-sf-6">
          {!showDeleteZone ? (
            <button
              onClick={() => setShowDeleteZone(true)}
              className="flex items-center gap-sf-2 text-sf-sm text-error hover:text-error/80 transition-colors duration-sf-fast"
              id="show-danger-zone-button"
            >
              <AlertTriangle size={16} />
              Delete this workspace
            </button>
          ) : (
            <div className="border border-error/20 rounded-sf-md p-sf-4 bg-error/5 animate-fade-in">
              <div className="flex items-start gap-sf-3 mb-sf-4">
                <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sf-sm font-semibold text-error">
                    Delete Workspace
                  </h4>
                  <p className="text-sf-xs text-slate-400 mt-sf-1">
                    This action is <strong className="text-slate-200">permanent</strong>.
                    All boards, elements, tasks, and data in this workspace will be
                    deleted and cannot be recovered.
                  </p>
                </div>
              </div>

              <div className="mb-sf-4">
                <label
                  htmlFor="delete-confirm"
                  className="sf-label"
                >
                  Type <strong className="text-slate-50">{workspace?.name}</strong> to
                  confirm
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  className="sf-input"
                  placeholder={workspace?.name}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-sf-3">
                <button
                  onClick={() => {
                    setShowDeleteZone(false);
                    setDeleteConfirmName('');
                  }}
                  className="sf-btn-secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || isDeleting}
                  className="sf-btn-danger"
                  id="confirm-delete-workspace-button"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Workspace'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
