import { useState } from 'react';
import Modal from '@/features/shared/Modal';
import { useTaskStore, TASK_PRIORITIES } from '@/stores/taskStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Loader2 } from 'lucide-react';

/**
 * CreateTaskModal — form for creating a new task on the board.
 * Uses the shared Modal component and follows the existing form patterns.
 */
export default function CreateTaskModal({ isOpen, onClose, boardId }) {
  const createTask = useTaskStore((s) => s.createTask);
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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    const result = await createTask(boardId, {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      assignee_id: formData.assignee_id || null,
      due_date: formData.due_date || null,
    });
    setIsSubmitting(false);

    if (result) {
      // Reset form and close
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'low',
        assignee_id: null,
        due_date: null,
      });
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="sf-label" htmlFor="task-title">Title *</label>
          <input
            id="task-title"
            type="text"
            className="sf-input"
            placeholder="What needs to be done?"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="sf-label" htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            className="sf-input min-h-[80px] resize-y"
            placeholder="Add more details…"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Priority + Due date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="sf-label" htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
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
            <label className="sf-label" htmlFor="task-due-date">Due date</label>
            <input
              id="task-due-date"
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
            <label className="sf-label" htmlFor="task-assignee">Assignee</label>
            <select
              id="task-assignee"
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
                Creating…
              </>
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
