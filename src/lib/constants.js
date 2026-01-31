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
