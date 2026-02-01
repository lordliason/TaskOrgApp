# Feature Research: Nice-to-Have Additions for TaskOrgApp

This document outlines two high-value features that would significantly enhance the TaskOrgApp user experience. Each feature has been researched for implementation feasibility with our existing tech stack (React, Supabase, PWA).

---

## Feature 1: Push Notifications & Smart Reminders

### Overview
Add push notification capabilities to alert users about due dates, urgent tasks, and daily planning reminders. This leverages the existing PWA infrastructure to deliver timely, actionable notifications even when the app isn't open.

### Why This Feature?
- The app already has PWA support with service workers configured in `vite.config.js`
- Tasks have due dates and urgency levels but no way to proactively remind users
- 89% of users find push notifications valuable for task management apps
- Small teams (2 members) benefit from real-time task assignment alerts

### Proposed Functionality

#### 1. Due Date Reminders
- **24 hours before**: Gentle reminder for upcoming tasks
- **Day-of reminder**: Morning notification with today's due tasks
- **Overdue alerts**: Notification when tasks pass their due date

#### 2. Urgency-Based Alerts
- High urgency tasks (4-5) get immediate push notifications when assigned
- Configurable escalation for tasks approaching Quadrant 1 (Do First)

#### 3. Daily Planning Nudge
- Optional morning notification summarizing tasks in Daily Planner view
- Customizable time (e.g., 8 AM, 9 AM) per user preference

#### 4. Team Collaboration Alerts
- Notification when partner completes a task
- Alert when a task is assigned to you
- Weekly leaderboard summary push

### Technical Implementation

#### Database Changes
```sql
-- New table for notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  due_date_reminder BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT true,
  daily_summary_time TIME DEFAULT '08:00',
  urgency_alerts BOOLEAN DEFAULT true,
  team_alerts BOOLEAN DEFAULT true,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store scheduled notifications
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'due_date', 'daily_summary', 'urgency', 'team'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Frontend Components
1. **NotificationSettings.jsx**: User preferences UI in Settings page
2. **useNotifications.js**: Custom hook for permission handling and token management
3. **Service Worker Update**: Extend existing SW for push handling

#### Backend Services
1. **Supabase Edge Function**: Scheduled function to check and send notifications
2. **Firebase Cloud Messaging (FCM)**: Push delivery service (free tier supports our needs)
3. **Database Trigger**: Insert scheduled notifications when tasks are created/updated

#### Integration Points
- `vite.config.js`: Already has PWA plugin - add `webPushPublicVapidKey` to manifest
- `src/main.jsx`: Add notification permission request flow
- `src/store/taskStore.js`: Trigger notification scheduling on task CRUD

### Effort Estimate
- **Database**: 1-2 hours (migrations)
- **Backend**: 4-6 hours (Edge Functions, FCM setup)
- **Frontend**: 4-6 hours (settings UI, permission flow, SW updates)
- **Testing**: 2-3 hours
- **Total**: ~2-3 days of development

### References
- [Supabase Push Notifications Docs](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [PWA Push Notification Best Practices](https://quokkalabs.com/blog/what-are-push-notifications/)
- [Must-Have Notification Features](https://taskito.io/blog/4-must-have-notification-features-todo-list-app/)

---

## Feature 2: Productivity Analytics Dashboard

### Overview
Create a comprehensive analytics view showing productivity trends, streak tracking, completion patterns, and personalized insights. This builds on the existing gamification system (points, leaderboard) to provide deeper engagement and self-improvement tools.

### Why This Feature?
- The app already tracks `scores` with daily points and tasks completed
- 93% of task management app users rate analytics/reporting as important
- Streaks are proven to increase user retention by 2-3x
- Complements the existing leaderboard with personal growth metrics

### Proposed Functionality

#### 1. Streak Tracking
- **Daily streak**: Consecutive days with at least 1 task completed
- **Visual streak counter**: Prominent display with flame/fire icon
- **Streak milestones**: Badges at 7, 30, 100 days
- **Streak protection**: One "freeze" per week to prevent losing progress

#### 2. Productivity Trends
- **Weekly completion graph**: Bar chart showing tasks completed each day
- **Monthly heatmap**: GitHub-style contribution heatmap for the past 12 weeks
- **Effort distribution**: Pie chart of task sizes completed (XS, S, M, L, XL)

#### 3. Quadrant Analytics
- **Matrix distribution**: Visual breakdown of where tasks fall
- **Time-in-quadrant**: Average time tasks spend in each quadrant before completion
- **Quadrant 1 alerts**: Track how many urgent+important tasks are accumulating

#### 4. Personal Insights
- **Best productivity day**: Which day of week you complete most tasks
- **Average tasks per day**: Rolling 7-day average
- **Points trend**: Weekly points compared to previous week (up/down indicator)
- **Completion rate**: Percentage of tasks created vs completed

### Technical Implementation

#### Database Changes
```sql
-- Add streak tracking to profiles
ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN streak_freeze_available BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN last_activity_date DATE;

-- Create analytics aggregation view
CREATE VIEW user_analytics AS
SELECT
  user_id,
  organization_id,
  date,
  points,
  tasks_completed,
  DATE_TRUNC('week', date) as week,
  EXTRACT(DOW FROM date) as day_of_week
FROM scores;

-- Function to update streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic to calculate and update streak
  -- Called when a score record is inserted
END;
$$ LANGUAGE plpgsql;
```

#### Frontend Components
1. **AnalyticsDashboard.jsx**: Main analytics page container
2. **StreakDisplay.jsx**: Streak counter with milestone badges
3. **ProductivityChart.jsx**: Weekly completion bar chart (using lightweight chart library)
4. **HeatmapCalendar.jsx**: Contribution-style heatmap component
5. **InsightsCard.jsx**: Personal insight summaries
6. **QuadrantStats.jsx**: Matrix distribution visualization

#### Store Updates
```javascript
// src/store/analyticsStore.js (new)
- fetchUserAnalytics(userId, dateRange)
- getStreakInfo()
- getWeeklyTrends()
- getQuadrantDistribution()
- getBestProductivityDay()
```

#### Visualization Library
Recommend **Recharts** (lightweight, React-native) for charts:
- Already compatible with React 18
- Small bundle size (~35KB gzipped)
- Supports bar charts, pie charts, and custom components

### UI/UX Design

```
┌─────────────────────────────────────────────────────────┐
│  📊 Productivity Analytics                              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 🔥 12 Days   │  │ 📈 +15%     │  │ ✅ 87%      │  │
│  │ Current      │  │ vs Last     │  │ Completion   │  │
│  │ Streak       │  │ Week        │  │ Rate         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Weekly Activity                                        │
│  ████░░░░  Mon                                          │
│  ██████░░  Tue                                          │
│  ██████████  Wed (Best Day!)                           │
│  ████░░░░  Thu                                          │
│  ██░░░░░░  Fri                                          │
│  ░░░░░░░░  Sat                                          │
│  ░░░░░░░░  Sun                                          │
├─────────────────────────────────────────────────────────┤
│  12-Week Heatmap                                        │
│  ░░▓▓██░░▓▓░░██▓▓░░▓▓██░░░░▓▓██▓▓░░▓▓░░██▓▓░░         │
│  ░░▓▓░░██▓▓░░██░░▓▓░░██▓▓░░▓▓██░░▓▓░░██▓▓░░▓▓         │
└─────────────────────────────────────────────────────────┘
```

### Effort Estimate
- **Database**: 2-3 hours (migrations, views, functions)
- **Store**: 3-4 hours (analytics store, queries)
- **Components**: 6-8 hours (dashboard, charts, heatmap)
- **Recharts Integration**: 1-2 hours
- **Testing**: 2-3 hours
- **Total**: ~3-4 days of development

### References
- [Task Analytics - Productivity Insights](https://task-analytics.com/report/2025)
- [Gamification Dashboard Design](https://yukaichou.com/gamification-study/the-strategy-dashboard-for-gamification-design/)
- [Productivity Gamification Examples](https://trophy.so/blog/productivity-gamification-examples)
- [Team Engagement with Gamified Dashboards](https://www.plecto.com/blog/gamification/team-engagement-and-gamification-dashboards/)

---

## Summary Comparison

| Aspect | Push Notifications | Analytics Dashboard |
|--------|-------------------|---------------------|
| **User Value** | High - Proactive engagement | High - Self-improvement |
| **Development Effort** | 2-3 days | 3-4 days |
| **Dependencies** | FCM, Edge Functions | Recharts library |
| **Builds On** | PWA, Task due dates | Scores table, Leaderboard |
| **Retention Impact** | Reduces missed tasks | Increases daily engagement |

## Recommended Priority

1. **Analytics Dashboard** (First) - Builds directly on existing data, no external service dependencies, provides immediate user value
2. **Push Notifications** (Second) - Requires FCM setup and Edge Functions, but greatly improves proactive engagement

Both features complement each other: Analytics shows users their progress, while Notifications help them maintain that progress.
