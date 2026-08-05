import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useFileUpload } from '@/hooks/useFileUpload';
import UploadProgress from '@/features/files/components/UploadProgress';

/**
 * MessageInput — compact textarea with Enter-to-send and Shift+Enter for newlines.
 * Auto-grows up to 4 lines.
 */
export default function MessageInput({ boardId, parentId = null, placeholder = 'Type a message...' }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const currentUser = useAuthStore((s) => s.user);

  const handleUploadComplete = (serverFile) => {
    setAttachment(serverFile);
  };

  const { uploads, uploadFile, cancelUpload } = useFileUpload({ boardId, onUploadComplete: handleUploadComplete });

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || isSending || uploads.some(u => u.status === 'uploading')) return;

    setIsSending(true);
    const payload = { message: trimmed || (attachment ? `Attached: ${attachment.name}` : '') };
    if (parentId) payload.parent_id = parentId;
    if (attachment) payload.attachment_id = attachment.id;

    try {
      await sendMessage(boardId, payload, currentUser);
      setText('');
      setAttachment(null);
    } finally {
      setIsSending(false);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isSending, boardId, parentId, sendMessage, currentUser, attachment, uploads]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    e.target.value = '';
    // If there's an existing attachment, we just replace it
    setAttachment(null);
    await uploadFile(selectedFile);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-grow textarea
  const handleInput = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'; // max ~4 lines
    }
  };

  const isUploading = uploads.some((u) => u.status === 'uploading');
  const canSend = (text.trim() || attachment) && !isSending && !isUploading;

  return (
    <div className="flex-shrink-0 border-t border-slate-700/50 p-3 flex flex-col gap-2">
      {uploads.length > 0 && (
        <div className="space-y-2">
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
      
      {attachment && (
        <div className="flex items-center gap-2 bg-slate-700/50 p-2 rounded-sf-md text-sf-sm w-max max-w-full">
          <Paperclip size={14} className="text-slate-400 flex-shrink-0" />
          <span className="truncate text-slate-200">{attachment.name}</span>
          <button 
            onClick={() => setAttachment(null)}
            className="text-slate-400 hover:text-red-400 transition-colors ml-1 flex-shrink-0"
            title="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
        />
        <button
          onClick={handleFileClick}
          disabled={isUploading || isSending}
          className="
            flex-shrink-0 p-2 rounded-sf-md text-slate-400
            hover:bg-slate-700 hover:text-slate-200
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-sf-fast
          "
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="
            flex-1 resize-none bg-slate-800 border border-slate-700 rounded-sf-md
            px-3 py-2 text-sf-sm text-slate-50 placeholder:text-slate-500
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30
            transition-colors duration-sf-fast
          "
          style={{ minHeight: '36px', maxHeight: '96px' }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="
            flex-shrink-0 p-2 rounded-sf-md
            bg-primary-500 text-white
            hover:bg-primary-600 active:bg-primary-700
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-sf-fast
          "
          title="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
