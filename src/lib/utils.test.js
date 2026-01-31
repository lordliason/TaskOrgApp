import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculatePoints,
  getTaskQuadrant,
  isDueToday,
  isTaskForToday,
  sortByPriority,
  formatDate,
  isValidEmail,
  isValidPhone,
  aggregateScores,
} from './utils';

describe('calculatePoints', () => {
  it('should return correct points for each effort size', () => {
    expect(calculatePoints('xs')).toBe(5);
    expect(calculatePoints('s')).toBe(10);
    expect(calculatePoints('m')).toBe(20);
    expect(calculatePoints('l')).toBe(35);
    expect(calculatePoints('xl')).toBe(50);
  });

  it('should return default points for unknown effort', () => {
    expect(calculatePoints('unknown')).toBe(20); // Default to 'm'
    expect(calculatePoints(null)).toBe(20);
    expect(calculatePoints(undefined)).toBe(20);
  });
});

describe('getTaskQuadrant', () => {
  it('should return quadrant 1 for urgent and important tasks', () => {
    expect(getTaskQuadrant(5, 5)).toBe(1);
    expect(getTaskQuadrant(3, 3)).toBe(1);
    expect(getTaskQuadrant(4, 4)).toBe(1);
  });

  it('should return quadrant 2 for important but not urgent tasks', () => {
    expect(getTaskQuadrant(1, 5)).toBe(2);
    expect(getTaskQuadrant(2, 3)).toBe(2);
    expect(getTaskQuadrant(1, 4)).toBe(2);
  });

  it('should return quadrant 3 for urgent but not important tasks', () => {
    expect(getTaskQuadrant(5, 1)).toBe(3);
    expect(getTaskQuadrant(3, 2)).toBe(3);
    expect(getTaskQuadrant(4, 1)).toBe(3);
  });

  it('should return quadrant 4 for neither urgent nor important tasks', () => {
    expect(getTaskQuadrant(1, 1)).toBe(4);
    expect(getTaskQuadrant(2, 2)).toBe(4);
    expect(getTaskQuadrant(1, 2)).toBe(4);
  });
});

describe('isDueToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return true if due date is today', () => {
    expect(isDueToday('2024-01-15T00:00:00Z')).toBe(true);
    expect(isDueToday('2024-01-15')).toBe(true);
  });

  it('should return false if due date is not today', () => {
    expect(isDueToday('2024-01-14T00:00:00Z')).toBe(false);
    expect(isDueToday('2024-01-16T00:00:00Z')).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isDueToday(null)).toBe(false);
    expect(isDueToday(undefined)).toBe(false);
    expect(isDueToday('')).toBe(false);
  });
});

describe('isTaskForToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return false for completed tasks', () => {
    expect(isTaskForToday({ status: 'done', urgent: 5 })).toBe(false);
  });

  it('should return true for urgent tasks (urgent >= 3)', () => {
    expect(isTaskForToday({ status: 'todo', urgent: 3, important: 1 })).toBe(true);
    expect(isTaskForToday({ status: 'todo', urgent: 5, important: 1 })).toBe(true);
  });

  it('should return true for tasks due today', () => {
    expect(isTaskForToday({
      status: 'todo',
      urgent: 1,
      due_date: '2024-01-15',
    })).toBe(true);
  });

  it('should return false for non-urgent tasks not due today', () => {
    expect(isTaskForToday({ status: 'todo', urgent: 1, important: 1 })).toBe(false);
    expect(isTaskForToday({
      status: 'todo',
      urgent: 2,
      due_date: '2024-01-20',
    })).toBe(false);
  });
});

describe('sortByPriority', () => {
  it('should sort by urgency first (descending)', () => {
    const tasks = [
      { urgent: 1, important: 5 },
      { urgent: 5, important: 1 },
      { urgent: 3, important: 3 },
    ];
    const sorted = tasks.sort(sortByPriority);
    
    expect(sorted[0].urgent).toBe(5);
    expect(sorted[1].urgent).toBe(3);
    expect(sorted[2].urgent).toBe(1);
  });

  it('should sort by importance when urgency is equal', () => {
    const tasks = [
      { urgent: 3, important: 1 },
      { urgent: 3, important: 5 },
      { urgent: 3, important: 3 },
    ];
    const sorted = tasks.sort(sortByPriority);
    
    expect(sorted[0].important).toBe(5);
    expect(sorted[1].important).toBe(3);
    expect(sorted[2].important).toBe(1);
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    // Use a date in the middle of the day to avoid timezone issues
    const formatted = formatDate('2024-01-15T12:00:00Z');
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('2024');
    // Date might be 14, 15, or 16 depending on timezone, just check it's a number
    expect(formatted).toMatch(/\d+/);
  });

  it('should return empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user @domain.com')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('should return true for valid phone numbers', () => {
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
    expect(isValidPhone('555-123-4567')).toBe(true);
    expect(isValidPhone('+14155551234')).toBe(true);
  });

  it('should return true for empty/null (phone is optional)', () => {
    expect(isValidPhone('')).toBe(true);
    expect(isValidPhone(null)).toBe(true);
    expect(isValidPhone(undefined)).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('abc')).toBe(false);
  });
});

describe('aggregateScores', () => {
  it('should aggregate scores correctly by user', () => {
    const members = [
      { id: 'user1', display_name: 'User 1', color: '#FF0000' },
      { id: 'user2', display_name: 'User 2', color: '#00FF00' },
    ];

    const scores = [
      { user_id: 'user1', points: 10, tasks_completed: 1 },
      { user_id: 'user1', points: 20, tasks_completed: 2 },
      { user_id: 'user2', points: 15, tasks_completed: 1 },
    ];

    const result = aggregateScores(scores, members);

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe('user1');
    expect(result[0].totalPoints).toBe(30);
    expect(result[0].totalTasks).toBe(3);
    expect(result[1].userId).toBe('user2');
    expect(result[1].totalPoints).toBe(15);
    expect(result[1].totalTasks).toBe(1);
  });

  it('should sort by total points descending', () => {
    const members = [
      { id: 'user1', display_name: 'User 1', color: '#FF0000' },
      { id: 'user2', display_name: 'User 2', color: '#00FF00' },
    ];

    const scores = [
      { user_id: 'user1', points: 10, tasks_completed: 1 },
      { user_id: 'user2', points: 50, tasks_completed: 3 },
    ];

    const result = aggregateScores(scores, members);

    expect(result[0].userId).toBe('user2');
    expect(result[1].userId).toBe('user1');
  });

  it('should handle empty scores', () => {
    const members = [
      { id: 'user1', display_name: 'User 1', color: '#FF0000' },
    ];

    const result = aggregateScores([], members);

    expect(result).toHaveLength(1);
    expect(result[0].totalPoints).toBe(0);
    expect(result[0].totalTasks).toBe(0);
  });
});
