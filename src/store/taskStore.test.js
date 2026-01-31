import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from './taskStore';

// Mock Supabase to avoid real API calls
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

describe('taskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [
        { id: '1', status: 'todo', urgent: 5, important: 5, due_date: null },
        { id: '2', status: 'todo', urgent: 1, important: 5, due_date: null },
        { id: '3', status: 'todo', urgent: 5, important: 1, due_date: null },
        { id: '4', status: 'todo', urgent: 1, important: 1, due_date: null },
        { id: '5', status: 'done', urgent: 3, important: 3, due_date: null },
      ],
    });
  });

  describe('getTasksByQuadrant', () => {
    it('should return quadrant 1 tasks (urgent >= 3, important >= 3)', () => {
      const tasks = useTaskStore.getState().getTasksByQuadrant(1);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('1');
      expect(tasks[0].urgent).toBe(5);
      expect(tasks[0].important).toBe(5);
    });

    it('should return quadrant 2 tasks (urgent < 3, important >= 3)', () => {
      const tasks = useTaskStore.getState().getTasksByQuadrant(2);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('2');
      expect(tasks[0].urgent).toBe(1);
      expect(tasks[0].important).toBe(5);
    });

    it('should return quadrant 3 tasks (urgent >= 3, important < 3)', () => {
      const tasks = useTaskStore.getState().getTasksByQuadrant(3);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('3');
      expect(tasks[0].urgent).toBe(5);
      expect(tasks[0].important).toBe(1);
    });

    it('should return quadrant 4 tasks (urgent < 3, important < 3)', () => {
      const tasks = useTaskStore.getState().getTasksByQuadrant(4);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('4');
      expect(tasks[0].urgent).toBe(1);
      expect(tasks[0].important).toBe(1);
    });

    it('should exclude done tasks from all quadrants', () => {
      const tasks1 = useTaskStore.getState().getTasksByQuadrant(1);
      expect(tasks1.some((t) => t.status === 'done')).toBe(false);
    });

    it('should return all non-done tasks for unknown quadrant', () => {
      const tasks = useTaskStore.getState().getTasksByQuadrant(99);
      expect(tasks).toHaveLength(4);
    });
  });

  describe('getTodaysTasks', () => {
    it('should include urgent tasks (urgent >= 3)', () => {
      const tasks = useTaskStore.getState().getTodaysTasks();
      const urgentTaskIds = tasks.filter((t) => t.urgent >= 3).map((t) => t.id);
      expect(urgentTaskIds).toContain('1');
      expect(urgentTaskIds).toContain('3');
    });

    it('should exclude done tasks', () => {
      const tasks = useTaskStore.getState().getTodaysTasks();
      expect(tasks.some((t) => t.id === '5')).toBe(false);
    });

    it('should include tasks due today', () => {
      const today = new Date().toISOString().split('T')[0];
      useTaskStore.setState({
        tasks: [
          { id: 'due-today', status: 'todo', urgent: 1, important: 1, due_date: today },
        ],
      });
      const tasks = useTaskStore.getState().getTodaysTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('due-today');
    });
  });
});
