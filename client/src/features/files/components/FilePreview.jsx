import Modal from '@/features/shared/Modal';

/**
 * FilePreview — modal for full-size image preview.
 * Only supports images; other file types should be downloaded directly.
 */
export default function FilePreview({ file, onClose }) {
  const filename = file.filename || file.original_name || 'Image Preview';

  return (
    <Modal isOpen={true} onClose={onClose} title={filename} size="xl">
      <div className="flex items-center justify-center max-h-[70vh] overflow-hidden rounded-sf-md bg-slate-800">
        <img
          src={file.url}
          alt={filename}
          className="max-w-full max-h-[70vh] object-contain"
          loading="lazy"
        />
      </div>

      {/* File info */}
      <div className="flex items-center justify-between mt-3 text-sf-xs text-slate-500">
        <span>{filename}</span>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          Open original
        </a>
      </div>
    </Modal>
  );
}
