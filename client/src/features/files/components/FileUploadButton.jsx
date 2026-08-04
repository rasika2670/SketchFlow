import { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import * as filesApi from '@/api/files.api';
import { env } from '@/config/env';
import UploadProgress from './UploadProgress';
import toast from 'react-hot-toast';

/**
 * FileUploadButton — triggers file selection and uploads directly to Cloudinary
 * using signed upload with XHR for progress tracking.
 *
 * Flow:
 * 1. User selects file(s) via native file input
 * 2. GET upload signature from backend
 * 3. Upload to Cloudinary via XHR with progress events
 * 4. POST metadata to backend to register the upload
 * 5. Call onUploadComplete with the server file record
 */
export default function FileUploadButton({ boardId, onUploadComplete }) {
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]); // { id, filename, progress, xhr, status }

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

  const uploadFile = useCallback(async (file) => {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Add to uploads list
    setUploads((prev) => [
      ...prev,
      { id: uploadId, filename: file.name, progress: 0, xhr: null, status: 'uploading' },
    ]);

    try {
      // Step 1: Get signed upload params from backend
      const { data: sigData } = await filesApi.getUploadSignature(boardId);
      const signature = sigData.data || sigData;

      const cloudName = env.CLOUDINARY_CLOUD_NAME || signature.cloud_name;
      if (!cloudName) {
        throw new Error('Cloudinary cloud name not configured');
      }

      // Step 2: Upload to Cloudinary via XHR
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.api_key);
      formData.append('timestamp', signature.timestamp);
      formData.append('signature', signature.signature);
      if (signature.folder) formData.append('folder', signature.folder);
      if (signature.upload_preset) formData.append('upload_preset', signature.upload_preset);

      const cloudinaryResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploads((prev) =>
              prev.map((u) => (u.id === uploadId ? { ...u, progress: pct } : u))
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        // Store xhr reference for cancel functionality
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, xhr } : u))
        );

        xhr.open('POST', cloudinaryUrl);
        xhr.send(formData);
      });

      // Step 3: Register metadata on backend
      const { data: registerData } = await filesApi.registerUpload(boardId, {
        filename: file.name,
        url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        mime_type: file.type || cloudinaryResult.resource_type + '/' + cloudinaryResult.format,
        size: file.size,
      });

      const serverFile = registerData.data?.file || registerData.file;

      // Update upload status
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'done', progress: 100 } : u))
      );

      // Notify parent
      if (serverFile && onUploadComplete) {
        onUploadComplete(serverFile);
      }

      // Remove from list after a short delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 2000);

      toast.success(`Uploaded ${file.name}`);
    } catch (error) {
      if (error.message === 'Upload cancelled') {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        return;
      }

      console.error('[FileUploadButton] Upload failed:', error);
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'error' } : u))
      );

      const message = error.response?.data?.message || error.message || 'Upload failed';
      toast.error(message);

      // Remove error entry after 3s
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 3000);
    }
  }, [boardId, onUploadComplete]);

  const cancelUpload = (uploadId) => {
    const upload = uploads.find((u) => u.id === uploadId);
    if (upload?.xhr) {
      upload.xhr.abort();
    }
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
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
        className="w-full sf-btn-secondary text-sf-sm flex items-center justify-center gap-2"
      >
        <Upload size={15} />
        Upload File
      </button>

      {/* Active uploads */}
      {uploads.length > 0 && (
        <div className="mt-3 space-y-2">
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
      )}
    </div>
  );
}
