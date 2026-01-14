/**
 * Unit tests for task management functions
 * Tests: createTask, splitTask, updateTask, getTasks
 */

const {
    createTask,
    splitTask,
    updateTask,
    getTasks
} = require('../api/chat');

describe('Task Management Functions', () => {
    describe('createTask', () => {
        test('should create a task with required fields', () => {
            const taskData = {
                name: 'Test Task',
                assignee: 'mario'
            };

            const result = createTask(taskData);

            expect(result).toHaveProperty('name', 'Test Task');
            expect(result).toHaveProperty('assignee', 'mario');
            expect(result).toHaveProperty('completed', false);
            expect(result).toHaveProperty('size', 'm'); // default
            expect(result).toHaveProperty('urgent', 3); // default
            expect(result).toHaveProperty('important', 3); // default
        });

        test('should throw error when name is missing', () => {
            const taskData = {
                assignee: 'mario'
            };

            expect(() => createTask(taskData)).toThrow('Task name and assignee are required');
        });

        test('should throw error when assignee is missing', () => {
            const taskData = {
                name: 'Test Task'
            };

            expect(() => createTask(taskData)).toThrow('Task name and assignee are required');
        });

        test('should throw error for invalid assignee', () => {
            const taskData = {
                name: 'Test Task',
                assignee: 'invalid'
            };

            expect(() => createTask(taskData)).toThrow('Assignee must be one of: mario, maria, both');
        });

        test('should accept valid assignees', () => {
            const assignees = ['mario', 'maria', 'both'];

            assignees.forEach(assignee => {
                const taskData = {
                    name: 'Test Task',
                    assignee
                };
                const result = createTask(taskData);
                expect(result.assignee).toBe(assignee);
            });
        });

        test('should throw error for invalid size', () => {
            const taskData = {
                name: 'Test Task',
                assignee: 'mario',
                size: 'invalid'
            };

            expect(() => createTask(taskData)).toThrow('Size must be one of: xs, s, m, l, xl');
        });

        test('should accept valid sizes', () => {
            const sizes = ['xs', 's', 'm', 'l', 'xl'];

            sizes.forEach(size => {
                const taskData = {
                    name: 'Test Task',
                    assignee: 'mario',
                    size
                };
                const result = createTask(taskData);
                expect(result.size).toBe(size);
            });
        });

        test('should clamp urgent value to 1-5 range', () => {
            const testCases = [
                { urgent: 0, expected: 1 },
                { urgent: 1, expected: 1 },
                { urgent: 3, expected: 3 },
                { urgent: 5, expected: 5 },
                { urgent: 10, expected: 5 },
                { urgent: -5, expected: 1 }
            ];

            testCases.forEach(({ urgent, expected }) => {
                const taskData = {
                    name: 'Test Task',
                    assignee: 'mario',
                    urgent
                };
                const result = createTask(taskData);
                expect(result.urgent).toBe(expected);
            });
        });

        test('should clamp important value to 1-5 range', () => {
            const testCases = [
                { important: 0, expected: 1 },
                { important: 1, expected: 1 },
                { important: 3, expected: 3 },
                { important: 5, expected: 5 },
                { important: 10, expected: 5 },
                { important: -5, expected: 1 }
            ];

            testCases.forEach(({ important, expected }) => {
                const taskData = {
                    name: 'Test Task',
                    assignee: 'mario',
                    important
                };
                const result = createTask(taskData);
                expect(result.important).toBe(expected);
            });
        });

        test('should handle optional fields', () => {
            const taskData = {
                name: 'Test Task',
                assignee: 'mario',
                icon: '📋',
                first_step: 'Start here',
                completion_criteria: 'Done when X'
            };

            const result = createTask(taskData);

            expect(result.icon).toBe('📋');
            expect(result.first_step).toBe('Start here');
            expect(result.completion_criteria).toBe('Done when X');
        });

        test('should set optional fields to null when not provided', () => {
            const taskData = {
                name: 'Test Task',
                assignee: 'mario'
            };

            const result = createTask(taskData);

            expect(result.icon).toBeNull();
            expect(result.first_step).toBeNull();
            expect(result.completion_criteria).toBeNull();
        });
    });

    describe('splitTask', () => {
        test('should split a task into two subtasks', () => {
            const taskId = 'task_123';
            const splitDescription = {
                part1: 'First part',
                part2: 'Second part'
            };

            const result = splitTask(taskId, splitDescription);

            expect(result).toHaveProperty('originalTaskId', taskId);
            expect(result).toHaveProperty('newTasks');
            expect(result.newTasks).toHaveLength(2);
            expect(result.newTasks[0]).toHaveProperty('name', 'First part');
            expect(result.newTasks[1]).toHaveProperty('name', 'Second part');
            expect(result).toHaveProperty('message');
        });

        test('should throw error when taskId is missing', () => {
            const splitDescription = {
                part1: 'First part',
                part2: 'Second part'
            };

            expect(() => splitTask(null, splitDescription)).toThrow('Task ID is required');
            expect(() => splitTask('', splitDescription)).toThrow('Task ID is required');
        });

        test('should throw error when part1 is missing', () => {
            const taskId = 'task_123';
            const splitDescription = {
                part2: 'Second part'
            };

            expect(() => splitTask(taskId, splitDescription)).toThrow('Split description must include both part1 and part2 task names');
        });

        test('should throw error when part2 is missing', () => {
            const taskId = 'task_123';
            const splitDescription = {
                part1: 'First part'
            };

            expect(() => splitTask(taskId, splitDescription)).toThrow('Split description must include both part1 and part2 task names');
        });

        test('should use default values for optional fields', () => {
            const taskId = 'task_123';
            const splitDescription = {
                part1: 'First part',
                part2: 'Second part'
            };

            const result = splitTask(taskId, splitDescription);

            expect(result.newTasks[0].size).toBe('m');
            expect(result.newTasks[0].urgent).toBe(3);
            expect(result.newTasks[0].important).toBe(3);
            expect(result.newTasks[0].completed).toBe(false);
            expect(result.newTasks[0].icon).toBe('📋');
        });

        test('should accept optional size values', () => {
            const taskId = 'task_123';
            const splitDescription = {
                part1: 'First part',
                part2: 'Second part',
                size1: 's',
                size2: 'l'
            };

            const result = splitTask(taskId, splitDescription);

            expect(result.newTasks[0].size).toBe('s');
            expect(result.newTasks[1].size).toBe('l');
        });

        test('should accept optional first_step and completion_criteria', () => {
            const taskId = 'task_123';
            const splitDescription = {
                part1: 'First part',
                part2: 'Second part',
                firstStep1: 'Start step 1',
                firstStep2: 'Start step 2',
                completionCriteria1: 'Done 1',
                completionCriteria2: 'Done 2'
            };

            const result = splitTask(taskId, splitDescription);

            expect(result.newTasks[0].first_step).toBe('Start step 1');
            expect(result.newTasks[1].first_step).toBe('Start step 2');
            expect(result.newTasks[0].completion_criteria).toBe('Done 1');
            expect(result.newTasks[1].completion_criteria).toBe('Done 2');
        });
    });

    describe('updateTask', () => {
        test('should update task with valid fields', () => {
            const taskId = 'task_123';
            const updates = {
                name: 'Updated Task',
                urgent: 5,
                important: 4,
                completed: true
            };

            const result = updateTask(taskId, updates);

            expect(result).toHaveProperty('taskId', taskId);
            expect(result).toHaveProperty('updates');
            expect(result.updates.name).toBe('Updated Task');
            expect(result.updates.urgent).toBe(5);
            expect(result.updates.important).toBe(4);
            expect(result.updates.completed).toBe(true);
            expect(result).toHaveProperty('message');
        });

        test('should throw error when taskId is missing', () => {
            const updates = { name: 'Updated Task' };

            expect(() => updateTask(null, updates)).toThrow('Task ID is required');
            expect(() => updateTask('', updates)).toThrow('Task ID is required');
        });

        test('should throw error for invalid assignee', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'invalid'
            };

            expect(() => updateTask(taskId, updates)).toThrow('Assignee must be one of: mario, maria, both');
        });

        test('should accept valid assignees', () => {
            const assignees = ['mario', 'maria', 'both'];

            assignees.forEach(assignee => {
                const taskId = 'task_123';
                const updates = { assignee };
                const result = updateTask(taskId, updates);
                expect(result.updates.assignee).toBe(assignee);
            });
        });

        test('should throw error for invalid size', () => {
            const taskId = 'task_123';
            const updates = {
                size: 'invalid'
            };

            expect(() => updateTask(taskId, updates)).toThrow('Size must be one of: xs, s, m, l, xl');
        });

        test('should clamp urgent value to 1-5 range', () => {
            const testCases = [
                { urgent: 0, expected: 1 },
                { urgent: 10, expected: 5 },
                { urgent: -5, expected: 1 }
            ];

            testCases.forEach(({ urgent, expected }) => {
                const taskId = 'task_123';
                const updates = { urgent };
                const result = updateTask(taskId, updates);
                expect(result.updates.urgent).toBe(expected);
            });
        });

        test('should clamp important value to 1-5 range', () => {
            const testCases = [
                { important: 0, expected: 1 },
                { important: 10, expected: 5 },
                { important: -5, expected: 1 }
            ];

            testCases.forEach(({ important, expected }) => {
                const taskId = 'task_123';
                const updates = { important };
                const result = updateTask(taskId, updates);
                expect(result.updates.important).toBe(expected);
            });
        });

        test('should convert completed to boolean', () => {
            const taskId = 'task_123';
            const updates1 = { completed: true };
            const updates2 = { completed: false };
            const updates3 = { completed: 1 };
            const updates4 = { completed: 0 };

            expect(updateTask(taskId, updates1).updates.completed).toBe(true);
            expect(updateTask(taskId, updates2).updates.completed).toBe(false);
            expect(updateTask(taskId, updates3).updates.completed).toBe(true);
            expect(updateTask(taskId, updates4).updates.completed).toBe(false);
        });

        test('should only include provided fields in updates', () => {
            const taskId = 'task_123';
            const updates = {
                name: 'Updated Task'
            };

            const result = updateTask(taskId, updates);

            expect(result.updates).toHaveProperty('name');
            expect(result.updates).not.toHaveProperty('assignee');
            expect(result.updates).not.toHaveProperty('urgent');
        });

        test('should handle all updateable fields', () => {
            const taskId = 'task_123';
            const updates = {
                name: 'New Name',
                assignee: 'maria',
                size: 'l',
                urgent: 4,
                important: 5,
                completed: true,
                icon: '🎯',
                first_step: 'First step',
                completion_criteria: 'Done criteria'
            };

            const result = updateTask(taskId, updates);

            expect(result.updates.name).toBe('New Name');
            expect(result.updates.assignee).toBe('maria');
            expect(result.updates.size).toBe('l');
            expect(result.updates.urgent).toBe(4);
            expect(result.updates.important).toBe(5);
            expect(result.updates.completed).toBe(true);
            expect(result.updates.icon).toBe('🎯');
            expect(result.updates.first_step).toBe('First step');
            expect(result.updates.completion_criteria).toBe('Done criteria');
        });
    });

    describe('getTasks', () => {
        test('should return tasks with default structure', () => {
            const result = getTasks();

            expect(result).toHaveProperty('tasks');
            expect(result).toHaveProperty('count');
            expect(result).toHaveProperty('message');
            expect(Array.isArray(result.tasks)).toBe(true);
            expect(typeof result.count).toBe('number');
        });

        test('should accept filters parameter', () => {
            const filters = { assignee: 'mario' };

            const result = getTasks(filters);

            expect(result).toHaveProperty('tasks');
            expect(result).toHaveProperty('count');
        });

        test('should accept organizationId parameter', () => {
            const result = getTasks({}, 'org_123');

            expect(result).toHaveProperty('tasks');
            expect(result).toHaveProperty('count');
        });
    });
});

