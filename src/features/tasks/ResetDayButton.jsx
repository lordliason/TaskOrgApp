import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { RefreshCw, Trash2, X } from 'lucide-react';

function ResetDayButton() {
  const { organization } = useAuthStore();
  const { deleteAllTasks, deleteCompletedTasks } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    if (!organization?.id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete ALL tasks? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAllTasks(organization.id);
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting all tasks:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCompleted = async () => {
    if (!organization?.id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete all completed tasks? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteCompletedTasks(organization.id);
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting completed tasks:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-dark-hover transition-all text-text-primary"
        title="Reset Day"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="text-sm font-medium">Reset Day</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Reset Day</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary"
                disabled={isDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-text-secondary text-sm mb-6">
              Choose how you want to reset your tasks for the day.
            </p>

            {/* Options */}
            <div className="space-y-3">
              <button
                onClick={handleDeleteCompleted}
                disabled={isDeleting}
                className="w-full flex items-center gap-3 p-4 bg-dark-hover/50 border border-dark-border rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30">
                  <Trash2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-text-primary text-sm">
                    Delete Completed Tasks
                  </div>
                  <div className="text-xs text-text-muted">
                    Remove only tasks marked as done
                  </div>
                </div>
              </button>

              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="w-full flex items-center gap-3 p-4 bg-dark-hover/50 border border-dark-border rounded-lg hover:border-red-500/50 hover:bg-red-500/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-text-primary text-sm">
                    Delete All Tasks
                  </div>
                  <div className="text-xs text-text-muted">
                    Remove all tasks (completed and incomplete)
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel button */}
            <button
              onClick={() => setShowModal(false)}
              disabled={isDeleting}
              className="w-full mt-4 px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ResetDayButton;
