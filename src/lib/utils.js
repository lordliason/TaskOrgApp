import { POINTS_BY_EFFORT } from './constants';

/**
 * Calculate points for completing a task based on effort size
 * @param {string} effort - Task effort size (xs, s, m, l, xl)
 * @returns {number} Points earned
 */
export function calculatePoints(effort) {
  return POINTS_BY_EFFORT[effort] || POINTS_BY_EFFORT.m;
}

/**
 * Determine which quadrant a task belongs to based on urgency and importance
 * @param {number} urgent - Urgency level (1-5)
 * @param {number} important - Importance level (1-5)
 * @returns {number} Quadrant number (1-4)
 */
export function getTaskQuadrant(urgent, important) {
  const isUrgent = urgent >= 3;
  const isImportant = important >= 3;

  if (isUrgent && isImportant) return 1; // Do First
  if (!isUrgent && isImportant) return 2; // Schedule
  if (isUrgent && !isImportant) return 3; // Delegate
  return 4; // Eliminate
}

/**
 * Check if a task is due today
 * @param {string} dueDate - ISO date string
 * @returns {boolean}
 */
export function isDueToday(dueDate) {
  if (!dueDate) return false;
  const today = new Date().toISOString().split('T')[0];
  return dueDate.split('T')[0] === today;
}

/**
 * Check if a task should appear in today's planner
 * @param {object} task - Task object
 * @returns {boolean}
 */
export function isTaskForToday(task) {
  if (task.status === 'done') return false;
  if (task.urgent >= 3) return true; // Today or more urgent
  if (task.due_date) return isDueToday(task.due_date);
  return false;
}

/**
 * Sort tasks by priority (urgency first, then importance)
 * @param {object} a - Task A
 * @param {object} b - Task B
 * @returns {number} Sort comparison result
 */
export function sortByPriority(a, b) {
  if (b.urgent !== a.urgent) return b.urgent - a.urgent;
  return b.important - a.important;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * @returns {string}
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Generate a random hex color
 * @returns {string}
 */
export function randomColor() {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Aggregate scores by user
 * @param {Array} scores - Array of score records
 * @param {Array} members - Array of member profiles
 * @returns {Array} Aggregated leaderboard data
 */
export function aggregateScores(scores, members) {
  return members.map((member) => {
    const userScores = scores.filter((s) => s.user_id === member.id);
    const totalPoints = userScores.reduce((sum, s) => sum + s.points, 0);
    const totalTasks = userScores.reduce((sum, s) => sum + s.tasks_completed, 0);

    return {
      userId: member.id,
      displayName: member.display_name,
      color: member.color,
      totalPoints,
      totalTasks,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
}
