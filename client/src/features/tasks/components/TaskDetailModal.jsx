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
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * TaskDetailModal — detailed view of a task with inline editing.
 * Shows full task info, reference to source sticky note (if converted),
 * and allows editing title, description, status, priority, assignee, and due date.
 */
export default function TaskDetailModal({ task, isOpen, onClose, boardId }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const members = useWorkspaceStore((s) => s.members);

  // Local editing state — synced from task prop
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('todo');
  const [editPriority, setEditPriority] = useState('low');
  const [editAssignee, setEditAssignee] = useState(null);
  const [editDueDate, setEditDueDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (!task) return null;

  const currentStatus = TASK_STATUSES.find((s) => s.id === editStatus);
  const currentPriority = TASK_PRIORITIES.find((p) => p.id === editPriority);
  const assignee = members.find((m) => (m.user_id || m.id) === editAssignee);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="md">
      <div className="space-y-4">
        {/* Title (inline editable) */}
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-transparent text-sf-lg font-semibold text-slate-50 border-none outline-none placeholder:text-slate-500 focus:bg-slate-800/40 rounded-sf-sm px-1 -mx-1 transition-colors"
          placeholder="Task title"
          id="task-detail-title"
        />

        {/* Description (inline editable) */}
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="w-full bg-transparent text-sf-sm text-slate-300 border-none outline-none placeholder:text-slate-500 resize-y min-h-[60px] focus:bg-slate-800/40 rounded-sf-sm px-1 -mx-1 transition-colors"
          placeholder="Add a description…"
          rows={3}
          id="task-detail-description"
        />

        {/* Properties grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Status */}
          <div>
            <label className="sf-label flex items-center gap-1.5">
              <CheckCircle2 size={12} style={{ color: currentStatus?.color }} />
              Status
            </label>
            <select
              className="sf-input text-sf-sm"
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
            <label className="sf-label flex items-center gap-1.5">
              <Flag size={12} style={{ color: currentPriority?.color }} />
              Priority
            </label>
            <select
              className="sf-input text-sf-sm"
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
            <label className="sf-label flex items-center gap-1.5">
              <User size={12} />
              Assignee
            </label>
            <select
              className="sf-input text-sf-sm"
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
            <label className="sf-label flex items-center gap-1.5">
              <Calendar size={12} />
              Due date
            </label>
            <input
              type="date"
              className="sf-input text-sf-sm"
              value={editDueDate || ''}
              onChange={(e) => setEditDueDate(e.target.value || null)}
              id="task-detail-due-date"
            />
          </div>
        </div>

        {/* Source sticky reference */}
        {task.source_element_id && (
          <div className="flex items-start gap-2 p-2.5 rounded-sf-sm bg-warning/5 border border-warning/20">
            <StickyNote size={14} className="text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sf-xs text-warning font-medium">Converted from sticky note</p>
              {task.original_sticky_text && (
                <p className="text-sf-xs text-slate-400 mt-0.5 italic line-clamp-2">
                  "{task.original_sticky_text}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="text-sf-xs text-slate-500 border-t border-slate-700/50 pt-3">
          Created {format(new Date(task.created_at), 'MMM d, yyyy')}
          {task.updated_at !== task.created_at && (
            <> · Updated {format(new Date(task.updated_at), 'MMM d, yyyy')}</>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleDelete}
            className="sf-btn-danger text-sf-sm"
            disabled={isDeleting}
            id="task-detail-delete"
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="sf-btn-secondary text-sf-sm"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="sf-btn-primary text-sf-sm"
              disabled={!hasChanges || isSaving}
              id="task-detail-save"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
