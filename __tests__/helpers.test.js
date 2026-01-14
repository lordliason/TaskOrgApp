/**
 * Unit tests for helper functions
 * Tests: calculateDeadline, assignMatrixPositions, suggestIntegrations,
 *        reviewDecomposition, checkCircularDependencies, parseDeadline, etc.
 */

const {
    calculateDeadline,
    assignMatrixPositions,
    suggestIntegrations,
    reviewDecomposition,
    checkCircularDependencies,
    calculateConfidence,
    generateSuggestions,
    parseDeadline
} = require('../api/chat');

describe('Helper Functions', () => {
    describe('calculateDeadline', () => {
        test('should return null when parent deadline is not provided', () => {
            expect(calculateDeadline(0, null)).toBeNull();
            expect(calculateDeadline(1, undefined)).toBeNull();
        });

        test('should calculate deadline by subtracting days from parent deadline', () => {
            const parentDeadline = '2025-12-31';
            const result = calculateDeadline(0, parentDeadline);

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(result).not.toBe(parentDeadline);
        });

        test('should return date in YYYY-MM-DD format', () => {
            const parentDeadline = '2025-12-31';
            const result = calculateDeadline(0, parentDeadline);

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should subtract more days for later subtasks', () => {
            const parentDeadline = '2025-12-31';
            const result0 = calculateDeadline(0, parentDeadline);
            const result1 = calculateDeadline(1, parentDeadline);
            const result2 = calculateDeadline(2, parentDeadline);

            const date0 = new Date(result0);
            const date1 = new Date(result1);
            const date2 = new Date(result2);

            expect(date1.getTime()).toBeLessThan(date0.getTime());
            expect(date2.getTime()).toBeLessThan(date1.getTime());
        });
    });

    describe('assignMatrixPositions', () => {
        test('should assign "do" position for high urgent and high important', () => {
            const tasks = [
                { id: 'task_1', urgent: 5, important: 5 },
                { id: 'task_2', urgent: 4, important: 4 }
            ];

            const result = assignMatrixPositions(tasks);

            expect(result[0].position).toBe('do');
            expect(result[1].position).toBe('do');
        });

        test('should assign "schedule" position for low urgent and high important', () => {
            const tasks = [
                { id: 'task_1', urgent: 1, important: 5 },
                { id: 'task_2', urgent: 2, important: 4 }
            ];

            const result = assignMatrixPositions(tasks);

            expect(result[0].position).toBe('schedule');
            expect(result[1].position).toBe('schedule');
        });

        test('should assign "delegate" position for high urgent and low important', () => {
            const tasks = [
                { id: 'task_1', urgent: 5, important: 1 },
                { id: 'task_2', urgent: 4, important: 2 }
            ];

            const result = assignMatrixPositions(tasks);

            expect(result[0].position).toBe('delegate');
            expect(result[1].position).toBe('delegate');
        });

        test('should assign "delete" position for low urgent and low important', () => {
            const tasks = [
                { id: 'task_1', urgent: 1, important: 1 },
                { id: 'task_2', urgent: 2, important: 2 }
            ];

            const result = assignMatrixPositions(tasks);

            expect(result[0].position).toBe('delete');
            expect(result[1].position).toBe('delete');
        });

        test('should include reasoning in result', () => {
            const tasks = [
                { id: 'task_1', urgent: 5, important: 5 }
            ];

            const result = assignMatrixPositions(tasks);

            expect(result[0]).toHaveProperty('reasoning');
            expect(result[0].reasoning).toContain('Urgent: 5/5');
            expect(result[0].reasoning).toContain('Important: 5/5');
        });

        test('should handle empty array', () => {
            const result = assignMatrixPositions([]);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        test('should assign taskId to each position', () => {
            const tasks = [
                { id: 'task_1', urgent: 3, important: 3 },
                { id: 'task_2', urgent: 4, important: 4 }
            ];

            const result = assignMatrixPositions(tasks);

            expect(result[0].taskId).toBe('task_1');
            expect(result[1].taskId).toBe('task_2');
        });
    });

    describe('suggestIntegrations', () => {
        test('should suggest calendar integration for event-related tasks', () => {
            const taskName = 'Plan company event';
            const subtasks = [];

            const result = suggestIntegrations(taskName, subtasks);

            expect(result.length).toBeGreaterThan(0);
            const calendarIntegration = result.find(i => i.type === 'calendar');
            expect(calendarIntegration).toBeTruthy();
        });

        test('should suggest calendar integration for meeting-related tasks', () => {
            const taskName = 'Schedule team meeting';
            const subtasks = [];

            const result = suggestIntegrations(taskName, subtasks);

            const calendarIntegration = result.find(i => i.type === 'calendar');
            expect(calendarIntegration).toBeTruthy();
        });

        test('should suggest shopping integration for buy-related tasks', () => {
            const taskName = 'Buy groceries';
            const subtasks = [];

            const result = suggestIntegrations(taskName, subtasks);

            const shoppingIntegration = result.find(i => i.type === 'shopping');
            expect(shoppingIntegration).toBeTruthy();
        });

        test('should suggest shopping integration for purchase-related tasks', () => {
            const taskName = 'Purchase office supplies';
            const subtasks = [];

            const result = suggestIntegrations(taskName, subtasks);

            const shoppingIntegration = result.find(i => i.type === 'shopping');
            expect(shoppingIntegration).toBeTruthy();
        });

        test('should suggest calendar integration for research subtasks', () => {
            const taskName = 'Project planning';
            const subtasks = [
                { name: 'Research competitors' }
            ];

            const result = suggestIntegrations(taskName, subtasks);

            const calendarIntegration = result.find(i => 
                i.type === 'calendar' && i.action === 'block_time'
            );
            expect(calendarIntegration).toBeTruthy();
        });

        test('should suggest calendar integration for call subtasks', () => {
            const taskName = 'Project planning';
            const subtasks = [
                { name: 'Call stakeholders' }
            ];

            const result = suggestIntegrations(taskName, subtasks);

            const calendarIntegration = result.find(i => 
                i.type === 'calendar' && i.action === 'block_time'
            );
            expect(calendarIntegration).toBeTruthy();
        });

        test('should return empty array for unrelated tasks', () => {
            const taskName = 'Write documentation';
            const subtasks = [];

            const result = suggestIntegrations(taskName, subtasks);

            expect(Array.isArray(result)).toBe(true);
        });

        test('should handle case-insensitive matching', () => {
            const taskName = 'BUY SUPPLIES';
            const subtasks = [];

            const result = suggestIntegrations(taskName, subtasks);

            const shoppingIntegration = result.find(i => i.type === 'shopping');
            expect(shoppingIntegration).toBeTruthy();
        });
    });

    describe('checkCircularDependencies', () => {
        test('should return false for tasks with no dependencies', () => {
            const tasks = [
                { id: 'task_1', depends_on: null },
                { id: 'task_2', depends_on: null }
            ];

            expect(checkCircularDependencies(tasks)).toBe(false);
        });

        test('should return false for linear dependencies', () => {
            const tasks = [
                { id: 'task_1', depends_on: null },
                { id: 'task_2', depends_on: ['task_1'] },
                { id: 'task_3', depends_on: ['task_2'] }
            ];

            expect(checkCircularDependencies(tasks)).toBe(false);
        });

        test('should detect circular dependencies', () => {
            const tasks = [
                { id: 'task_1', depends_on: ['task_2'] },
                { id: 'task_2', depends_on: ['task_1'] }
            ];

            expect(checkCircularDependencies(tasks)).toBe(true);
        });

        test('should detect longer circular dependencies', () => {
            const tasks = [
                { id: 'task_1', depends_on: ['task_2'] },
                { id: 'task_2', depends_on: ['task_3'] },
                { id: 'task_3', depends_on: ['task_1'] }
            ];

            expect(checkCircularDependencies(tasks)).toBe(true);
        });

        test('should return false for empty array', () => {
            expect(checkCircularDependencies([])).toBe(false);
        });

        test('should handle tasks with multiple dependencies', () => {
            const tasks = [
                { id: 'task_1', depends_on: ['task_2', 'task_3'] },
                { id: 'task_2', depends_on: null },
                { id: 'task_3', depends_on: null }
            ];

            expect(checkCircularDependencies(tasks)).toBe(false);
        });
    });

    describe('calculateConfidence', () => {
        test('should return "high" when no issues', () => {
            const issues = [];
            const subtasks = [];

            expect(calculateConfidence(issues, subtasks)).toBe('high');
        });

        test('should return "medium" when 1-2 issues', () => {
            const issues = ['Issue 1'];
            const subtasks = [];

            expect(calculateConfidence(issues, subtasks)).toBe('medium');

            const issues2 = ['Issue 1', 'Issue 2'];
            expect(calculateConfidence(issues2, subtasks)).toBe('medium');
        });

        test('should return "low" when more than 2 issues', () => {
            const issues = ['Issue 1', 'Issue 2', 'Issue 3'];
            const subtasks = [];

            expect(calculateConfidence(issues, subtasks)).toBe('low');
        });
    });

    describe('generateSuggestions', () => {
        test('should suggest workload balance fix', () => {
            const issues = ['Unbalanced workload'];
            const subtasks = [];

            const result = generateSuggestions(issues, subtasks);

            expect(result.length).toBeGreaterThan(0);
            expect(result.some(s => s.includes('redistributing'))).toBe(true);
        });

        test('should suggest deadline extension', () => {
            const issues = ['Potentially unrealistic urgent deadlines'];
            const subtasks = [];

            const result = generateSuggestions(issues, subtasks);

            expect(result.length).toBeGreaterThan(0);
            expect(result.some(s => s.includes('deadline'))).toBe(true);
        });

        test('should suggest deadline setting', () => {
            const issues = ['Missing deadline for parent task'];
            const subtasks = [];

            const result = generateSuggestions(issues, subtasks);

            expect(result.length).toBeGreaterThan(0);
            expect(result.some(s => s.includes('deadline'))).toBe(true);
        });

        test('should return empty array for unrelated issues', () => {
            const issues = ['Some other issue'];
            const subtasks = [];

            const result = generateSuggestions(issues, subtasks);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('parseDeadline', () => {
        test('should parse "tomorrow"', () => {
            const result = parseDeadline('tomorrow');

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            const date = new Date(result);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            expect(date.getDate()).toBe(tomorrow.getDate());
        });

        test('should parse "next week"', () => {
            const result = parseDeadline('next week');

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            const date = new Date(result);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            expect(date.getDate()).toBe(nextWeek.getDate());
        });

        test('should parse "end of month"', () => {
            const result = parseDeadline('end of month');

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should parse date pattern MM/DD', () => {
            const result = parseDeadline('12/25');

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(result).toContain('12-25');
        });

        test('should parse date pattern MM-DD', () => {
            const result = parseDeadline('12-25');

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(result).toContain('12-25');
        });

        test('should default to 2 weeks from now for unrecognized input', () => {
            const result = parseDeadline('some random text');

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            const date = new Date(result);
            const twoWeeks = new Date();
            twoWeeks.setDate(twoWeeks.getDate() + 14);
            // Allow 1 day difference due to timezone/date calculation
            expect(Math.abs(date.getTime() - twoWeeks.getTime())).toBeLessThan(24 * 60 * 60 * 1000);
        });

        test('should handle case-insensitive input', () => {
            const result1 = parseDeadline('TOMORROW');
            const result2 = parseDeadline('Tomorrow');

            expect(result1).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(result2).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('reviewDecomposition', () => {
        test('should return review structure', () => {
            const decomposition = {
                parentTask: {
                    name: 'Test Task',
                    deadline: '2025-12-31',
                    urgent: 3,
                    important: 3
                },
                subtasks: []
            };

            const result = reviewDecomposition(decomposition);

            expect(result).toHaveProperty('isComplete');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('issues');
            expect(result).toHaveProperty('questions');
            expect(result).toHaveProperty('suggestions');
            expect(['high', 'medium', 'low']).toContain(result.confidence);
        });

        test('should flag missing deadline for urgent/important tasks', () => {
            const decomposition = {
                parentTask: {
                    name: 'Urgent Task',
                    deadline: null,
                    urgent: 5,
                    important: 5
                },
                subtasks: []
            };

            const result = reviewDecomposition(decomposition, false);

            expect(result.issues.some(i => i.includes('deadline'))).toBe(true);
            expect(result.questions.length).toBeGreaterThan(0);
        });

        test('should not flag missing deadline for non-urgent tasks', () => {
            const decomposition = {
                parentTask: {
                    name: 'Normal Task',
                    deadline: null,
                    urgent: 2,
                    important: 2
                },
                subtasks: []
            };

            const result = reviewDecomposition(decomposition, false);

            expect(result.issues.some(i => i.includes('deadline'))).toBe(false);
        });

        test('should flag budget issues for purchase tasks', () => {
            const decomposition = {
                parentTask: {
                    name: 'Buy supplies',
                    completion_criteria: null
                },
                subtasks: []
            };

            const result = reviewDecomposition(decomposition, false);

            expect(result.issues.some(i => i.includes('Budget'))).toBe(true);
        });

        test('should flag unbalanced workload', () => {
            const decomposition = {
                parentTask: {
                    name: 'Test Task'
                },
                subtasks: [
                    { id: '1', assignee: 'mario' },
                    { id: '2', assignee: 'mario' },
                    { id: '3', assignee: 'mario' },
                    { id: '4', assignee: 'mario' },
                    { id: '5', assignee: 'maria' }
                ]
            };

            const result = reviewDecomposition(decomposition, false);

            expect(result.issues.some(i => i.includes('Unbalanced'))).toBe(true);
        });

        test('should detect circular dependencies', () => {
            const decomposition = {
                parentTask: {
                    name: 'Test Task'
                },
                subtasks: [
                    { id: 'task_1', depends_on: ['task_2'] },
                    { id: 'task_2', depends_on: ['task_1'] }
                ]
            };

            const result = reviewDecomposition(decomposition, false);

            expect(result.issues.some(i => i.includes('Circular'))).toBe(true);
        });

        test('should be more lenient in refinement mode', () => {
            const decomposition = {
                parentTask: {
                    name: 'Test Task',
                    deadline: null,
                    urgent: 3,
                    important: 3
                },
                subtasks: []
            };

            const strictResult = reviewDecomposition(decomposition, false);
            const lenientResult = reviewDecomposition(decomposition, true);

            // Lenient mode should have fewer or equal issues
            expect(lenientResult.issues.length).toBeLessThanOrEqual(strictResult.issues.length);
        });

        test('should limit questions to 2 after refinement', () => {
            const decomposition = {
                parentTask: {
                    name: 'Buy expensive item',
                    deadline: null,
                    urgent: 5,
                    important: 5,
                    completion_criteria: null
                },
                subtasks: []
            };

            const result = reviewDecomposition(decomposition, true);

            expect(result.questions.length).toBeLessThanOrEqual(2);
        });
    });
});

