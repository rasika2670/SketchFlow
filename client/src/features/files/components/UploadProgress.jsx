import { X } from 'lucide-react';

/**
 * UploadProgress — inline progress bar shown during file uploads.
 * Shows filename, percentage bar, and cancel button.
 */
export default function UploadProgress({ filename, progress, status, onCancel }) {
  const isError = status === 'error';
  const isDone = status === 'done';

  return (
    <div className="flex items-center gap-2 p-2 rounded-sf-sm bg-slate-800/50 border border-slate-700/50">
      {/* File info + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-slate-300 truncate" title={filename}>
            {filename}
          </span>
          <span className={`text-[10px] font-medium ${
            isError ? 'text-error' : isDone ? 'text-success' : 'text-slate-400'
          }`}>
            {isError ? 'Failed' : isDone ? 'Done' : `${progress}%`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isError ? 'bg-error' : isDone ? 'bg-success' : 'bg-primary-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Cancel button (only while uploading) */}
      {!isDone && !isError && (
        <button
          onClick={onCancel}
          className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-sf-sm transition-colors"
          title="Cancel upload"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
