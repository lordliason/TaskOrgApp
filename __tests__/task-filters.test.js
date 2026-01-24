/**
 * Unit tests for task filtering and search functionality
 * Tests: filter by assignee, search tasks, filter by completion status
 * @jest-environment jsdom
 */

describe('Task Filtering Functions', () => {
    let mockTasks;

    beforeEach(() => {
        mockTasks = [
            {
                id: '1',
                name: 'Task One',
                assignee: 'mario',
                completed: false,
                urgent: 5,
                important: 5
            },
            {
                id: '2',
                name: 'Task Two',
                assignee: 'maria',
                completed: false,
                urgent: 3,
                important: 3
            },
            {
                id: '3',
                name: 'Task Three',
                assignee: 'both',
                completed: true,
                urgent: 1,
                important: 1
            },
            {
                id: '4',
                name: 'Another Task',
                assignee: 'mario',
                completed: false,
                urgent: 4,
                important: 4
            }
        ];
    });

    describe('filter by assignee', () => {
        test('should filter tasks by mario', () => {
            const filter = 'mario';
            const filtered = mockTasks.filter(task => {
                if (filter === 'all') return true;
                return task.assignee === filter || task.assignee === 'both';
            });

            expect(filtered.length).toBe(3); // Task 1, 3, 4
            expect(filtered.every(t => t.assignee === 'mario' || t.assignee === 'both')).toBe(true);
        });

        test('should filter tasks by maria', () => {
            const filter = 'maria';
            const filtered = mockTasks.filter(task => {
                if (filter === 'all') return true;
                return task.assignee === filter || task.assignee === 'both';
            });

            expect(filtered.length).toBe(2); // Task 2, 3
            expect(filtered.every(t => t.assignee === 'maria' || t.assignee === 'both')).toBe(true);
        });

        test('should show all tasks when filter is "all"', () => {
            const filter = 'all';
            const filtered = mockTasks.filter(task => {
                if (filter === 'all') return true;
                return task.assignee === filter || task.assignee === 'both';
            });

            expect(filtered.length).toBe(mockTasks.length);
        });

        test('should include "both" tasks in any assignee filter', () => {
            const filter = 'mario';
            const filtered = mockTasks.filter(task => {
                if (filter === 'all') return true;
                return task.assignee === filter || task.assignee === 'both';
            });

            const bothTask = filtered.find(t => t.assignee === 'both');
            expect(bothTask).toBeDefined();
        });
    });

    describe('filter by completion status', () => {
        test('should filter incomplete tasks', () => {
            const filtered = mockTasks.filter(task => !task.completed);

            expect(filtered.length).toBe(3);
            expect(filtered.every(t => !t.completed)).toBe(true);
        });

        test('should filter completed tasks', () => {
            const filtered = mockTasks.filter(task => task.completed);

            expect(filtered.length).toBe(1);
            expect(filtered[0].completed).toBe(true);
        });
    });

    describe('search tasks', () => {
        test('should search by task name (case insensitive)', () => {
            const searchTerm = 'task';
            const filtered = mockTasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(filtered.length).toBe(3); // Task One, Task Two, Task Three
        });

        test('should search by partial match', () => {
            const searchTerm = 'one';
            const filtered = mockTasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(filtered.length).toBe(1);
            expect(filtered[0].name).toBe('Task One');
        });

        test('should return empty array for no matches', () => {
            const searchTerm = 'nonexistent';
            const filtered = mockTasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(filtered.length).toBe(0);
        });

        test('should handle empty search term', () => {
            const searchTerm = '';
            const filtered = mockTasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            expect(filtered.length).toBe(mockTasks.length);
        });
    });

    describe('combined filters', () => {
        test('should filter by assignee and completion status', () => {
            const assigneeFilter = 'mario';
            const completedFilter = false;

            const filtered = mockTasks.filter(task => {
                const matchesAssignee = assigneeFilter === 'all' || 
                    task.assignee === assigneeFilter || 
                    task.assignee === 'both';
                const matchesCompleted = completedFilter === null || 
                    task.completed === completedFilter;
                return matchesAssignee && matchesCompleted;
            });

            expect(filtered.length).toBe(2); // Task 1 and 4 (both incomplete, mario or both)
            expect(filtered.every(t => !t.completed)).toBe(true);
        });

        test('should filter by search term and assignee', () => {
            const searchTerm = 'task';
            const assigneeFilter = 'mario';

            const filtered = mockTasks.filter(task => {
                const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesAssignee = assigneeFilter === 'all' || 
                    task.assignee === assigneeFilter || 
                    task.assignee === 'both';
                return matchesSearch && matchesAssignee;
            });

            expect(filtered.length).toBe(2); // Task One and Task Three
        });

        test('should filter by search term, assignee, and completion', () => {
            const searchTerm = 'task';
            const assigneeFilter = 'mario';
            const completedFilter = false;

            const filtered = mockTasks.filter(task => {
                const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesAssignee = assigneeFilter === 'all' || 
                    task.assignee === assigneeFilter || 
                    task.assignee === 'both';
                const matchesCompleted = completedFilter === null || 
                    task.completed === completedFilter;
                return matchesSearch && matchesAssignee && matchesCompleted;
            });

            expect(filtered.length).toBe(1); // Only Task One
        });
    });

    describe('sort tasks', () => {
        test('should sort by urgency and importance (Eisenhower Matrix)', () => {
            const sorted = [...mockTasks].sort((a, b) => {
                // Sort by urgent first (descending), then important (descending)
                if (b.urgent !== a.urgent) {
                    return b.urgent - a.urgent;
                }
                return b.important - a.important;
            });

            expect(sorted[0].urgent).toBe(5);
            expect(sorted[0].important).toBe(5);
            expect(sorted[sorted.length - 1].urgent).toBe(1);
        });

        test('should sort by name alphabetically', () => {
            const sorted = [...mockTasks].sort((a, b) => 
                a.name.localeCompare(b.name)
            );

            expect(sorted[0].name).toBe('Another Task');
            expect(sorted[sorted.length - 1].name).toBe('Task Two');
        });

        test('should sort by completion status (incomplete first)', () => {
            const sorted = [...mockTasks].sort((a, b) => {
                if (a.completed === b.completed) return 0;
                return a.completed ? 1 : -1;
            });

            expect(sorted[0].completed).toBe(false);
            expect(sorted[sorted.length - 1].completed).toBe(true);
        });
    });
});
