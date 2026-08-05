import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import Modal from '@/features/shared/Modal';
import { useBoardStore } from '@/stores/boardStore';

export default function BoardSettingsModal({
  isOpen,
  onClose,
  board,
  onDeleted,
}) {
  const { updateBoard, deleteBoard } = useBoardStore();
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
      name: board?.name || '',
    },
  });

  const onSubmitEdit = async (data) => {
    const result = await updateBoard(board.id, data);
    if (result) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== board?.name) return;
    setIsDeleting(true);
    const success = await deleteBoard(board.id);
    setIsDeleting(false);
    if (success) {
      onClose();
      onDeleted?.();
    }
  };

  const canDelete = deleteConfirmName === board?.name;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Board Settings" size="md">
      <div className="space-y-sf-6">
        {/* ─── Edit Section ─────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-sf-4">
          <div>
            <label htmlFor="board-settings-name" className="sf-label">
              Board Name
            </label>
            <input
              id="board-settings-name"
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
            >
              <AlertTriangle size={16} />
              Delete this board
            </button>
          ) : (
            <div className="border border-error/20 rounded-sf-md p-sf-4 bg-error/5 animate-fade-in">
              <div className="flex items-start gap-sf-3 mb-sf-4">
                <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sf-sm font-semibold text-error">
                    Delete Board
                  </h4>
                  <p className="text-sf-xs text-slate-400 mt-sf-1">
                    This action is <strong className="text-slate-200">permanent</strong>.
                    All elements, tasks, chat messages, and data in this board will be
                    deleted and cannot be recovered.
                  </p>
                </div>
              </div>

              <div className="mb-sf-4">
                <label
                  htmlFor="board-delete-confirm"
                  className="sf-label"
                >
                  Type <strong className="text-slate-50">{board?.name}</strong> to
                  confirm
                </label>
                <input
                  id="board-delete-confirm"
                  type="text"
                  className="sf-input"
                  placeholder={board?.name}
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
                >
                  {isDeleting ? 'Deleting...' : 'Delete Board'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
