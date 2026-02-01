// Supabase Edge Function: daily-summary
// Generates daily summary notifications for users who have opted in
//
// Deploy with: supabase functions deploy daily-summary
// Schedule with: Supabase Dashboard > Database > Cron Jobs
// Recommended cron: 0 * * * * (every hour, to catch users in different timezones)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPreferences {
  user_id: string;
  organization_id: string;
  daily_summary: boolean;
  daily_summary_time: string;
}

interface Task {
  id: string;
  title: string;
  urgent: number;
  important: number;
  due_date: string | null;
  status: string;
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

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current hour (UTC)
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, '0');
    const today = now.toISOString().split('T')[0];

    // Find users who should receive daily summary at this hour
    // We check for users whose daily_summary_time hour matches current hour
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, organization_id, daily_summary_time')
      .eq('daily_summary', true)
      .not('push_subscription', 'is', null);

    if (prefsError) {
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with daily summary enabled', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter users whose summary time matches current hour
    // Note: This is a simplified approach - production should handle timezones
    const usersToNotify = preferences.filter((pref) => {
      const prefHour = pref.daily_summary_time?.split(':')[0] || '08';
      return prefHour === currentHour;
    });

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to notify at this hour', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing daily summary for ${usersToNotify.length} users`);

    let successCount = 0;

    for (const pref of usersToNotify) {
      try {
        // Check if we already sent a summary today for this user
        const { data: existingSummary } = await supabase
          .from('scheduled_notifications')
          .select('id')
          .eq('user_id', pref.user_id)
          .eq('type', 'daily_summary')
          .gte('scheduled_for', `${today}T00:00:00Z`)
          .lte('scheduled_for', `${today}T23:59:59Z`)
          .limit(1);

        if (existingSummary && existingSummary.length > 0) {
          console.log(`Daily summary already exists for user ${pref.user_id}`);
          continue;
        }

        // Get user's tasks for today
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, urgent, important, due_date, status')
          .eq('organization_id', pref.organization_id)
          .eq('assignee_id', pref.user_id)
          .neq('status', 'done');

        if (tasksError) {
          console.error(`Failed to fetch tasks for user ${pref.user_id}:`, tasksError);
          continue;
        }

        // Filter to today's tasks (urgent >= 3 or due today)
        const todaysTasks = (tasks || []).filter((task: Task) => {
          if (task.urgent >= 3) return true;
          if (task.due_date) {
            return task.due_date.split('T')[0] === today;
          }
          return false;
        });

        // Build summary message
        const urgentCount = todaysTasks.filter((t: Task) => t.urgent >= 4 && t.important >= 4).length;
        const totalCount = todaysTasks.length;

        let body: string;
        if (totalCount === 0) {
          body = 'No urgent tasks today. Time to work on important goals!';
        } else if (urgentCount > 0) {
          body = `You have ${urgentCount} urgent task${urgentCount > 1 ? 's' : ''} and ${totalCount - urgentCount} other task${totalCount - urgentCount !== 1 ? 's' : ''} for today.`;
        } else {
          body = `You have ${totalCount} task${totalCount > 1 ? 's' : ''} scheduled for today.`;
        }

        // Create the notification
        const { error: insertError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: pref.user_id,
            organization_id: pref.organization_id,
            type: 'daily_summary',
            title: 'Daily Task Summary',
            body,
            scheduled_for: now.toISOString(),
          });

        if (insertError) {
          console.error(`Failed to create notification for user ${pref.user_id}:`, insertError);
          continue;
        }

        successCount++;
        console.log(`Created daily summary for user ${pref.user_id}`);
      } catch (error) {
        console.error(`Error processing user ${pref.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Daily summaries processed',
        eligible: usersToNotify.length,
        created: successCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing daily summaries:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
