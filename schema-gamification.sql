-- Gamification Schema Extension for TaskOrgApp
-- Run this AFTER the main schema.sql

-- ===========================================
-- USER STREAKS TABLE
-- Tracks daily task completion streaks
-- ===========================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ===========================================
-- BADGES TABLE
-- Defines all available badges/achievements
-- ===========================================

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'matrix', 'effort', 'team', 'special')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- USER BADGES TABLE
-- Tracks badges earned by users
-- ===========================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, badge_id)
);

-- ===========================================
-- TEAM CHALLENGES TABLE
-- Weekly team challenges
-- ===========================================

CREATE TABLE IF NOT EXISTS team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  reward_points INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- COMBO EVENTS TABLE
-- Tracks recent task completions for combo detection
-- ===========================================

CREATE TABLE IF NOT EXISTS combo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  base_points INTEGER NOT NULL,
  combo_multiplier DECIMAL(3,2) DEFAULT 1.0,
  bonus_points INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- USER STATS TABLE
-- Aggregated stats for badge tracking
-- ===========================================

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Matrix quadrant stats
  do_first_completed INTEGER DEFAULT 0,
  schedule_completed INTEGER DEFAULT 0,
  delegate_completed INTEGER DEFAULT 0,
  eliminate_completed INTEGER DEFAULT 0,
  -- Effort stats
  xs_completed INTEGER DEFAULT 0,
  s_completed INTEGER DEFAULT 0,
  m_completed INTEGER DEFAULT 0,
  l_completed INTEGER DEFAULT 0,
  xl_completed INTEGER DEFAULT 0,
  -- Other stats
  total_tasks_completed INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  combos_triggered INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_org ON user_streaks(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_org ON user_badges(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_org ON team_challenges(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_dates ON team_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_combo_events_org ON combo_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_combo_events_time ON combo_events(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Badges are readable by everyone
CREATE POLICY "Badges are publicly readable"
  ON badges FOR SELECT
  USING (true);

-- User streaks policies
CREATE POLICY "Users can view streaks in their organization"
  ON user_streaks FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "Users can create their own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = get_my_organization_id());

CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR UPDATE
  USING (user_id = auth.uid());

-- User badges policies
CREATE POLICY "Users can view badges in their organization"
  ON user_badges FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "Users can earn badges"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = get_my_organization_id());

-- Team challenges policies
CREATE POLICY "Users can view challenges in their organization"
  ON team_challenges FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "Users can create challenges in their organization"
  ON team_challenges FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can update challenges in their organization"
  ON team_challenges FOR UPDATE
  USING (organization_id = get_my_organization_id());

-- Combo events policies
CREATE POLICY "Users can view combo events in their organization"
  ON combo_events FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "Users can create combo events"
  ON combo_events FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

-- User stats policies
CREATE POLICY "Users can view stats in their organization"
  ON user_stats FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "Users can create their own stats"
  ON user_stats FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = get_my_organization_id());

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  USING (user_id = auth.uid());

-- ===========================================
-- ENABLE REALTIME
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE user_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE team_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE combo_events;
ALTER PUBLICATION supabase_realtime ADD TABLE user_stats;

-- ===========================================
-- SEED BADGES DATA
-- ===========================================

INSERT INTO badges (id, name, description, icon, category, requirement_type, requirement_value, points_bonus) VALUES
-- Streak badges
('streak_3', 'Getting Started', 'Complete tasks 3 days in a row', '🔥', 'streak', 'streak_days', 3, 10),
('streak_7', 'On Fire', 'Complete tasks 7 days in a row', '🔥', 'streak', 'streak_days', 7, 25),
('streak_14', 'Unstoppable', 'Complete tasks 14 days in a row', '💫', 'streak', 'streak_days', 14, 50),
('streak_30', 'Streak Legend', 'Complete tasks 30 days in a row', '⚡', 'streak', 'streak_days', 30, 100),

-- Matrix mastery badges
('do_first_10', 'Priority Pro', 'Complete 10 urgent & important tasks', '🎯', 'matrix', 'do_first_completed', 10, 15),
('do_first_50', 'Do First Champion', 'Complete 50 urgent & important tasks', '🏆', 'matrix', 'do_first_completed', 50, 50),
('schedule_25', 'Strategic Planner', 'Complete 25 scheduled tasks', '📅', 'matrix', 'schedule_completed', 25, 30),
('schedule_100', 'Time Lord', 'Complete 100 scheduled tasks', '⏰', 'matrix', 'schedule_completed', 100, 75),
('delegate_15', 'Team Player', 'Complete 15 delegated tasks', '🤝', 'matrix', 'delegate_completed', 15, 20),
('delegate_50', 'Delegation Pro', 'Complete 50 delegated tasks', '👥', 'matrix', 'delegate_completed', 50, 50),
('eliminate_10', 'Declutterer', 'Eliminate 10 low-priority tasks', '🧹', 'matrix', 'eliminate_completed', 10, 10),
('eliminate_50', 'Focus Master', 'Eliminate 50 low-priority tasks', '🎯', 'matrix', 'eliminate_completed', 50, 40),

-- Effort badges
('xl_5', 'Heavy Lifter', 'Complete 5 XL tasks', '💪', 'effort', 'xl_completed', 5, 25),
('xl_25', 'Powerhouse', 'Complete 25 XL tasks', '🦾', 'effort', 'xl_completed', 25, 75),
('total_50', 'Task Crusher', 'Complete 50 total tasks', '✨', 'effort', 'total_tasks_completed', 50, 30),
('total_100', 'Century Club', 'Complete 100 total tasks', '💯', 'effort', 'total_tasks_completed', 100, 60),
('total_500', 'Task Master', 'Complete 500 total tasks', '👑', 'effort', 'total_tasks_completed', 500, 150),

-- Team/combo badges
('combo_5', 'Team Synergy', 'Trigger 5 team combos', '⚡', 'team', 'combos_triggered', 5, 20),
('combo_25', 'Combo King', 'Trigger 25 team combos', '🎮', 'team', 'combos_triggered', 25, 60),
('challenge_3', 'Challenge Accepted', 'Complete 3 weekly challenges', '🏅', 'team', 'challenges_completed', 3, 40),
('challenge_10', 'Challenge Champion', 'Complete 10 weekly challenges', '🥇', 'team', 'challenges_completed', 10, 100)

ON CONFLICT (id) DO NOTHING;
