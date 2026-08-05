import { useState, useCallback } from 'react';
import * as filesApi from '@/api/files.api';
import { env } from '@/config/env';
import toast from 'react-hot-toast';

export function useFileUpload({ boardId, onUploadComplete }) {
  const [uploads, setUploads] = useState([]);

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
        name: file.name,
        url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        mime_type: file.type || cloudinaryResult.resource_type + '/' + cloudinaryResult.format,
        size: file.size,
      });

      const serverFile = registerData.data;

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
      return serverFile; // return the uploaded file
    } catch (error) {
      if (error.message === 'Upload cancelled') {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        return;
      }

      console.error('[useFileUpload] Upload failed:', error);
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'error' } : u))
      );

      const message = error.response?.data?.message || error.message || 'Upload failed';
      toast.error(message);

      // Remove error entry after 3s
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 3000);
      throw error;
    }
  }, [boardId, onUploadComplete]);

  const cancelUpload = useCallback((uploadId) => {
    setUploads((prev) => {
      const upload = prev.find((u) => u.id === uploadId);
      if (upload?.xhr) {
        upload.xhr.abort();
      }
      return prev.filter((u) => u.id !== uploadId);
    });
  }, []);

  return {
    uploads,
    uploadFile,
    cancelUpload
  };
}
