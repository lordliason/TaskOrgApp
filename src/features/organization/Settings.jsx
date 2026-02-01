import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';
import ColorPicker from '../../components/ColorPicker';
import Modal from '../../components/Modal';
import {
  Settings as SettingsIcon,
  Users,
  UserPlus,
  Pencil,
  Building2,
  AlertCircle,
  Check,
} from 'lucide-react';

function Settings() {
  const { profile, organization } = useAuthStore();
  const { members, fetchMembers, addMember, updateMember, isLoading } = useOrganizationStore();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (organization?.id) {
      fetchMembers(organization.id);
    }
  }, [organization?.id]);

  const isAdmin = profile?.role === 'admin';
  const canAddMember = isAdmin && members.length < 2;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-text-muted" />
        <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
      </div>

      {/* Organization Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Organization</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-muted">Name</label>
            <p className="font-medium text-text-primary">{organization?.name}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted">Members</label>
            <p className="font-medium text-text-primary">{members.length} / 2</p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-text-muted" />
            <h3 className="font-semibold text-text-primary">Team Members</h3>
          </div>

          {canAddMember && (
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
          )}
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 bg-dark-hover rounded-xl"
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: member.color }}
              >
                {member.display_name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">
                    {member.display_name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      member.role === 'admin'
                        ? 'bg-accent-blue/20 text-accent-blue'
                        : 'bg-dark-border text-text-muted'
                    }`}
                  >
                    {member.role}
                  </span>
                  {member.id === profile.id && (
                    <span className="text-xs text-text-muted">(You)</span>
                  )}
                </div>
                <div className="text-sm text-text-muted">{member.email}</div>
                {member.phone && (
                  <div className="text-sm text-text-muted">{member.phone}</div>
                )}
              </div>

              {/* Edit button (admin only, or own profile) */}
              {(isAdmin || member.id === profile.id) && (
                <button
                  onClick={() => setEditingMember(member)}
                  className="p-2 text-text-muted hover:text-accent-blue rounded-lg hover:bg-dark-card transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {members.length === 1 && (
          <p className="text-sm text-text-muted mt-4 text-center">
            You can add one more member to your organization.
          </p>
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        organizationId={organization?.id}
        onSuccess={() => {
          setSuccess('Member added successfully!');
          setTimeout(() => setSuccess(''), 3000);
        }}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onSuccess={() => {
          setSuccess('Member updated successfully!');
          setTimeout(() => setSuccess(''), 3000);
        }}
      />
    </div>
  );
}

// Add Member Modal Component
function AddMemberModal({ isOpen, onClose, organizationId, onSuccess }) {
  const { addMember } = useOrganizationStore();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    color: '#10B981',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addMember({
        ...formData,
        organizationId,
      });

      if (result.success) {
        onSuccess();
        onClose();
        setFormData({
          displayName: '',
          email: '',
          phone: '',
          password: '',
          color: '#10B981',
        });
      } else {
        setError(result.error || 'Failed to add member');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="displayName" className="label">
            Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={formData.displayName}
            onChange={handleChange}
            className="input"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="input"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Temporary Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="input"
            placeholder="At least 6 characters"
          />
          <p className="text-xs text-text-muted mt-1">
            Share this password with the new member so they can log in.
          </p>
        </div>

        <ColorPicker
          label="Member Color"
          value={formData.color}
          onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
        />

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-dark-border">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary order-2 sm:order-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary order-1 sm:order-2 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </>
            ) : (
              'Add Member'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Member Modal Component
function EditMemberModal({ isOpen, onClose, member, onSuccess }) {
  const { updateMember } = useOrganizationStore();
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    color: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({
        displayName: member.display_name || '',
        phone: member.phone || '',
        color: member.color || '#3B82F6',
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await updateMember(member.id, formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to update member');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="edit-displayName" className="label">
            Name
          </label>
          <input
            id="edit-displayName"
            name="displayName"
            type="text"
            required
            value={formData.displayName}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="edit-phone" className="label">
            Phone
          </label>
          <input
            id="edit-phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="input"
          />
        </div>

        <ColorPicker
          label="Color"
          value={formData.color}
          onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
        />

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-dark-border">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary order-2 sm:order-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary order-1 sm:order-2 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default Settings;
