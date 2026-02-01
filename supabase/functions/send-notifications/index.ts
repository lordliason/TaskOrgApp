// Supabase Edge Function: send-notifications
// Processes scheduled notifications and sends them via Web Push API
//
// Deploy with: supabase functions deploy send-notifications
// Schedule with: Supabase Dashboard > Database > Cron Jobs
// Recommended cron: */5 * * * * (every 5 minutes)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Web Push library for Deno
import webpush from 'https://esm.sh/web-push@3.6.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledNotification {
  id: string;
  user_id: string;
  organization_id: string;
  task_id: string | null;
  type: string;
  title: string;
  body: string;
  scheduled_for: string;
  sent: boolean;
}

interface NotificationPreferences {
  user_id: string;
  push_subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  } | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@taskmatrix.app';

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Configure web-push
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    // Fetch pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', new Date().toISOString())
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${notifications.length} notifications`);

    let successCount = 0;
    let failCount = 0;

    // Process each notification
    for (const notification of notifications as ScheduledNotification[]) {
      try {
        // Get user's push subscription
        const { data: prefs, error: prefsError } = await supabase
          .from('notification_preferences')
          .select('push_subscription')
          .eq('user_id', notification.user_id)
          .single();

        if (prefsError || !prefs?.push_subscription) {
          console.log(`No push subscription for user ${notification.user_id}`);
          // Mark as sent anyway to avoid retrying forever
          await markNotificationSent(supabase, notification.id);
          continue;
        }

        const subscription = prefs.push_subscription;

        // Prepare push payload
        const payload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          tag: `notification-${notification.id}`,
          data: {
            notificationId: notification.id,
            taskId: notification.task_id,
            type: notification.type,
          },
        });

        // Send push notification
        await webpush.sendNotification(subscription, payload);
        console.log(`Sent notification ${notification.id} to user ${notification.user_id}`);

        // Mark as sent
        await markNotificationSent(supabase, notification.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);

        // Check if subscription is expired/invalid
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription is gone, remove it
          await supabase
            .from('notification_preferences')
            .update({ push_subscription: null })
            .eq('user_id', notification.user_id);

          // Mark notification as sent to avoid retrying
          await markNotificationSent(supabase, notification.id);
        }

        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        total: notifications.length,
        success: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function markNotificationSent(supabase: any, notificationId: string) {
  const { error } = await supabase
    .from('scheduled_notifications')
    .update({ sent: true, sent_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error(`Failed to mark notification ${notificationId} as sent:`, error);
  }
}
