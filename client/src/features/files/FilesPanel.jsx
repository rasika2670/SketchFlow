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

import { getBoardSocket } from '@/sockets/socket';

/**
 * FilesPanel — file list with upload button, displayed inside the right sidebar.
 * Manages local state for the files array.
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

  // ─── Socket Listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = getBoardSocket();
    if (!socket) return;

    const handleFileUploaded = (newFile) => {
      setFiles((prev) => {
        // Prevent duplicates
        if (prev.some((f) => f.id === newFile.id)) return prev;
        return [newFile, ...prev];
      });
    };

    const handleFileDeleted = ({ id }) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    socket.on('file:uploaded', handleFileUploaded);
    socket.on('file:deleted', handleFileDeleted);

    return () => {
      socket.off('file:uploaded', handleFileUploaded);
      socket.off('file:deleted', handleFileDeleted);
    };
  }, []);

  // ─── Handle upload complete ────────────────────────────────────────────
  const handleUploadComplete = (newFile) => {
    // Rely on socket for UI update, or do optimistic update if needed.
    // For now, since FileUploadButton triggers the API, the API broadcasts
    // 'file:uploaded' to all clients including sender.
    // To avoid duplicates, socket handler deduplicates.
    setFiles((prev) => {
      if (prev.some((f) => f.id === newFile.id)) return prev;
      return [newFile, ...prev];
    });
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
