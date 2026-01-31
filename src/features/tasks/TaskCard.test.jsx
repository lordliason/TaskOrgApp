import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskCard from './TaskCard';

// Mock stores
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    profile: { id: 'user-1' },
    organization: { id: 'org-1' },
  }),
}));

vi.mock('../../store/taskStore', () => ({
  useTaskStore: () => ({
    completeTask: vi.fn().mockResolvedValue({ success: true }),
    uncompleteTask: vi.fn().mockResolvedValue({ success: true }),
    deleteTask: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('TaskCard', () => {
  const defaultTask = {
    id: 'task-1',
    title: 'Test task',
    status: 'todo',
    urgent: 3,
    important: 3,
    effort: 'm',
    due_date: null,
    assignee: { display_name: 'Test User', color: '#3B82F6' },
  };

  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
  });

  it('renders task title', () => {
    render(<TaskCard task={defaultTask} onEdit={vi.fn()} />);
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('renders assignee name', () => {
    render(<TaskCard task={defaultTask} onEdit={vi.fn()} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders Unassigned when no assignee', () => {
    const taskWithoutAssignee = { ...defaultTask, assignee: null };
    render(<TaskCard task={taskWithoutAssignee} onEdit={vi.fn()} />);
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('renders compact view when compact prop is true', () => {
    render(<TaskCard task={defaultTask} onEdit={vi.fn()} compact />);
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('renders effort label', () => {
    render(<TaskCard task={defaultTask} onEdit={vi.fn()} />);
    expect(screen.getByText(/M/)).toBeInTheDocument();
  });
});
