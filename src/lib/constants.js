// Task effort sizes with labels and estimated durations
export const EFFORT_SIZES = {
  xs: { label: 'XS', description: '5-10 min', minutes: 10 },
  s: { label: 'S', description: '10-30 min', minutes: 30 },
  m: { label: 'M', description: '30-60 min', minutes: 60 },
  l: { label: 'L', description: '1-2 hours', minutes: 120 },
  xl: { label: 'XL', description: '2+ hours', minutes: 180 },
};

// Urgency levels (1-5)
export const URGENCY_LEVELS = {
  1: { label: 'Whenever', color: 'gray' },
  2: { label: 'This Week', color: 'blue' },
  3: { label: 'Today', color: 'yellow' },
  4: { label: 'This Morning', color: 'orange' },
  5: { label: 'ASAP', color: 'red' },
};

// Importance levels (1-5)
export const IMPORTANCE_LEVELS = {
  1: { label: 'Optional', color: 'gray' },
  2: { label: 'Nice to Have', color: 'blue' },
  3: { label: 'Keeps us on track', color: 'yellow' },
  4: { label: 'Matters a lot', color: 'orange' },
  5: { label: 'Critical', color: 'red' },
};

// Task statuses
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

// Default user colors
export const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

// Points calculation based on effort
export const POINTS_BY_EFFORT = {
  xs: 5,
  s: 10,
  m: 20,
  l: 35,
  xl: 50,
};

// Task icons organized by category
export const TASK_ICONS = {
  shopping: ['🛒', '🏪', '🏥'],
  home: ['🏠', '🧹', '🧽', '🧼', '🛁', '🗑️', '🧺'],
  garden: ['🌱', '🪴'],
  creative: ['🎨', '🖌️', '📝', '✏️', '📖', '📚', '🎵', '🎹'],
  work: ['💼', '📞', '✉️', '💻'],
  finance: ['💰', '💳', '🏦'],
  transport: ['🚗', '🚲', '✈️'],
  food: ['🍽️', '🥘', '☕'],
  health: ['💪', '🏃', '🧘'],
  family: ['🐕', '🐱', '👨‍👩‍👧‍👦'],
  maintenance: ['🔧', '🛠️', '💡', '🔌'],
  planning: ['📅', '⏰', '🎯'],
  celebrations: ['🎁', '🎉', '🎂'],
};

// Flat array of all icons for easy iteration
export const ALL_TASK_ICONS = Object.values(TASK_ICONS).flat();

// Recurrence presets
export const RECURRENCE_PRESETS = {
  never: { label: 'Never', rule: '' },
  daily: { label: 'Daily', rule: 'FREQ=DAILY' },
  weekly: { label: 'Weekly', rule: 'FREQ=WEEKLY' },
  monthly: { label: 'Monthly', rule: 'FREQ=MONTHLY' },
  weekdays: { label: 'Every Weekday', rule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  custom: { label: 'Custom', rule: '' },
};

// ===========================================
// GAMIFICATION CONSTANTS
// ===========================================

// Streak bonus multipliers (percentage bonus on base points)
export const STREAK_BONUSES = {
  3: { bonus: 0.10, label: '+10%', icon: '🔥' },
  7: { bonus: 0.25, label: '+25%', icon: '🔥' },
  14: { bonus: 0.35, label: '+35%', icon: '💫' },
  30: { bonus: 0.50, label: '+50%', icon: '⚡' },
};

// Get streak bonus for a given streak length
export const getStreakBonus = (streakDays) => {
  if (streakDays >= 30) return STREAK_BONUSES[30];
  if (streakDays >= 14) return STREAK_BONUSES[14];
  if (streakDays >= 7) return STREAK_BONUSES[7];
  if (streakDays >= 3) return STREAK_BONUSES[3];
  return { bonus: 0, label: '', icon: '' };
};

// Team combo multipliers
export const COMBO_MULTIPLIERS = {
  2: { multiplier: 1.5, label: '1.5x', description: 'Duo Combo!' },
  3: { multiplier: 2.0, label: '2x', description: 'Team Combo!' },
};

// Combo detection window in minutes
export const COMBO_WINDOW_MINUTES = 30;

// Weekly challenge templates
export const CHALLENGE_TEMPLATES = [
  {
    type: 'total_tasks',
    title: 'Task Blitz',
    description: 'Complete {target} tasks as a team this week',
    baseTarget: 20,
    rewardPoints: 100,
  },
  {
    type: 'xl_tasks',
    title: 'Heavy Lifting',
    description: 'Complete {target} XL tasks as a team',
    baseTarget: 5,
    rewardPoints: 150,
  },
  {
    type: 'do_first_tasks',
    title: 'Priority Push',
    description: 'Complete {target} urgent & important tasks',
    baseTarget: 15,
    rewardPoints: 120,
  },
  {
    type: 'streak_days',
    title: 'Streak Squad',
    description: 'Everyone maintains a streak for {target} days',
    baseTarget: 5,
    rewardPoints: 200,
  },
  {
    type: 'zero_overdue',
    title: 'On Time Team',
    description: 'End the week with zero overdue tasks',
    baseTarget: 1,
    rewardPoints: 175,
  },
  {
    type: 'combo_count',
    title: 'Combo Masters',
    description: 'Trigger {target} team combos this week',
    baseTarget: 10,
    rewardPoints: 125,
  },
];

// Badge categories with colors
export const BADGE_CATEGORIES = {
  streak: { label: 'Streaks', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
  matrix: { label: 'Matrix Mastery', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  effort: { label: 'Effort', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  team: { label: 'Team', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  special: { label: 'Special', color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.15)' },
};
