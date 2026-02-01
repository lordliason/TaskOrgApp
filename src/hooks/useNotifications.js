import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

/**
 * Custom hook for managing push notifications
 * Handles initialization, permission requests, and notification processing
 */
export function useNotifications() {
  const { profile, organization } = useAuthStore();
  const {
    preferences,
    permissionStatus,
    isSupported,
    isLoading,
    error,
    initializeNotifications,
    requestPermission,
    fetchPreferences,
    savePreferences,
    processPendingNotifications,
    showLocalNotification,
  } = useNotificationStore();

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch preferences when user is authenticated
  useEffect(() => {
    if (profile?.id) {
      fetchPreferences(profile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Process pending notifications periodically when app is active
  useEffect(() => {
    if (!profile?.id || permissionStatus !== 'granted') return;

    // Process immediately
    processPendingNotifications(profile.id);

    // Then check every 5 minutes
    const interval = setInterval(() => {
      processPendingNotifications(profile.id);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, permissionStatus]);

  // Request permission handler
  const handleRequestPermission = useCallback(async () => {
    return await requestPermission();
  }, [requestPermission]);

  // Save preferences handler
  const handleSavePreferences = useCallback(
    async (newPreferences) => {
      if (!profile?.id || !organization?.id) {
        return { success: false, error: 'User not authenticated' };
      }
      return await savePreferences(profile.id, organization.id, newPreferences);
    },
    [profile?.id, organization?.id, savePreferences]
  );

  // Show notification handler
  const handleShowNotification = useCallback(
    async (title, body, options) => {
      return await showLocalNotification(title, body, options);
    },
    [showLocalNotification]
  );

  // Get formatted preferences for the UI
  const formattedPreferences = preferences
    ? {
        dueDateReminder: preferences.due_date_reminder ?? true,
        dailySummary: preferences.daily_summary ?? true,
        dailySummaryTime: preferences.daily_summary_time ?? '08:00',
        urgencyAlerts: preferences.urgency_alerts ?? true,
        teamAlerts: preferences.team_alerts ?? true,
      }
    : {
        dueDateReminder: true,
        dailySummary: true,
        dailySummaryTime: '08:00',
        urgencyAlerts: true,
        teamAlerts: true,
      };

  return {
    // State
    preferences: formattedPreferences,
    permissionStatus,
    isSupported,
    isLoading,
    error,

    // Computed
    isEnabled: permissionStatus === 'granted',
    canRequestPermission: isSupported && permissionStatus === 'default',
    isDenied: permissionStatus === 'denied',

    // Actions
    requestPermission: handleRequestPermission,
    savePreferences: handleSavePreferences,
    showNotification: handleShowNotification,
  };
}
