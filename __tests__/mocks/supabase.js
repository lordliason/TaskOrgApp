/**
 * Supabase client mocks for testing
 * Provides mock implementations for database operations
 */

const mockSupabaseResponse = (data = null, error = null) => ({
  data,
  error,
  status: error ? (error.code || 400) : 200,
  statusText: error ? (error.message || 'Error') : 'OK'
});

const mockSupabaseQuery = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(mockSupabaseResponse()),
  then: jest.fn().mockResolvedValue(mockSupabaseResponse())
});

const createMockSupabaseClient = () => ({
  from: jest.fn(() => mockSupabaseQuery()),
  auth: {
    signInWithPassword: jest.fn().mockResolvedValue(mockSupabaseResponse({ user: { id: 'user_123' } })),
    signOut: jest.fn().mockResolvedValue(mockSupabaseResponse()),
    getUser: jest.fn().mockResolvedValue(mockSupabaseResponse({ user: { id: 'user_123' } })),
    getSession: jest.fn().mockResolvedValue(mockSupabaseResponse({ session: { user: { id: 'user_123' } } })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue(mockSupabaseResponse()),
      download: jest.fn().mockResolvedValue(mockSupabaseResponse()),
      remove: jest.fn().mockResolvedValue(mockSupabaseResponse()),
      list: jest.fn().mockResolvedValue(mockSupabaseResponse([]))
    }))
  }
});

// Pre-configured mock clients for different scenarios
const mockSupabaseClient = {
  success: createMockSupabaseClient(),
  error: createMockSupabaseClient(),
  empty: createMockSupabaseClient()
};

// Configure error responses
mockSupabaseClient.error.from.mockImplementation(() => ({
  ...mockSupabaseQuery(),
  single: jest.fn().mockResolvedValue(mockSupabaseResponse(null, { message: 'Database error', code: 500 }))
}));

// Configure empty responses
mockSupabaseClient.empty.from.mockImplementation(() => ({
  ...mockSupabaseQuery(),
  single: jest.fn().mockResolvedValue(mockSupabaseResponse(null))
}));

// Helper to mock specific table operations
const mockTableOperation = (tableName, operation, response) => {
  const mockClient = createMockSupabaseClient();
  const tableMock = mockSupabaseQuery();

  // Configure the specific operation
  if (operation === 'select') {
    tableMock.select.mockReturnValue({
      ...tableMock,
      single: jest.fn().mockResolvedValue(mockSupabaseResponse(response))
    });
  } else if (operation === 'insert') {
    tableMock.insert.mockReturnValue({
      ...tableMock,
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(mockSupabaseResponse(response))
      })
    });
  } else if (operation === 'update') {
    tableMock.update.mockReturnValue({
      ...tableMock,
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockSupabaseResponse(response))
        })
      })
    });
  } else if (operation === 'delete') {
    tableMock.delete.mockReturnValue({
      ...tableMock,
      eq: jest.fn().mockResolvedValue(mockSupabaseResponse(response))
    });
  }

  mockClient.from.mockImplementation((name) => {
    if (name === tableName) {
      return tableMock;
    }
    return mockSupabaseQuery();
  });

  return mockClient;
};

// Helper to create mock auth state
const mockAuthState = {
  authenticated: {
    user: { id: 'user_123', email: 'test@example.com' },
    session: { access_token: 'mock_token' }
  },
  unauthenticated: {
    user: null,
    session: null
  }
};

module.exports = {
  mockSupabaseResponse,
  mockSupabaseQuery,
  createMockSupabaseClient,
  mockSupabaseClient,
  mockTableOperation,
  mockAuthState
};