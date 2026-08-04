import { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  File,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '@/features/shared/ConfirmDialog';

/**
 * Map mime type to a Lucide icon.
 */
function getFileIcon(mimeType) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('document'))
    return FileText;
  return File;
}

/**
 * Format file size into human-readable string.
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Check if a file is an image for preview capability.
 */
function isImage(mimeType) {
  return mimeType?.startsWith('image/');
}

/**
 * FileCard — displays a single file with actions (download, preview, delete).
 */
function FileCard({ file, onDelete, onPreview }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const Icon = getFileIcon(file.mime_type);
  const timestamp = file.created_at
    ? formatDistanceToNow(new Date(file.created_at), { addSuffix: true })
    : '';

  const filename = file.filename || file.original_name || 'Untitled';

  return (
    <>
      <div className="group flex items-center gap-3 p-2.5 rounded-sf-md hover:bg-slate-800/50 transition-colors duration-sf-fast">
        {/* File type icon */}
        <div className="flex-shrink-0 p-2 rounded-sf-sm bg-slate-800 text-slate-400 group-hover:text-slate-300 transition-colors">
          <Icon size={18} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sf-sm font-medium text-slate-200 truncate" title={filename}>
            {filename}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>{formatFileSize(file.size)}</span>
            {file.uploader_name && (
              <>
                <span>·</span>
                <span className="truncate">{file.uploader_name}</span>
              </>
            )}
            {timestamp && (
              <>
                <span>·</span>
                <span>{timestamp}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-sf-fast">
          {/* Download */}
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-sf-sm transition-colors"
            title="Download"
          >
            <Download size={14} />
          </a>

          {/* Preview (images only) */}
          {isImage(file.mime_type) && (
            <button
              onClick={onPreview}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-sf-sm transition-colors"
              title="Preview"
            >
              <Eye size={14} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-sf-sm transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onDelete();
        }}
        title="Delete File"
        message={`Are you sure you want to delete "${filename}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}

export default memo(FileCard);
