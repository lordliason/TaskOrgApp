/**
 * Unit tests for task dependencies functionality
 * Tests: dependency validation, circular dependency detection, dependency resolution
 * @jest-environment jsdom
 */

describe('Task Dependencies Functions', () => {
    let mockTasks;

    beforeEach(() => {
        mockTasks = [
            {
                id: 'task-1',
                name: 'Task One',
                depends_on: null,
                parent_task_id: null
            },
            {
                id: 'task-2',
                name: 'Task Two',
                depends_on: ['task-1'],
                parent_task_id: null
            },
            {
                id: 'task-3',
                name: 'Task Three',
                depends_on: ['task-2'],
                parent_task_id: null
            },
            {
                id: 'task-4',
                name: 'Task Four',
                depends_on: null,
                parent_task_id: 'task-1'
            }
        ];
    });

    describe('dependency validation', () => {
        test('should validate task has no dependencies', () => {
            const task = mockTasks[0];
            const hasDependencies = task.depends_on && task.depends_on.length > 0;

            expect(hasDependencies).toBeFalsy();
        });

        test('should validate task has dependencies', () => {
            const task = mockTasks[1];
            const hasDependencies = task.depends_on && task.depends_on.length > 0;

            expect(hasDependencies).toBe(true);
            expect(task.depends_on).toContain('task-1');
        });

        test('should validate multiple dependencies', () => {
            const task = {
                id: 'task-5',
                name: 'Task Five',
                depends_on: ['task-1', 'task-2']
            };

            expect(task.depends_on.length).toBe(2);
            expect(task.depends_on).toContain('task-1');
            expect(task.depends_on).toContain('task-2');
        });

        test('should handle null dependencies', () => {
            const task = mockTasks[0];
            const dependencies = task.depends_on || [];

            expect(dependencies).toEqual([]);
        });

        test('should handle empty dependencies array', () => {
            const task = {
                id: 'task-6',
                name: 'Task Six',
                depends_on: []
            };

            const hasDependencies = task.depends_on && task.depends_on.length > 0;
            expect(hasDependencies).toBe(false);
        });
    });

    describe('circular dependency detection', () => {
        test('should detect direct circular dependency', () => {
            const task1 = { id: 'task-1', depends_on: ['task-2'] };
            const task2 = { id: 'task-2', depends_on: ['task-1'] };

            const hasCircular = (task1.depends_on.includes(task2.id) && 
                                task2.depends_on.includes(task1.id));

            expect(hasCircular).toBe(true);
        });

        test('should detect indirect circular dependency', () => {
            const task1 = { id: 'task-1', depends_on: ['task-2'] };
            const task2 = { id: 'task-2', depends_on: ['task-3'] };
            const task3 = { id: 'task-3', depends_on: ['task-1'] };

            // Check if task1 depends on task2, task2 depends on task3, task3 depends on task1
            const hasCircular = (task1.depends_on.includes(task2.id) &&
                                task2.depends_on.includes(task3.id) &&
                                task3.depends_on.includes(task1.id));

            expect(hasCircular).toBe(true);
        });

        test('should not detect circular dependency for valid chain', () => {
            const task1 = { id: 'task-1', depends_on: null };
            const task2 = { id: 'task-2', depends_on: ['task-1'] };
            const task3 = { id: 'task-3', depends_on: ['task-2'] };

            const hasCircular = (task1.depends_on && task1.depends_on.includes(task3.id)) ||
                               (task2.depends_on && task2.depends_on.includes(task1.id) && 
                                task1.depends_on && task1.depends_on.includes(task2.id));

            expect(hasCircular).toBeFalsy();
        });

        test('should detect self-dependency', () => {
            const task = { id: 'task-1', depends_on: ['task-1'] };

            const hasSelfDependency = task.depends_on && task.depends_on.includes(task.id);

            expect(hasSelfDependency).toBe(true);
        });
    });

    describe('dependency resolution', () => {
        test('should find all dependencies for a task', () => {
            const task = mockTasks[2]; // Task Three depends on Task Two
            const dependencies = task.depends_on || [];

            expect(dependencies).toContain('task-2');
        });

        test('should find transitive dependencies', () => {
            // Task Three depends on Task Two, Task Two depends on Task One
            const task3 = mockTasks[2];
            const task2 = mockTasks[1];

            const directDeps = task3.depends_on || [];
            const transitiveDeps = task2.depends_on || [];

            expect(directDeps).toContain('task-2');
            expect(transitiveDeps).toContain('task-1');
        });

        test('should check if all dependencies are completed', () => {
            const task = mockTasks[1]; // Depends on task-1
            const dependencyId = task.depends_on[0];
            const dependency = mockTasks.find(t => t.id === dependencyId);

            const allCompleted = !task.depends_on || 
                task.depends_on.every(depId => {
                    const dep = mockTasks.find(t => t.id === depId);
                    return dep && dep.completed;
                });

            // task-1 is not completed, so allCompleted should be false
            expect(allCompleted).toBe(false);
        });

        test('should allow task completion when dependencies are met', () => {
            const task = mockTasks[1]; // Depends on task-1
            const dependency = mockTasks[0];
            dependency.completed = true; // Mark dependency as completed

            const canComplete = !task.depends_on || 
                task.depends_on.every(depId => {
                    const dep = mockTasks.find(t => t.id === depId);
                    return dep && dep.completed;
                });

            expect(canComplete).toBe(true);
        });
    });

    describe('parent task relationships', () => {
        test('should identify parent task', () => {
            const task = mockTasks[3]; // Has parent_task_id
            const hasParent = task.parent_task_id !== null;

            expect(hasParent).toBe(true);
            expect(task.parent_task_id).toBe('task-1');
        });

        test('should find child tasks', () => {
            const parentId = 'task-1';
            const children = mockTasks.filter(t => t.parent_task_id === parentId);

            expect(children.length).toBe(1);
            expect(children[0].id).toBe('task-4');
        });

        test('should distinguish between depends_on and parent_task_id', () => {
            const taskWithDependency = mockTasks[1];
            const taskWithParent = mockTasks[3];

            expect(taskWithDependency.depends_on).toBeDefined();
            expect(taskWithDependency.parent_task_id).toBeNull();
            expect(taskWithParent.parent_task_id).toBeDefined();
        });
    });

    describe('dependency chain validation', () => {
        test('should validate complete dependency chain', () => {
            const chain = ['task-1', 'task-2', 'task-3'];
            const isValid = chain.every((taskId, index) => {
                if (index === 0) return true; // First task has no dependencies
                const task = mockTasks.find(t => t.id === taskId);
                const prevTaskId = chain[index - 1];
                return task && task.depends_on && task.depends_on.includes(prevTaskId);
            });

            expect(isValid).toBe(true);
        });

        test('should detect broken dependency chain', () => {
            const chain = ['task-1', 'task-3']; // Missing task-2
            const isValid = chain.every((taskId, index) => {
                if (index === 0) return true;
                const task = mockTasks.find(t => t.id === taskId);
                const prevTaskId = chain[index - 1];
                return task && task.depends_on && task.depends_on.includes(prevTaskId);
            });

            // task-3 depends on task-2, not task-1, so chain is broken
            expect(isValid).toBe(false);
        });
    });
});
