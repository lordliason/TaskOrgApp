import { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import {
  Bell,
  BellOff,
  BellRing,
  Calendar,
  Clock,
  AlertTriangle,
  Users,
  Check,
  X,
  Loader2,
} from 'lucide-react';

function NotificationSettings() {
  const {
    preferences,
    isSupported,
    isEnabled,
    canRequestPermission,
    isDenied,
    requestPermission,
    savePreferences,
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // Sync local state with fetched preferences
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = (key) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTimeChange = (e) => {
    setLocalPreferences((prev) => ({
      ...prev,
      dailySummaryTime: e.target.value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    const result = await savePreferences(localPreferences);

    setIsSaving(false);
    setSaveStatus(result.success ? 'success' : 'error');

    // Clear status after 3 seconds
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result.success) {
      // Auto-save preferences after enabling
      await handleSave();
    }
  };

  const hasChanges =
    JSON.stringify(localPreferences) !== JSON.stringify(preferences);

  if (!isSupported) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="h-5 w-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Notifications</h3>
        </div>
        <p className="text-text-muted text-sm">
          Push notifications are not supported in this browser. Try using a modern
          browser like Chrome, Firefox, or Edge for the full experience.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-5 w-5 text-text-muted" />
        <h3 className="font-semibold text-text-primary">Notifications</h3>
      </div>

      {/* Permission Status Banner */}
      {canRequestPermission && (
        <div className="mb-6 p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-xl">
          <div className="flex items-start gap-3">
            <BellRing className="h-5 w-5 text-accent-blue flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-text-primary mb-1">
                Enable Push Notifications
              </h4>
              <p className="text-sm text-text-muted mb-3">
                Get reminders for upcoming tasks, urgent assignments, and team updates
                even when you&apos;re not using the app.
              </p>
              <button
                onClick={handleRequestPermission}
                className="btn btn-primary text-sm"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {isDenied && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-text-primary mb-1">
                Notifications Blocked
              </h4>
              <p className="text-sm text-text-muted">
                You&apos;ve blocked notifications for this site. To enable them, click
                the lock icon in your browser&apos;s address bar and allow notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {isEnabled && (
        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">
            Notifications are enabled
          </span>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="space-y-4">
        {/* Due Date Reminders */}
        <NotificationToggle
          icon={Calendar}
          title="Due Date Reminders"
          description="Get notified 24 hours before a task is due"
          enabled={localPreferences.dueDateReminder}
          onToggle={() => handleToggle('dueDateReminder')}
          disabled={!isEnabled}
        />

        {/* Daily Summary */}
        <div className="p-4 bg-dark-hover rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-dark-card rounded-lg">
              <Clock className="h-5 w-5 text-accent-blue" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-text-primary">Daily Summary</h4>
                <ToggleSwitch
                  enabled={localPreferences.dailySummary}
                  onToggle={() => handleToggle('dailySummary')}
                  disabled={!isEnabled}
                />
              </div>
              <p className="text-sm text-text-muted mb-3">
                Receive a morning notification with your tasks for the day
              </p>
              {localPreferences.dailySummary && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-muted">Send at:</label>
                  <input
                    type="time"
                    value={localPreferences.dailySummaryTime}
                    onChange={handleTimeChange}
                    disabled={!isEnabled}
                    className="input py-1 px-2 w-auto text-sm disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Urgency Alerts */}
        <NotificationToggle
          icon={AlertTriangle}
          title="Urgency Alerts"
          description="Get instant notifications for high-urgency task assignments"
          enabled={localPreferences.urgencyAlerts}
          onToggle={() => handleToggle('urgencyAlerts')}
          disabled={!isEnabled}
        />

        {/* Team Alerts */}
        <NotificationToggle
          icon={Users}
          title="Team Alerts"
          description="Get notified when your team member completes a task"
          enabled={localPreferences.teamAlerts}
          onToggle={() => handleToggle('teamAlerts')}
          disabled={!isEnabled}
        />
      </div>

      {/* Save Button */}
      {isEnabled && (
        <div className="mt-6 pt-4 border-t border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">Preferences saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <X className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">Failed to save</span>
              </>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Toggle component for notification settings
function NotificationToggle({ icon: Icon, title, description, enabled, onToggle, disabled }) {
  return (
    <div className="p-4 bg-dark-hover rounded-xl">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-dark-card rounded-lg">
          <Icon className="h-5 w-5 text-accent-blue" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-text-primary">{title}</h4>
            <ToggleSwitch enabled={enabled} onToggle={onToggle} disabled={disabled} />
          </div>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Reusable toggle switch component
function ToggleSwitch({ enabled, onToggle, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-dark-card
        disabled:opacity-50 disabled:cursor-not-allowed
        ${enabled ? 'bg-accent-blue' : 'bg-dark-border'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

export default NotificationSettings;
