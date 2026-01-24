/**
 * Unit tests for task assignee assignment when editing tasks
 * Tests the fix for assignee not working when editing tasks
 * 
 * Note: The backend validation accepts 'mario', 'maria', 'both' for updates.
 * The frontend converts legacy values and sends user IDs or 'all' directly to Supabase.
 */

const { updateTask } = require('../api/lib/tasks/crud');

describe('Task Assignee Assignment on Edit', () => {
    describe('updateTask - assignee field', () => {
        test('should update assignee to "mario"', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'mario'
            };

            const result = updateTask(taskId, updates);

            expect(result).toHaveProperty('taskId', taskId);
            expect(result.updates).toHaveProperty('assignee', 'mario');
        });

        test('should update assignee to "maria"', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'maria'
            };

            const result = updateTask(taskId, updates);

            expect(result).toHaveProperty('taskId', taskId);
            expect(result.updates).toHaveProperty('assignee', 'maria');
        });

        test('should update assignee to "both"', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'both'
            };

            const result = updateTask(taskId, updates);

            expect(result).toHaveProperty('taskId', taskId);
            expect(result.updates).toHaveProperty('assignee', 'both');
        });

        test('should preserve assignee when not included in updates', () => {
            const taskId = 'task_123';
            const updates = {
                name: 'Updated Task Name',
                urgent: 5
            };

            const result = updateTask(taskId, updates);

            expect(result).toHaveProperty('taskId', taskId);
            expect(result.updates).not.toHaveProperty('assignee');
            expect(result.updates.name).toBe('Updated Task Name');
            expect(result.updates.urgent).toBe(5);
        });

        test('should update assignee along with other fields', () => {
            const taskId = 'task_123';
            const updates = {
                name: 'Updated Task',
                assignee: 'mario',
                size: 'l',
                urgent: 4,
                important: 5
            };

            const result = updateTask(taskId, updates);

            expect(result.updates.name).toBe('Updated Task');
            expect(result.updates.assignee).toBe('mario');
            expect(result.updates.size).toBe('l');
            expect(result.updates.urgent).toBe(4);
            expect(result.updates.important).toBe(5);
        });

        test('should throw error for invalid assignee', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'invalid-assignee'
            };

            expect(() => updateTask(taskId, updates)).toThrow('Assignee must be one of: mario, maria, both');
        });
    });

    describe('Legacy assignee value handling', () => {
        test('should accept legacy "both" value', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'both'
            };

            const result = updateTask(taskId, updates);
            expect(result.updates.assignee).toBe('both');
        });

        test('should accept legacy "mario" value', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'mario'
            };

            const result = updateTask(taskId, updates);
            expect(result.updates.assignee).toBe('mario');
        });

        test('should accept legacy "maria" value', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'maria'
            };

            const result = updateTask(taskId, updates);
            expect(result.updates.assignee).toBe('maria');
        });
    });

    describe('Assignee assignment edge cases', () => {
        test('should handle undefined assignee gracefully', () => {
            const taskId = 'task_123';
            const updates = {
                name: 'Test Task',
                assignee: undefined
            };

            const result = updateTask(taskId, updates);
            // assignee should not be in updates if undefined
            expect(result.updates).not.toHaveProperty('assignee');
            expect(result.updates.name).toBe('Test Task');
        });

        test('should allow updating only assignee field', () => {
            const taskId = 'task_123';
            const updates = {
                assignee: 'both'
            };

            const result = updateTask(taskId, updates);
            expect(result.updates).toHaveProperty('assignee', 'both');
            expect(Object.keys(result.updates).length).toBe(1);
        });

        test('should update assignee multiple times correctly', () => {
            const taskId = 'task_123';
            
            // First update to mario
            let updates = { assignee: 'mario' };
            let result = updateTask(taskId, updates);
            expect(result.updates.assignee).toBe('mario');

            // Then update to maria
            updates = { assignee: 'maria' };
            result = updateTask(taskId, updates);
            expect(result.updates.assignee).toBe('maria');

            // Then update to both
            updates = { assignee: 'both' };
            result = updateTask(taskId, updates);
            expect(result.updates.assignee).toBe('both');
        });
    });
});
