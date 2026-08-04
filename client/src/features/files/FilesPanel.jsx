import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import * as filesApi from '@/api/files.api';
import FileCard from './components/FileCard';
import FileUploadButton from './components/FileUploadButton';
import FilePreview from './components/FilePreview';
import EmptyState from '@/features/shared/EmptyState';
import LoadingSpinner from '@/features/shared/LoadingSpinner';
import toast from 'react-hot-toast';

/**
 * FilesPanel — file list with upload button, displayed inside the right sidebar.
 * Manages local state for the files array (no Zustand store needed since files
 * are a simpler domain — no real-time socket updates besides file:deleted).
 */
export default function FilesPanel() {
  const { boardId } = useParams();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  // ─── Fetch files on mount ──────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (!boardId) return;
    setIsLoading(true);
    try {
      const { data } = await filesApi.listByBoard(boardId);
      const filesList = Array.isArray(data.data) ? data.data : (data.data?.files || data.files || []);
      setFiles(filesList);
    } catch (error) {
      console.error('[FilesPanel] Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ─── Handle upload complete ────────────────────────────────────────────
  const handleUploadComplete = (newFile) => {
    setFiles((prev) => [newFile, ...prev]);
  };

  // ─── Handle file delete ────────────────────────────────────────────────
  const handleDelete = async (fileId) => {
    const previousFiles = files;
    setFiles((prev) => prev.filter((f) => f.id !== fileId));

    try {
      await filesApi.deleteFile(boardId, fileId);
      toast.success('File deleted');
    } catch (error) {
      setFiles(previousFiles);
      const message = error.response?.data?.message || 'Failed to delete file.';
      toast.error(message);
    }
  };

  // ─── Handle preview ───────────────────────────────────────────────────
  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Upload button area */}
      <div className="flex-shrink-0 p-3 border-b border-slate-700/50">
        <FileUploadButton
          boardId={boardId}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-3">
        {files.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No files yet"
            description="Upload files to share with your team"
          />
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={() => handleDelete(file.id)}
                onPreview={() => handlePreview(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image preview modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
