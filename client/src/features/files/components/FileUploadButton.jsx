import { useRef } from 'react';
import { Upload } from 'lucide-react';
import UploadProgress from './UploadProgress';
import { useFileUpload } from '@/hooks/useFileUpload';

/**
 * FileUploadButton — triggers file selection and uploads directly to Cloudinary
 * using signed upload with XHR for progress tracking.
 */
export default function FileUploadButton({ boardId, onUploadComplete }) {
  const fileInputRef = useRef(null);
  const { uploads, uploadFile, cancelUpload } = useFileUpload({ boardId, onUploadComplete });

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Reset file input so the same file can be selected again
    e.target.value = '';

    for (const file of selectedFiles) {
      await uploadFile(file);
    }
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
      />

      {/* Upload button */}
      <button
        onClick={handleClick}
        className="w-fit sf-btn-secondary text-sf-sm flex items-center justify-center gap-2"
      >
        <Upload size={15} />
        Upload File
      </button>

      {/* Active uploads - Floating Toaster */}
      {uploads.length > 0 && (
        <div className="fixed bottom-6 right-6 w-80 bg-slate-900 border border-slate-700 rounded-sf-lg shadow-sf-floating z-50 overflow-hidden flex flex-col animate-slide-up">
          <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex justify-between items-center">
            <span className="text-sf-sm font-semibold text-slate-200">
              Uploading {uploads.length} file{uploads.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {uploads.map((upload) => (
              <UploadProgress
                key={upload.id}
                filename={upload.filename}
                progress={upload.progress}
                status={upload.status}
                onCancel={() => cancelUpload(upload.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
