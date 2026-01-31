import { describe, it, expect } from 'vitest';
import {
  EFFORT_SIZES,
  URGENCY_LEVELS,
  IMPORTANCE_LEVELS,
  TASK_STATUS,
  USER_ROLES,
  DEFAULT_COLORS,
  POINTS_BY_EFFORT,
} from './constants';

describe('EFFORT_SIZES', () => {
  it('should have all required effort sizes', () => {
    expect(EFFORT_SIZES).toHaveProperty('xs');
    expect(EFFORT_SIZES).toHaveProperty('s');
    expect(EFFORT_SIZES).toHaveProperty('m');
    expect(EFFORT_SIZES).toHaveProperty('l');
    expect(EFFORT_SIZES).toHaveProperty('xl');
  });

  it('should have correct structure for each size', () => {
    Object.values(EFFORT_SIZES).forEach((size) => {
      expect(size).toHaveProperty('label');
      expect(size).toHaveProperty('description');
      expect(size).toHaveProperty('minutes');
      expect(typeof size.label).toBe('string');
      expect(typeof size.description).toBe('string');
      expect(typeof size.minutes).toBe('number');
    });
  });

  it('should have increasing minutes', () => {
    expect(EFFORT_SIZES.xs.minutes).toBeLessThan(EFFORT_SIZES.s.minutes);
    expect(EFFORT_SIZES.s.minutes).toBeLessThan(EFFORT_SIZES.m.minutes);
    expect(EFFORT_SIZES.m.minutes).toBeLessThan(EFFORT_SIZES.l.minutes);
    expect(EFFORT_SIZES.l.minutes).toBeLessThan(EFFORT_SIZES.xl.minutes);
  });
});

describe('URGENCY_LEVELS', () => {
  it('should have levels 1-5', () => {
    expect(Object.keys(URGENCY_LEVELS)).toHaveLength(5);
    [1, 2, 3, 4, 5].forEach((level) => {
      expect(URGENCY_LEVELS).toHaveProperty(String(level));
    });
  });

  it('should have label and color for each level', () => {
    Object.values(URGENCY_LEVELS).forEach((level) => {
      expect(level).toHaveProperty('label');
      expect(level).toHaveProperty('color');
    });
  });
});

describe('IMPORTANCE_LEVELS', () => {
  it('should have levels 1-5', () => {
    expect(Object.keys(IMPORTANCE_LEVELS)).toHaveLength(5);
    [1, 2, 3, 4, 5].forEach((level) => {
      expect(IMPORTANCE_LEVELS).toHaveProperty(String(level));
    });
  });

  it('should have label and color for each level', () => {
    Object.values(IMPORTANCE_LEVELS).forEach((level) => {
      expect(level).toHaveProperty('label');
      expect(level).toHaveProperty('color');
    });
  });
});

describe('TASK_STATUS', () => {
  it('should have all required statuses', () => {
    expect(TASK_STATUS.TODO).toBe('todo');
    expect(TASK_STATUS.IN_PROGRESS).toBe('in_progress');
    expect(TASK_STATUS.DONE).toBe('done');
  });
});

describe('USER_ROLES', () => {
  it('should have admin and member roles', () => {
    expect(USER_ROLES.ADMIN).toBe('admin');
    expect(USER_ROLES.MEMBER).toBe('member');
  });
});

describe('DEFAULT_COLORS', () => {
  it('should have at least 6 colors', () => {
    expect(DEFAULT_COLORS.length).toBeGreaterThanOrEqual(6);
  });

  it('should have valid hex colors', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    DEFAULT_COLORS.forEach((color) => {
      expect(color).toMatch(hexRegex);
    });
  });
});

describe('POINTS_BY_EFFORT', () => {
  it('should have points for all effort sizes', () => {
    expect(POINTS_BY_EFFORT).toHaveProperty('xs');
    expect(POINTS_BY_EFFORT).toHaveProperty('s');
    expect(POINTS_BY_EFFORT).toHaveProperty('m');
    expect(POINTS_BY_EFFORT).toHaveProperty('l');
    expect(POINTS_BY_EFFORT).toHaveProperty('xl');
  });

  it('should have increasing points', () => {
    expect(POINTS_BY_EFFORT.xs).toBeLessThan(POINTS_BY_EFFORT.s);
    expect(POINTS_BY_EFFORT.s).toBeLessThan(POINTS_BY_EFFORT.m);
    expect(POINTS_BY_EFFORT.m).toBeLessThan(POINTS_BY_EFFORT.l);
    expect(POINTS_BY_EFFORT.l).toBeLessThan(POINTS_BY_EFFORT.xl);
  });
});
