import { useState, useEffect, useCallback } from 'react';
import Modal from '@/features/shared/Modal';
import { useTaskStore, TASK_STATUSES, TASK_PRIORITIES } from '@/stores/taskStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import Avatar from '@/features/shared/Avatar';
import {
  Flag,
  Calendar,
  User,
  Trash2,
  StickyNote,
  Loader2,
  CheckCircle2,
  Send,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * TaskDetailModal — detailed view of a task with inline editing.
 * Upgraded UX: two-column layout, distinct edit fields, and better comments section.
 */
export default function TaskDetailModal({ task, isOpen, onClose, boardId }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const addComment = useTaskStore((s) => s.addComment);
  const comments = useTaskStore((s) => s.selectedTaskComments);
  const members = useWorkspaceStore((s) => s.members);

  // Local editing state — synced from task prop
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('todo');
  const [editPriority, setEditPriority] = useState('low');
  const [editAssignee, setEditAssignee] = useState(null);
  const [editDueDate, setEditDueDate] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Sync local state when the task prop changes
  useEffect(() => {
    if (task) {
      setEditTitle(task.title || '');
      setEditDescription(task.description || '');
      setEditStatus(task.status || 'todo');
      setEditPriority(task.priority || 'low');
      setEditAssignee(task.assignee_id || null);
      setEditDueDate(task.due_date ? task.due_date.split('T')[0] : null);
    }
  }, [task]);

  const hasChanges = task && (
    editTitle !== (task.title || '') ||
    editDescription !== (task.description || '') ||
    editStatus !== (task.status || 'todo') ||
    editPriority !== (task.priority || 'low') ||
    editAssignee !== (task.assignee_id || null) ||
    (editDueDate || null) !== (task.due_date ? task.due_date.split('T')[0] : null)
  );

  const handleSave = useCallback(async () => {
    if (!task || !hasChanges) return;

    setIsSaving(true);
    await updateTask(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      status: editStatus,
      priority: editPriority,
      assignee_id: editAssignee || null,
      due_date: editDueDate || null,
    }, task.version);
    setIsSaving(false);
  }, [task, hasChanges, editTitle, editDescription, editStatus, editPriority, editAssignee, editDueDate, updateTask]);

  const handleDelete = useCallback(async () => {
    if (!task) return;
    setIsDeleting(true);
    await deleteTask(task.id);
    setIsDeleting(false);
    onClose();
  }, [task, deleteTask, onClose]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;
    setIsSubmittingComment(true);
    const added = await addComment(task.id, newComment.trim());
    if (added) {
      setNewComment('');
    }
    setIsSubmittingComment(false);
  };

  if (!task) return null;

  const currentStatus = TASK_STATUSES.find((s) => s.id === editStatus);
  const currentPriority = TASK_PRIORITIES.find((p) => p.id === editPriority);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Main Content (Left) */}
        <div className="flex-1 space-y-5 flex flex-col">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-slate-800/30 text-sf-lg font-semibold text-slate-50 border border-transparent hover:border-slate-700 focus:border-primary-500 focus:bg-slate-800/50 outline-none placeholder:text-slate-500 rounded-sf-sm px-3 py-2 transition-all shadow-inner"
              placeholder="Task title"
              id="task-detail-title"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-slate-800/30 text-sf-sm text-slate-300 border border-transparent hover:border-slate-700 focus:border-primary-500 focus:bg-slate-800/50 outline-none placeholder:text-slate-500 resize-y min-h-[100px] rounded-sf-sm px-3 py-2 transition-all shadow-inner"
              placeholder="Add a more detailed description…"
              rows={4}
              id="task-detail-description"
            />
          </div>

          {/* Source sticky reference */}
          {task.source_element_id && (
            <div className="flex items-start gap-3 p-3.5 rounded-sf-md bg-warning/5 border border-warning/20">
              <StickyNote size={18} className="text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sf-sm text-warning font-semibold">Converted from sticky note</p>
                {task.original_sticky_text && (
                  <p className="text-sf-sm text-slate-400 mt-1.5 italic border-l-2 border-warning/30 pl-3 py-0.5">
                    "{task.original_sticky_text}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-4 flex flex-col min-h-[250px] max-h-[350px] flex-1">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle size={16} className="text-slate-400" />
              <h4 className="text-sf-sm font-semibold text-slate-300">Activity & Comments</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 px-1 py-1 pr-2 mb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 group">
                  <Avatar user={{ id: c.user_id, name: c.user_name, avatar_url: c.user_avatar }} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sf-sm font-semibold text-slate-200">{c.user_name}</span>
                      <span className="text-sf-xs text-slate-500">{format(new Date(c.created_at), 'MMM d, p')}</span>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-sf-md rounded-tl-none p-3 shadow-sm group-hover:border-slate-600 transition-colors">
                      <p className="text-sf-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500 bg-slate-800/20 border border-dashed border-slate-700/50 rounded-sf-md">
                  <MessageCircle size={24} className="mb-2 opacity-50" />
                  <p className="text-sf-sm">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 items-end mt-auto">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="sf-input text-sf-sm flex-1 min-h-[42px] max-h-[120px] resize-y py-2.5 px-3 bg-slate-800/50 border-slate-700 focus:bg-slate-800"
                disabled={isSubmittingComment}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="sf-btn-primary h-[42px] px-4 flex-shrink-0"
              >
                {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Content (Right) */}
        <div className="w-full md:w-56 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-slate-800/30 rounded-sf-md border border-slate-700/50 p-4 space-y-4 shadow-sm">
            
            {/* Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 size={12} style={{ color: currentStatus?.color }} />
                Status
              </label>
              <select
                className="sf-input text-sf-sm w-full bg-slate-800 border-slate-700 hover:border-slate-500 focus:border-primary-500 transition-colors shadow-sm"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                id="task-detail-status"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Flag size={12} style={{ color: currentPriority?.color }} />
                Priority
              </label>
              <select
                className="sf-input text-sf-sm w-full bg-slate-800 border-slate-700 hover:border-slate-500 focus:border-primary-500 transition-colors shadow-sm"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                id="task-detail-priority"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <User size={12} className="text-slate-400" />
                Assignee
              </label>
              <select
                className="sf-input text-sf-sm w-full bg-slate-800 border-slate-700 hover:border-slate-500 focus:border-primary-500 transition-colors shadow-sm"
                value={editAssignee || ''}
                onChange={(e) => setEditAssignee(e.target.value || null)}
                id="task-detail-assignee"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id || m.id} value={m.user_id || m.id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} className="text-slate-400" />
                Due Date
              </label>
              <input
                type="date"
                className="sf-input text-sf-sm w-full bg-slate-800 border-slate-700 hover:border-slate-500 focus:border-primary-500 transition-colors shadow-sm"
                value={editDueDate || ''}
                onChange={(e) => setEditDueDate(e.target.value || null)}
                id="task-detail-due-date"
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="text-[11px] text-slate-500 space-y-1.5 px-1">
            <p className="flex justify-between"><span>Created</span> <span className="text-slate-400 font-medium">{format(new Date(task.created_at), 'MMM d, yyyy')}</span></p>
            {task.updated_at !== task.created_at && (
              <p className="flex justify-between"><span>Updated</span> <span className="text-slate-400 font-medium">{format(new Date(task.updated_at), 'MMM d, yyyy')}</span></p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={handleSave}
              className="sf-btn-primary text-sf-sm w-full justify-center shadow-lg shadow-primary-500/20 py-2.5 font-semibold"
              disabled={!hasChanges || isSaving}
              id="task-detail-save"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              onClick={handleDelete}
              className="sf-btn-danger text-sf-sm w-full justify-center py-2.5 font-medium bg-error/10 text-error hover:bg-error hover:text-white border border-error/20 hover:border-error"
              disabled={isDeleting}
              id="task-detail-delete"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
