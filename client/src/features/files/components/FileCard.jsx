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
 * FileCard — displays a single file as a responsive grid card.
 * Includes hover overlay for actions (download, preview, delete).
 */
function FileCard({ file, onDelete, onPreview }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const Icon = getFileIcon(file.mime_type);
  const timestamp = file.created_at
    ? formatDistanceToNow(new Date(file.created_at), { addSuffix: true })
    : '';

  const filename = file.name || file.filename || file.original_name || 'Untitled';
  const isImg = isImage(file.mime_type);

  return (
    <>
      <div className="group relative flex flex-col bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 rounded-sf-lg overflow-hidden transition-all duration-sf-fast shadow-sm hover:shadow-md">
        
        {/* Preview Area */}
        <div className="h-36 bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
          {isImg ? (
            <img 
              src={file.url} 
              alt={filename} 
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <Icon size={48} className="text-slate-600 group-hover:text-slate-500 transition-colors" />
          )}

          {/* Hover Actions Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-sf-fast flex items-center justify-center gap-3 backdrop-blur-[2px]">
            {isImg && (
              <button
                onClick={onPreview}
                className="p-2.5 bg-slate-800 hover:bg-primary-500 text-slate-200 hover:text-white rounded-full transition-colors shadow-lg"
                title="Preview"
              >
                <Eye size={18} />
              </button>
            )}
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-primary-500 text-slate-200 hover:text-white rounded-full transition-colors shadow-lg"
              title="Download"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2.5 bg-slate-800 hover:bg-error text-slate-200 hover:text-white rounded-full transition-colors shadow-lg"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Metadata Area */}
        <div className="p-3.5 flex flex-col flex-1 border-t border-slate-700/50">
          <div className="flex items-start gap-2 mb-3">
            <Icon size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-sf-sm font-semibold text-slate-200 truncate group-hover:text-primary-400 transition-colors" title={filename}>
              {filename}
            </span>
          </div>
          
          <div className="mt-auto flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span className="truncate max-w-[65%]">{file.uploader_name || 'Unknown User'}</span>
            <span className="flex-shrink-0">{formatFileSize(file.size)}</span>
          </div>
          {timestamp && (
             <div className="text-[10px] text-slate-600 mt-1.5">
               Added {timestamp}
             </div>
          )}
        </div>
      </div>

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
