/**
 * Unit tests for task decomposition functions
 * Tests: decomposeTask, refineDecomposition, finalizeDecomposition
 */

const {
    decomposeTask,
    refineDecomposition,
    finalizeDecomposition
} = require('../api/chat');

describe('Task Decomposition Functions', () => {
    describe('decomposeTask', () => {
        test('should decompose a task with required name', () => {
            const taskDescription = {
                name: 'Plan vacation'
            };

            const result = decomposeTask(taskDescription);

            expect(result).toHaveProperty('parentTask');
            expect(result).toHaveProperty('subtasks');
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('matrix_positions');
            expect(result).toHaveProperty('integrations');
            expect(result.parentTask.name).toBe('Plan vacation');
            expect(Array.isArray(result.subtasks)).toBe(true);
            expect(result.subtasks.length).toBeGreaterThanOrEqual(3);
            expect(result.subtasks.length).toBeLessThanOrEqual(6);
        });

        test('should throw error when name is missing', () => {
            const taskDescription = {};

            expect(() => decomposeTask(taskDescription)).toThrow('Task name is required for decomposition');
            expect(() => decomposeTask(null)).toThrow('Task name is required for decomposition');
        });

        test('should use default values for optional fields', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result = decomposeTask(taskDescription);

            expect(result.parentTask.assignee).toBe('both');
            expect(result.parentTask.size).toBe('xl');
            expect(result.parentTask.urgent).toBe(3);
            expect(result.parentTask.important).toBe(3);
            expect(result.parentTask.completed).toBe(false);
        });

        test('should accept optional task properties', () => {
            const taskDescription = {
                name: 'Test Task',
                assignee: 'mario',
                urgent: 5,
                important: 4,
                deadline: '2025-12-31',
                icon: '🎯',
                firstStep: 'Start here',
                completionCriteria: 'Done when X'
            };

            const result = decomposeTask(taskDescription);

            expect(result.parentTask.assignee).toBe('mario');
            expect(result.parentTask.urgent).toBe(5);
            expect(result.parentTask.important).toBe(4);
            expect(result.parentTask.deadline).toBe('2025-12-31');
            expect(result.parentTask.icon).toBe('🎯');
            expect(result.parentTask.first_step).toBe('Start here');
            expect(result.parentTask.completion_criteria).toBe('Done when X');
        });

        test('should generate unique parent task ID', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result1 = decomposeTask(taskDescription);
            const result2 = decomposeTask(taskDescription);

            expect(result1.parentTask.id).not.toBe(result2.parentTask.id);
        });

        test('should create subtasks with proper structure', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result = decomposeTask(taskDescription);

            result.subtasks.forEach(subtask => {
                expect(subtask).toHaveProperty('id');
                expect(subtask).toHaveProperty('name');
                expect(subtask).toHaveProperty('assignee');
                expect(subtask).toHaveProperty('size');
                expect(subtask).toHaveProperty('urgent');
                expect(subtask).toHaveProperty('important');
                expect(subtask).toHaveProperty('completed', false);
                expect(['mario', 'maria', 'both']).toContain(subtask.assignee);
                expect(['s', 'm', 'l']).toContain(subtask.size);
            });
        });

        test('should link subtasks to parent task', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result = decomposeTask(taskDescription);

            result.subtasks.forEach(subtask => {
                expect(subtask.parent_task_id).toBe(result.parentTask.id);
            });
        });

        test('should create dependencies between subtasks', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result = decomposeTask(taskDescription);

            // First subtask should have no dependencies
            expect(result.subtasks[0].depends_on).toBeNull();

            // Subsequent subtasks should depend on previous ones
            for (let i = 1; i < result.subtasks.length; i++) {
                expect(result.subtasks[i].depends_on).toBeTruthy();
                expect(Array.isArray(result.subtasks[i].depends_on)).toBe(true);
            }
        });

        test('should calculate deadlines for subtasks when parent deadline exists', () => {
            const taskDescription = {
                name: 'Test Task',
                deadline: '2025-12-31'
            };

            const result = decomposeTask(taskDescription);

            result.subtasks.forEach(subtask => {
                if (subtask.deadline) {
                    expect(subtask.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                }
            });
        });

        test('should assign matrix positions to subtasks', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result = decomposeTask(taskDescription);

            expect(result.matrix_positions).toHaveLength(result.subtasks.length);
            result.matrix_positions.forEach(position => {
                expect(position).toHaveProperty('taskId');
                expect(position).toHaveProperty('position');
                expect(position).toHaveProperty('reasoning');
                expect(['do', 'schedule', 'delegate', 'delete']).toContain(position.position);
            });
        });

        test('should suggest integrations', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result = decomposeTask(taskDescription);

            expect(Array.isArray(result.integrations)).toBe(true);
        });

        test('should accept organizationId parameter', () => {
            const taskDescription = {
                name: 'Test Task'
            };

            const result = decomposeTask(taskDescription, 'org_123');

            expect(result.parentTask.organization_id).toBe('org_123');
            result.subtasks.forEach(subtask => {
                expect(subtask.organization_id).toBe('org_123');
            });
        });
    });

    describe('refineDecomposition', () => {
        test('should refine decomposition with user answers', () => {
            const originalDecomposition = {
                parentTask: {
                    name: 'Test Task',
                    assignee: 'both',
                    size: 'xl',
                    urgent: 3,
                    important: 3,
                    deadline: null
                },
                subtasks: [
                    {
                        id: 'subtask_1',
                        name: 'Subtask 1',
                        assignee: 'mario',
                        urgent: 3,
                        important: 3
                    },
                    {
                        id: 'subtask_2',
                        name: 'Subtask 2',
                        assignee: 'maria',
                        urgent: 3,
                        important: 3
                    }
                ]
            };

            const userAnswers = [
                {
                    question: 'What\'s the overall deadline for this task?',
                    response: 'next week'
                }
            ];

            const result = refineDecomposition(originalDecomposition, userAnswers);

            expect(result).toHaveProperty('parentTask');
            expect(result).toHaveProperty('subtasks');
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('matrix_positions');
            expect(result).toHaveProperty('integrations');
            expect(result.parentTask.deadline).toBeTruthy();
        });

        test('should handle deadline answers', () => {
            const originalDecomposition = {
                parentTask: {
                    name: 'Test Task',
                    deadline: null
                },
                subtasks: []
            };

            const userAnswers = [
                {
                    question: 'What\'s the overall deadline?',
                    response: 'tomorrow'
                }
            ];

            const result = refineDecomposition(originalDecomposition, userAnswers);

            expect(result.parentTask.deadline).toBeTruthy();
            expect(result.parentTask.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('should handle budget answers', () => {
            const originalDecomposition = {
                parentTask: {
                    name: 'Buy supplies',
                    completion_criteria: null
                },
                subtasks: []
            };

            const userAnswers = [
                {
                    question: 'What\'s your budget?',
                    response: '$500'
                }
            ];

            const result = refineDecomposition(originalDecomposition, userAnswers);

            expect(result.parentTask.completion_criteria).toContain('Budget:');
        });

        test('should handle workload balance answers', () => {
            const originalDecomposition = {
                parentTask: {
                    name: 'Test Task'
                },
                subtasks: [
                    { id: 'subtask_1', assignee: 'maria', name: 'Task 1' },
                    { id: 'subtask_2', assignee: 'maria', name: 'Task 2' },
                    { id: 'subtask_3', assignee: 'mario', name: 'Task 3' }
                ]
            };

            const userAnswers = [
                {
                    question: 'Would you prefer to balance the workload?',
                    response: 'more mario'
                }
            ];

            const result = refineDecomposition(originalDecomposition, userAnswers);

            const marioTasks = result.subtasks.filter(t => t.assignee === 'mario').length;
            expect(marioTasks).toBeGreaterThan(1);
        });

        test('should handle first step answers', () => {
            const originalDecomposition = {
                parentTask: {
                    name: 'Test Task',
                    first_step: null
                },
                subtasks: []
            };

            const userAnswers = [
                {
                    question: 'What would be a good first step?',
                    response: 'Research options'
                }
            ];

            const result = refineDecomposition(originalDecomposition, userAnswers);

            expect(result.parentTask.first_step).toBe('Research options');
        });

        test('should recalculate deadlines when parent deadline changes', () => {
            const originalDecomposition = {
                parentTask: {
                    name: 'Test Task',
                    deadline: null
                },
                subtasks: [
                    { id: 'subtask_1', name: 'Task 1', deadline: null },
                    { id: 'subtask_2', name: 'Task 2', deadline: null }
                ]
            };

            const userAnswers = [
                {
                    question: 'What\'s the deadline?',
                    response: '2025-12-31'
                }
            ];

            const result = refineDecomposition(originalDecomposition, userAnswers);

            expect(result.parentTask.deadline).toBeTruthy();
            // Subtasks should have recalculated deadlines
            result.subtasks.forEach(subtask => {
                if (subtask.deadline) {
                    expect(subtask.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                }
            });
        });

        test('should preserve original structure when no relevant answers', () => {
            const originalDecomposition = {
                parentTask: {
                    name: 'Test Task',
                    deadline: '2025-12-31'
                },
                subtasks: [
                    { id: 'subtask_1', name: 'Task 1', assignee: 'mario' }
                ]
            };

            const userAnswers = [
                {
                    question: 'Some unrelated question?',
                    response: 'Some answer'
                }
            ];

            const result = refineDecomposition(originalDecomposition, userAnswers);

            expect(result.parentTask.name).toBe('Test Task');
            expect(result.subtasks).toHaveLength(1);
            expect(result.subtasks[0].name).toBe('Task 1');
        });
    });

    describe('finalizeDecomposition', () => {
        test('should finalize decomposition with summary', () => {
            const decomposition = {
                parentTask: {
                    id: 'parent_1',
                    name: 'Test Task',
                    assignee: 'both'
                },
                subtasks: [
                    { id: 'subtask_1', assignee: 'mario', deadline: '2025-12-31', depends_on: null },
                    { id: 'subtask_2', assignee: 'maria', deadline: null, depends_on: ['subtask_1'] },
                    { id: 'subtask_3', assignee: 'both', deadline: '2025-12-30', depends_on: null }
                ]
            };

            const result = finalizeDecomposition(decomposition);

            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('parentTask');
            expect(result).toHaveProperty('subtasks');
            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('matrix_positions');
            expect(result).toHaveProperty('integrations');
            expect(result).toHaveProperty('next_steps');
            expect(result).toHaveProperty('message');
        });

        test('should calculate correct summary statistics', () => {
            const decomposition = {
                parentTask: {
                    id: 'parent_1',
                    name: 'Test Task'
                },
                subtasks: [
                    { id: 'subtask_1', assignee: 'mario', deadline: '2025-12-31', depends_on: null },
                    { id: 'subtask_2', assignee: 'maria', deadline: null, depends_on: ['subtask_1'] },
                    { id: 'subtask_3', assignee: 'mario', deadline: '2025-12-30', depends_on: null }
                ]
            };

            const result = finalizeDecomposition(decomposition);

            expect(result.summary.totalTasks).toBe(4); // 1 parent + 3 subtasks
            expect(result.summary.marioTasks).toBe(2);
            expect(result.summary.mariaTasks).toBe(1);
            expect(result.summary.bothTasks).toBe(0);
            expect(result.summary.deadlines).toBe(2);
            expect(result.summary.dependencies).toBe(1);
        });

        test('should include next steps', () => {
            const decomposition = {
                parentTask: {
                    id: 'parent_1',
                    name: 'Test Task'
                },
                subtasks: []
            };

            const result = finalizeDecomposition(decomposition);

            expect(Array.isArray(result.next_steps)).toBe(true);
            expect(result.next_steps.length).toBeGreaterThan(0);
        });

        test('should assign matrix positions to subtasks', () => {
            const decomposition = {
                parentTask: {
                    id: 'parent_1',
                    name: 'Test Task'
                },
                subtasks: [
                    { id: 'subtask_1', assignee: 'mario', urgent: 5, important: 5 },
                    { id: 'subtask_2', assignee: 'maria', urgent: 1, important: 1 }
                ]
            };

            const result = finalizeDecomposition(decomposition);

            expect(result.matrix_positions).toHaveLength(2);
            result.matrix_positions.forEach(position => {
                expect(position).toHaveProperty('taskId');
                expect(position).toHaveProperty('position');
                expect(['do', 'schedule', 'delegate', 'delete']).toContain(position.position);
            });
        });

        test('should include success message with task name', () => {
            const decomposition = {
                parentTask: {
                    id: 'parent_1',
                    name: 'My Special Task'
                },
                subtasks: [
                    { id: 'subtask_1', assignee: 'mario' }
                ]
            };

            const result = finalizeDecomposition(decomposition);

            expect(result.message).toContain('My Special Task');
            expect(result.message).toContain('successfully decomposed');
        });
    });
});

