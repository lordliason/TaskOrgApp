import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// VAPID public key for Web Push (generate your own for production)
// You can generate keys at: https://web-push-codelab.glitch.me/
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const useNotificationStore = create((set, get) => ({
  preferences: null,
  pendingNotifications: [],
  isLoading: false,
  error: null,
  permissionStatus: 'default', // 'default', 'granted', 'denied'
  isSupported: false,

  // Initialize notification support check
  initializeNotifications: () => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    const permissionStatus = isSupported ? Notification.permission : 'denied';

    set({ isSupported, permissionStatus });

    return { isSupported, permissionStatus };
  },

  // Request notification permission
  requestPermission: async () => {
    if (!get().isSupported) {
      return { success: false, error: 'Push notifications are not supported in this browser' };
    }

    try {
      const permission = await Notification.requestPermission();
      set({ permissionStatus: permission });

      if (permission === 'granted') {
        // Subscribe to push notifications
        await get().subscribeToPush();
        return { success: true, permission };
      }

      return { success: false, permission };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to push notifications
  subscribeToPush: async () => {
    if (!get().isSupported || !VAPID_PUBLIC_KEY) {
      console.warn('Push subscription skipped: not supported or missing VAPID key');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  },

  // Fetch user's notification preferences
  fetchPreferences: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        throw error;
      }

      set({ preferences: data || null });
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Create or update notification preferences
  savePreferences: async (userId, organizationId, preferences) => {
    try {
      set({ isLoading: true, error: null });

      // Get push subscription if available
      let pushSubscription = null;
      if (get().permissionStatus === 'granted') {
        const subscription = await get().subscribeToPush();
        if (subscription) {
          pushSubscription = subscription.toJSON();
        }
      }

      const preferencesData = {
        user_id: userId,
        organization_id: organizationId,
        due_date_reminder: preferences.dueDateReminder,
        daily_summary: preferences.dailySummary,
        daily_summary_time: preferences.dailySummaryTime,
        urgency_alerts: preferences.urgencyAlerts,
        team_alerts: preferences.teamAlerts,
        push_subscription: pushSubscription,
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(preferencesData, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;

      set({ preferences: data });
      return { success: true, data };
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch pending notifications for the user
  fetchPendingNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('sent', false)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: false })
        .limit(10);

      if (error) throw error;

      set({ pendingNotifications: data || [] });
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark a notification as sent/read
  markNotificationSent: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      set((state) => ({
        pendingNotifications: state.pendingNotifications.filter((n) => n.id !== notificationId),
      }));

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as sent:', error);
      return { success: false, error: error.message };
    }
  },

  // Send a task reminder to the assignee
  sendTaskReminder: async (task, senderName) => {
    try {
      if (!task?.assignee_id || !task?.organization_id) {
        return { success: false, error: 'Task must have an assignee' };
      }

      const { error } = await supabase.from('scheduled_notifications').insert({
        user_id: task.assignee_id,
        organization_id: task.organization_id,
        task_id: task.id,
        type: 'task_reminder',
        title: 'Task Reminder',
        body: `${senderName} is reminding you about: "${task.title}"`,
        scheduled_for: new Date().toISOString(),
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error sending task reminder:', error);
      return { success: false, error: error.message };
    }
  },

  // Show a local notification (for when the app is open)
  showLocalNotification: async (title, body, options = {}) => {
    if (!get().isSupported || get().permissionStatus !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: options.tag || 'task-matrix-notification',
        renotify: options.renotify || false,
        data: options.data || {},
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  },

  // Process and show pending notifications
  processPendingNotifications: async (userId) => {
    const result = await get().fetchPendingNotifications(userId);
    if (!result.success) return;

    const { pendingNotifications } = get();

    for (const notification of pendingNotifications) {
      // Show the notification
      await get().showLocalNotification(notification.title, notification.body, {
        tag: `notification-${notification.id}`,
        data: {
          notificationId: notification.id,
          taskId: notification.task_id,
          type: notification.type,
        },
      });

      // Mark as sent
      await get().markNotificationSent(notification.id);
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
