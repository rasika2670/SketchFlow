import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
  isLoading = false,
}) {
  const confirmButtonClass =
    variant === 'danger' ? 'sf-btn-danger' : 'sf-btn-primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sf-base text-slate-300 mb-sf-6">{message}</p>

      <div className="flex items-center justify-end gap-sf-3">
        <button
          onClick={onClose}
          className="sf-btn-secondary"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={confirmButtonClass}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
