import { useForm } from 'react-hook-form';
import Modal from '@/features/shared/Modal';
import { useBoardStore } from '@/stores/boardStore';

export default function CreateBoardModal({ isOpen, onClose, workspaceId }) {
  const createBoard = useBoardStore((s) => s.createBoard);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data) => {
    const result = await createBoard({ name: data.name, workspaceId });
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Board" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-sf-4">
        {/* Board Name */}
        <div>
          <label htmlFor="board-name" className="sf-label">
            Board Name <span className="text-error">*</span>
          </label>
          <input
            id="board-name"
            type="text"
            className="sf-input"
            placeholder="e.g. Sprint 4 Planning"
            autoFocus
            {...register('name', {
              required: 'Board name is required',
              maxLength: {
                value: 50,
                message: 'Name must be 50 characters or less',
              },
            })}
          />
          {errors.name && <p className="sf-error">{errors.name.message}</p>}
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
            {isSubmitting ? 'Creating...' : 'Create Board'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
