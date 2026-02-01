-- Push Notifications Schema Extension
-- Run this in your Supabase SQL Editor after the main schema

-- ===========================================
-- NOTIFICATION PREFERENCES TABLE
-- ===========================================

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Notification toggles
  due_date_reminder BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT true,
  daily_summary_time TIME DEFAULT '08:00',
  urgency_alerts BOOLEAN DEFAULT true,
  team_alerts BOOLEAN DEFAULT true,

  -- Push subscription data (Web Push API)
  push_subscription JSONB DEFAULT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ===========================================
-- SCHEDULED NOTIFICATIONS TABLE
-- ===========================================

-- Queue for scheduled notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('due_date', 'daily_summary', 'urgency', 'team_assignment', 'task_completed')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_org ON notification_preferences(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON scheduled_notifications(sent, scheduled_for);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification preferences"
  ON notification_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Scheduled notifications policies
CREATE POLICY "Users can view their own scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create scheduled notifications"
  ON scheduled_notifications FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "System can update scheduled notifications"
  ON scheduled_notifications FOR UPDATE
  USING (organization_id = get_my_organization_id());

-- ===========================================
-- REALTIME SUBSCRIPTIONS
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE notification_preferences;

-- ===========================================
-- HELPER FUNCTION: Update timestamp on preference change
-- ===========================================

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ===========================================
-- FUNCTION: Schedule due date notifications
-- Called when a task with a due date is created or updated
-- ===========================================

CREATE OR REPLACE FUNCTION schedule_due_date_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_assignee_id UUID;
  assignee_prefs notification_preferences%ROWTYPE;
  reminder_time TIMESTAMPTZ;
BEGIN
  -- Only proceed if task has a due date and an assignee
  IF NEW.due_date IS NOT NULL AND NEW.assignee_id IS NOT NULL THEN
    task_assignee_id := NEW.assignee_id;

    -- Check if user has due date reminders enabled
    SELECT * INTO assignee_prefs
    FROM notification_preferences
    WHERE user_id = task_assignee_id;

    IF assignee_prefs.due_date_reminder = true OR assignee_prefs.due_date_reminder IS NULL THEN
      -- Schedule reminder for 24 hours before due date
      reminder_time := NEW.due_date - INTERVAL '24 hours';

      -- Only schedule if reminder time is in the future
      IF reminder_time > NOW() THEN
        -- Delete any existing notification for this task
        DELETE FROM scheduled_notifications
        WHERE task_id = NEW.id AND type = 'due_date';

        -- Insert new notification
        INSERT INTO scheduled_notifications (
          user_id,
          organization_id,
          task_id,
          type,
          title,
          body,
          scheduled_for
        ) VALUES (
          task_assignee_id,
          NEW.organization_id,
          NEW.id,
          'due_date',
          'Task Due Tomorrow',
          'Your task "' || NEW.title || '" is due tomorrow.',
          reminder_time
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER schedule_task_due_notification
  AFTER INSERT OR UPDATE OF due_date, assignee_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION schedule_due_date_notification();

-- ===========================================
-- FUNCTION: Create urgency notification
-- Called when a high-urgency task is assigned
-- ===========================================

CREATE OR REPLACE FUNCTION notify_urgent_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  assignee_prefs notification_preferences%ROWTYPE;
BEGIN
  -- Only notify on new assignments or urgency increases to 4-5
  IF NEW.assignee_id IS NOT NULL AND NEW.urgent >= 4 THEN
    -- Check if this is a new assignment or urgency increase
    IF OLD IS NULL OR OLD.assignee_id IS DISTINCT FROM NEW.assignee_id OR OLD.urgent < 4 THEN
      -- Check if user has urgency alerts enabled
      SELECT * INTO assignee_prefs
      FROM notification_preferences
      WHERE user_id = NEW.assignee_id;

      IF assignee_prefs.urgency_alerts = true OR assignee_prefs.urgency_alerts IS NULL THEN
        -- Insert immediate notification
        INSERT INTO scheduled_notifications (
          user_id,
          organization_id,
          task_id,
          type,
          title,
          body,
          scheduled_for
        ) VALUES (
          NEW.assignee_id,
          NEW.organization_id,
          NEW.id,
          'urgency',
          'Urgent Task Assigned',
          'You have been assigned an urgent task: "' || NEW.title || '"',
          NOW()
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_on_urgent_assignment
  AFTER INSERT OR UPDATE OF assignee_id, urgent ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_urgent_task_assignment();

-- ===========================================
-- FUNCTION: Notify team member of task completion
-- ===========================================

CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  team_member RECORD;
  completer_name TEXT;
BEGIN
  -- Only trigger when task is marked as done
  IF NEW.status = 'done' AND (OLD IS NULL OR OLD.status != 'done') THEN
    -- Get the completer's name
    SELECT display_name INTO completer_name
    FROM profiles
    WHERE id = NEW.completed_by;

    -- Notify other team members who have team alerts enabled
    FOR team_member IN
      SELECT np.user_id, np.organization_id
      FROM notification_preferences np
      WHERE np.organization_id = NEW.organization_id
        AND np.user_id != NEW.completed_by
        AND np.team_alerts = true
    LOOP
      INSERT INTO scheduled_notifications (
        user_id,
        organization_id,
        task_id,
        type,
        title,
        body,
        scheduled_for
      ) VALUES (
        team_member.user_id,
        team_member.organization_id,
        NEW.id,
        'task_completed',
        'Task Completed',
        completer_name || ' completed: "' || NEW.title || '"',
        NOW()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_on_task_completion
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();
