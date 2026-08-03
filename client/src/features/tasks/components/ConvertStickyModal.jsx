import { useState, useEffect } from 'react';
import Modal from '@/features/shared/Modal';
import { useTaskStore, TASK_PRIORITIES } from '@/stores/taskStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { StickyNote, Loader2 } from 'lucide-react';

/**
 * ConvertStickyModal — converts a sticky note element into a task.
 * Pre-fills the title from the sticky note's text content.
 *
 * Triggered from Canvas → ElementContextMenu → "Convert to Task".
 */
export default function ConvertStickyModal({ isOpen, onClose, boardId, elementId }) {
  const convertFromSticky = useTaskStore((s) => s.convertFromSticky);
  const elements = useCanvasStore((s) => s.elements);
  const members = useWorkspaceStore((s) => s.members);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'low',
    assignee_id: null,
    due_date: null,
  });

  // Pre-fill from sticky text when modal opens
  useEffect(() => {
    if (isOpen && elementId) {
      const el = elements.find((e) => e.id === elementId);
      const stickyText = el?.text || '';
      setFormData({
        title: stickyText.slice(0, 200), // Cap at 200 chars for title
        description: stickyText.length > 200 ? stickyText : '',
        status: 'todo',
        priority: 'low',
        assignee_id: null,
        due_date: null,
      });
    }
  }, [isOpen, elementId, elements]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    const result = await convertFromSticky(boardId, elementId, {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      assignee_id: formData.assignee_id || null,
      due_date: formData.due_date || null,
    });
    setIsSubmitting(false);

    if (result) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  // Find the sticky element for display
  const stickyElement = elementId ? elements.find((e) => e.id === elementId) : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Convert to Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sticky note preview */}
        {stickyElement && (
          <div className="flex items-start gap-2 p-3 rounded-sf-md bg-warning/5 border border-warning/20">
            <StickyNote size={16} className="text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sf-xs text-warning font-medium mb-0.5">Converting sticky note</p>
              <p className="text-sf-xs text-slate-400 italic line-clamp-3">
                {stickyElement.text || '(empty sticky)'}
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="sf-label" htmlFor="convert-task-title">Title *</label>
          <input
            id="convert-task-title"
            type="text"
            className="sf-input"
            placeholder="Task title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="sf-label" htmlFor="convert-task-description">Description</label>
          <textarea
            id="convert-task-description"
            className="sf-input min-h-[60px] resize-y"
            placeholder="Add more details…"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={2}
          />
        </div>

        {/* Priority + Due date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="sf-label" htmlFor="convert-task-priority">Priority</label>
            <select
              id="convert-task-priority"
              className="sf-input"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="sf-label" htmlFor="convert-task-due-date">Due date</label>
            <input
              id="convert-task-due-date"
              type="date"
              className="sf-input"
              value={formData.due_date || ''}
              onChange={(e) => handleChange('due_date', e.target.value || null)}
            />
          </div>
        </div>

        {/* Assignee */}
        {members.length > 0 && (
          <div>
            <label className="sf-label" htmlFor="convert-task-assignee">Assignee</label>
            <select
              id="convert-task-assignee"
              className="sf-input"
              value={formData.assignee_id || ''}
              onChange={(e) => handleChange('assignee_id', e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id || m.id} value={m.user_id || m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="sf-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="sf-btn-primary"
            disabled={isSubmitting || !formData.title.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Converting…
              </>
            ) : (
              'Convert to Task'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
