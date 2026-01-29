/**
 * Database integration tests for task CRUD operations
 * Tests actual database interactions with Supabase
 */

const {
  initTestDb,
  cleanupTestDb,
  seedTestDb,
  createTestTasks,
  createTestTaskHierarchy
} = require('./setup');

const { createTask, getTasks, updateTask, deleteTask } = require('../../api/lib/tasks/crud');

// Skip database tests if not configured
const SKIP_DB_TESTS = !process.env.TEST_SUPABASE_URL || process.env.SKIP_DB_TESTS === 'true';

describe('Task CRUD Database Integration', () => {
  let testClient;
  let testOrg;
  let testUsers;

  beforeAll(async () => {
    if (SKIP_DB_TESTS) {
      console.log('Skipping database integration tests - no test database configured');
      return;
    }

    testClient = initTestDb();
    const seedData = await seedTestDb();
    testOrg = seedData.org;
    testUsers = seedData.users;
  });

  afterAll(async () => {
    if (!SKIP_DB_TESTS) {
      await cleanupTestDb();
    }
  });

  beforeEach(async () => {
    if (SKIP_DB_TESTS) return;

    // Clean up between tests
    await cleanupTestDb();
    const seedData = await seedTestDb();
    testOrg = seedData.org;
    testUsers = seedData.users;
  });

  (SKIP_DB_TESTS ? describe.skip : describe)('Task Creation', () => {
    test('should create a task in the database', async () => {
      const taskData = {
        name: 'Database Test Task',
        assignee: 'mario',
        size: 'm',
        urgent: 3,
        important: 4,
        organization_id: testOrg.id
      };

      const result = await createTask(taskData, testOrg.id);

      expect(result).toBeValidTask();
      expect(result.name).toBe('Database Test Task');
      expect(result.assignee).toBe('mario');
      expect(result.organization_id).toBe(testOrg.id);
      expect(result.completed).toBe(false);
      expect(result.id).toBeTruthy();
      expect(result.created_at).toBeTruthy();
    });

    test('should create task with all optional fields', async () => {
      const taskData = {
        name: 'Complete Task',
        assignee: 'maria',
        size: 'l',
        urgent: 5,
        important: 4,
        icon: '🚀',
        first_step: 'Start here',
        completion_criteria: 'Done when deployed',
        deadline: '2025-12-31',
        organization_id: testOrg.id
      };

      const result = await createTask(taskData, testOrg.id);

      expect(result).toBeValidTask();
      expect(result.icon).toBe('🚀');
      expect(result.first_step).toBe('Start here');
      expect(result.completion_criteria).toBe('Done when deployed');
      expect(result.deadline).toBe('2025-12-31');
    });

    test('should validate required fields', async () => {
      await expect(createTask({}, testOrg.id)).rejects.toThrow('Task name and assignee are required');

      await expect(createTask({ name: 'Test' }, testOrg.id)).rejects.toThrow('Task name and assignee are required');

      await expect(createTask({ assignee: 'mario' }, testOrg.id)).rejects.toThrow('Task name and assignee are required');
    });

    test('should validate assignee values', async () => {
      const invalidAssignees = ['invalid', 'john', ''];

      for (const assignee of invalidAssignees) {
        await expect(createTask({
          name: 'Test',
          assignee,
          organization_id: testOrg.id
        }, testOrg.id)).rejects.toThrow('Assignee must be a valid user ID');
      }
    });

    test('should validate size values', async () => {
      const invalidSizes = ['invalid', 'medium', ''];

      for (const size of invalidSizes) {
        await expect(createTask({
          name: 'Test',
          assignee: 'mario',
          size,
          organization_id: testOrg.id
        }, testOrg.id)).rejects.toThrow('Size must be one of: xs, s, m, l, xl');
      }
    });

    test('should clamp urgent and important values', async () => {
      const result = await createTask({
        name: 'Test',
        assignee: 'mario',
        urgent: 10,
        important: -5,
        organization_id: testOrg.id
      }, testOrg.id);

      expect(result.urgent).toBe(5);
      expect(result.important).toBe(1);
    });
  });

  (SKIP_DB_TESTS ? describe.skip : describe)('Task Retrieval', () => {
    let testTasks;

    beforeEach(async () => {
      testTasks = await createTestTasks(testOrg.id, 3);
    });

    test('should retrieve all tasks for organization', async () => {
      const result = await getTasks({}, testOrg.id);

      expect(result.tasks).toBeInstanceOf(Array);
      expect(result.tasks.length).toBeGreaterThanOrEqual(3);
      expect(result.count).toBe(result.tasks.length);

      result.tasks.forEach(task => {
        expect(task).toBeValidTask();
        expect(task.organization_id).toBe(testOrg.id);
      });
    });

    test('should filter tasks by assignee', async () => {
      const result = await getTasks({ assignee: 'mario' }, testOrg.id);

      result.tasks.forEach(task => {
        expect(task.assignee).toBe('mario');
      });
    });

    test('should filter tasks by completion status', async () => {
      const result = await getTasks({ completed: true }, testOrg.id);

      result.tasks.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });

    test('should filter tasks by multiple criteria', async () => {
      const result = await getTasks({
        assignee: 'maria',
        completed: false
      }, testOrg.id);

      result.tasks.forEach(task => {
        expect(task.assignee).toBe('maria');
        expect(task.completed).toBe(false);
      });
    });

    test('should return empty array when no tasks match filters', async () => {
      const result = await getTasks({ assignee: 'nonexistent' }, testOrg.id);

      expect(result.tasks).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  (SKIP_DB_TESTS ? describe.skip : describe)('Task Updates', () => {
    let testTask;

    beforeEach(async () => {
      testTasks = await createTestTasks(testOrg.id, 1);
      testTask = testTasks[0];
    });

    test('should update task fields', async () => {
      const updates = {
        name: 'Updated Task Name',
        urgent: 4,
        important: 5,
        completed: true
      };

      const result = await updateTask(testTask.id, updates, testOrg.id);

      expect(result.taskId).toBe(testTask.id);
      expect(result.updates.name).toBe('Updated Task Name');
      expect(result.updates.urgent).toBe(4);
      expect(result.updates.important).toBe(5);
      expect(result.updates.completed).toBe(true);
    });

    test('should validate assignee on update', async () => {
      await expect(updateTask(testTask.id, { assignee: 'invalid' }, testOrg.id))
        .rejects.toThrow('Assignee must be one of: mario, maria, both');
    });

    test('should validate size on update', async () => {
      await expect(updateTask(testTask.id, { size: 'invalid' }, testOrg.id))
        .rejects.toThrow('Size must be one of: xs, s, m, l, xl');
    });

    test('should clamp priority values on update', async () => {
      const result = await updateTask(testTask.id, {
        urgent: 10,
        important: -1
      }, testOrg.id);

      expect(result.updates.urgent).toBe(5);
      expect(result.updates.important).toBe(1);
    });

    test('should handle partial updates', async () => {
      const originalName = testTask.name;
      const result = await updateTask(testTask.id, { completed: true }, testOrg.id);

      expect(result.updates.name).toBeUndefined(); // Should not include unchanged fields
      expect(result.updates.completed).toBe(true);
    });

    test('should update timestamp on modification', async () => {
      const originalUpdatedAt = testTask.updated_at;

      await new Promise(resolve => setTimeout(resolve, 100)); // Ensure time difference

      await updateTask(testTask.id, { name: 'New Name' }, testOrg.id);

      // Verify in database
      const { data: updatedTask } = await testClient
        .from('tasks')
        .select('updated_at')
        .eq('id', testTask.id)
        .single();

      expect(new Date(updatedTask.updated_at).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });
  });

  (SKIP_DB_TESTS ? describe.skip : describe)('Task Deletion', () => {
    let testTask;

    beforeEach(async () => {
      testTasks = await createTestTasks(testOrg.id, 1);
      testTask = testTasks[0];
    });

    test('should delete task from database', async () => {
      const result = await deleteTask(testTask.id, testOrg.id);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTask.id);

      // Verify task is gone
      const { data: deletedTask } = await testClient
        .from('tasks')
        .select('*')
        .eq('id', testTask.id)
        .single();

      expect(deletedTask).toBeNull();
    });

    test('should handle deletion of non-existent task', async () => {
      const result = await deleteTask('non-existent-id', testOrg.id);

      expect(result.success).toBe(true); // Should not throw error
    });
  });

  (SKIP_DB_TESTS ? describe.skip : describe)('Task Relationships', () => {
    test('should create and retrieve task hierarchy', async () => {
      const { parentTask, subtasks } = await createTestTaskHierarchy(testOrg.id);

      // Verify parent task
      expect(parentTask).toBeValidTask();
      expect(parentTask.size).toBe('xl');
      expect(parentTask.parent_task_id).toBeNull();

      // Verify subtasks
      expect(subtasks).toHaveLength(4);
      subtasks.forEach(subtask => {
        expect(subtask).toBeValidTask();
        expect(subtask.parent_task_id).toBe(parentTask.id);
      });

      // Verify dependencies
      expect(subtasks[0].depends_on).toBeNull(); // First task has no dependencies
      expect(subtasks[1].depends_on).toEqual(['subtask_1']); // Second depends on first
      expect(subtasks[2].depends_on).toEqual(['subtask_2']); // Third depends on second
      expect(subtasks[3].depends_on).toEqual(['subtask_3']); // Fourth depends on third
    });

    test('should retrieve tasks with parent-child relationships', async () => {
      await createTestTaskHierarchy(testOrg.id);

      const result = await getTasks({}, testOrg.id);

      // Should include both parent and child tasks
      expect(result.tasks.length).toBe(5); // 1 parent + 4 children

      const parentTasks = result.tasks.filter(t => !t.parent_task_id);
      const childTasks = result.tasks.filter(t => t.parent_task_id);

      expect(parentTasks).toHaveLength(1);
      expect(childTasks).toHaveLength(4);
    });

    test('should prevent circular dependencies', async () => {
      const testTasks = await createTestTasks(testOrg.id, 2);

      // Try to create circular dependency
      await expect(updateTask(testTasks[0].id, {
        depends_on: [testTasks[0].id] // Task depends on itself
      }, testOrg.id)).rejects.toThrow('Circular dependency detected');

      await expect(updateTask(testTasks[0].id, {
        depends_on: [testTasks[1].id],
        // Then try to make task 1 depend on task 0
        ...await updateTask(testTasks[1].id, {
          depends_on: [testTasks[0].id]
        }, testOrg.id)
      }, testOrg.id)).rejects.toThrow('Circular dependency detected');
    });
  });

  (SKIP_DB_TESTS ? describe.skip : describe)('Data Integrity', () => {
    test('should maintain referential integrity', async () => {
      // Create task hierarchy
      const { parentTask, subtasks } = await createTestTaskHierarchy(testOrg.id);

      // Try to delete parent task
      await deleteTask(parentTask.id, testOrg.id);

      // Child tasks should still exist but parent_task_id should be null or handled
      const { data: remainingTasks } = await testClient
        .from('tasks')
        .select('*')
        .in('id', subtasks.map(t => t.id));

      expect(remainingTasks).toHaveLength(4);
    });

    test('should handle concurrent updates', async () => {
      const testTasks = await createTestTasks(testOrg.id, 1);
      const taskId = testTasks[0].id;

      // Perform multiple concurrent updates
      const updates = [
        updateTask(taskId, { name: 'Update 1' }, testOrg.id),
        updateTask(taskId, { name: 'Update 2' }, testOrg.id),
        updateTask(taskId, { name: 'Update 3' }, testOrg.id)
      ];

      await Promise.all(updates);

      // Final state should be from the last update
      const { data: finalTask } = await testClient
        .from('tasks')
        .select('name')
        .eq('id', taskId)
        .single();

      expect(finalTask.name).toBe('Update 3');
    });
  });
});