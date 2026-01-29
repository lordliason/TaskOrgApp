/**
 * Database test setup and utilities
 * Handles test database initialization and cleanup
 */

const { createClient } = require('@supabase/supabase-js');

// Test database configuration
const TEST_DB_CONFIG = {
  url: process.env.TEST_SUPABASE_URL || 'https://test.supabase.co',
  anonKey: process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key',
  serviceRoleKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
};

// Test database client
let testClient = null;

/**
 * Initialize test database connection
 */
function initTestDb() {
  if (!testClient) {
    testClient = createClient(TEST_DB_CONFIG.url, TEST_DB_CONFIG.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return testClient;
}

/**
 * Clean up test database between tests
 */
async function cleanupTestDb() {
  if (!testClient) return;

  try {
    // Delete test data from all tables
    const tables = ['tasks', 'organizations', 'users'];

    for (const table of tables) {
      await testClient.from(table).delete().neq('id', 'non-existent-id');
    }

    console.log('Test database cleaned up');
  } catch (error) {
    console.warn('Failed to cleanup test database:', error.message);
  }
}

/**
 * Seed test database with initial data
 */
async function seedTestDb() {
  if (!testClient) return;

  try {
    // Create test organization
    const { data: org } = await testClient
      .from('organizations')
      .insert({
        id: 'test_org_123',
        name: 'Test Organization',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Create test users
    const testUsers = [
      { id: 'test_user_mario', name: 'Mario', email: 'mario@test.com' },
      { id: 'test_user_maria', name: 'Maria', email: 'maria@test.com' }
    ];

    for (const user of testUsers) {
      await testClient.from('users').insert({
        ...user,
        organization_id: org.id,
        created_at: new Date().toISOString()
      });
    }

    console.log('Test database seeded');
    return { org, users: testUsers };
  } catch (error) {
    console.warn('Failed to seed test database:', error.message);
    throw error;
  }
}

/**
 * Create test tasks for database testing
 */
async function createTestTasks(organizationId, count = 5) {
  if (!testClient) return [];

  const tasks = [];
  for (let i = 0; i < count; i++) {
    const task = {
      name: `Test Task ${i + 1}`,
      assignee: i % 2 === 0 ? 'mario' : 'maria',
      size: ['xs', 's', 'm', 'l', 'xl'][i % 5],
      urgent: Math.floor(Math.random() * 5) + 1,
      important: Math.floor(Math.random() * 5) + 1,
      completed: i % 3 === 0, // Every third task is completed
      organization_id: organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data } = await testClient
      .from('tasks')
      .insert(task)
      .select()
      .single();

    tasks.push(data);
  }

  return tasks;
}

/**
 * Create test task hierarchy with dependencies
 */
async function createTestTaskHierarchy(organizationId) {
  if (!testClient) return {};

  // Create parent task
  const { data: parentTask } = await testClient
    .from('tasks')
    .insert({
      name: 'Parent Task',
      assignee: 'both',
      size: 'xl',
      urgent: 3,
      important: 4,
      completed: false,
      organization_id: organizationId
    })
    .select()
    .single();

  // Create subtasks with dependencies
  const subtasks = [];
  const subtaskData = [
    { name: 'Planning Phase', assignee: 'mario', depends_on: null },
    { name: 'Implementation', assignee: 'maria', depends_on: 'subtask_1' },
    { name: 'Testing', assignee: 'both', depends_on: 'subtask_2' },
    { name: 'Deployment', assignee: 'mario', depends_on: 'subtask_3' }
  ];

  for (let i = 0; i < subtaskData.length; i++) {
    const { data: subtask } = await testClient
      .from('tasks')
      .insert({
        name: subtaskData[i].name,
        assignee: subtaskData[i].assignee,
        size: 'm',
        urgent: 3,
        important: 3,
        completed: false,
        parent_task_id: parentTask.id,
        depends_on: subtaskData[i].depends_on ? [subtaskData[i].depends_on] : null,
        organization_id: organizationId
      })
      .select()
      .single();

    subtasks.push(subtask);
  }

  return { parentTask, subtasks };
}

/**
 * Mock database for unit testing (when real DB not available)
 */
function createMockDatabase() {
  const mockData = {
    tasks: [],
    organizations: [],
    users: []
  };

  const mockClient = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockData[table][0] || null, error: null }),
          order: () => ({
            limit: () => Promise.resolve({ data: mockData[table], error: null })
          })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: mockData[table], error: null })
        })
      }),
      insert: (data) => {
        const newItem = { ...data, id: `mock_${Date.now()}`, created_at: new Date().toISOString() };
        mockData[table].push(newItem);
        return Promise.resolve({ data: newItem, error: null });
      },
      update: () => ({
        eq: () => Promise.resolve({ data: mockData[table][0] || null, error: null })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    })
  };

  return { client: mockClient, data: mockData };
}

module.exports = {
  initTestDb,
  cleanupTestDb,
  seedTestDb,
  createTestTasks,
  createTestTaskHierarchy,
  createMockDatabase,
  TEST_DB_CONFIG
};