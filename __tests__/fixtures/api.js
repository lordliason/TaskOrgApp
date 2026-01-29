/**
 * Test fixtures for API-related data
 * Provides realistic API request/response data
 */

const apiFixtures = {
  // HTTP requests
  requests: {
    createTask: {
      method: 'POST',
      url: '/api/tasks',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_token'
      },
      body: {
        name: 'Test Task',
        assignee: 'mario'
      }
    },

    getTasks: {
      method: 'GET',
      url: '/api/tasks',
      headers: {
        'Authorization': 'Bearer mock_token'
      },
      query: {
        assignee: 'mario',
        completed: 'false'
      }
    },

    updateTask: {
      method: 'PUT',
      url: '/api/tasks/task_123',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_token'
      },
      body: {
        name: 'Updated Task',
        completed: true
      }
    },

    decomposeTask: {
      method: 'POST',
      url: '/api/chat',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        message: 'Can you decompose "Plan vacation"?',
        context: {
          organizationId: 'org_123'
        }
      }
    }
  },

  // HTTP responses
  responses: {
    success: {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: true,
        data: { id: 'task_123' },
        message: 'Operation successful'
      }
    },

    created: {
      status: 201,
      statusText: 'Created',
      headers: {
        'Content-Type': 'application/json',
        'Location': '/api/tasks/task_123'
      },
      body: {
        success: true,
        data: { id: 'task_123', name: 'Test Task' },
        message: 'Task created successfully'
      }
    },

    error: {
      status: 400,
      statusText: 'Bad Request',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR'
      }
    },

    unauthorized: {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }
    },

    notFound: {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND'
      }
    },

    serverError: {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }
  },

  // Chat API fixtures
  chat: {
    messages: {
      taskCreation: {
        role: 'user',
        content: 'Create a task to buy groceries'
      },

      decomposition: {
        role: 'user',
        content: 'Can you break down "Plan family vacation" into subtasks?'
      },

      update: {
        role: 'user',
        content: 'Mark the grocery task as completed'
      }
    },

    responses: {
      functionCall: {
        role: 'assistant',
        content: null,
        function_call: {
          name: 'createTask',
          arguments: JSON.stringify({
            name: 'Buy groceries',
            assignee: 'mario'
          })
        }
      },

      decomposition: {
        role: 'assistant',
        content: 'I\'ll help you decompose this task. Let me break it down into manageable subtasks.',
        function_call: {
          name: 'decomposeTask',
          arguments: JSON.stringify({
            name: 'Plan family vacation',
            assignee: 'both'
          })
        }
      }
    }
  },

  // WebSocket messages
  websocket: {
    events: {
      taskCreated: {
        type: 'task_created',
        payload: {
          task: {
            id: 'task_123',
            name: 'New Task',
            assignee: 'mario'
          }
        }
      },

      taskUpdated: {
        type: 'task_updated',
        payload: {
          taskId: 'task_123',
          updates: { completed: true },
          timestamp: '2025-01-01T00:00:00Z'
        }
      },

      userJoined: {
        type: 'user_joined',
        payload: {
          userId: 'user_456',
          organizationId: 'org_123'
        }
      }
    }
  },

  // Database operation results
  database: {
    select: {
      data: [
        { id: 'task_1', name: 'Task 1' },
        { id: 'task_2', name: 'Task 2' }
      ],
      error: null,
      count: 2
    },

    insert: {
      data: { id: 'task_123', name: 'New Task' },
      error: null
    },

    update: {
      data: { id: 'task_123', name: 'Updated Task' },
      error: null
    },

    delete: {
      data: null,
      error: null
    },

    error: {
      data: null,
      error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
    }
  }
};

// Helper functions for API testing
const createApiRequest = (method, url, options = {}) => ({
  method: method.toUpperCase(),
  url,
  headers: {
    'Content-Type': 'application/json',
    ...options.headers
  },
  body: options.body || null,
  query: options.query || {}
});

const createApiResponse = (status, data = null, error = null) => ({
  status,
  statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'Error',
  headers: {
    'Content-Type': 'application/json'
  },
  body: error ? { success: false, error, code: 'ERROR' } : { success: true, data }
});

const mockFetchResponse = (response) => ({
  ok: response.status >= 200 && response.status < 300,
  status: response.status,
  statusText: response.statusText,
  headers: new Map(Object.entries(response.headers)),
  json: () => Promise.resolve(response.body),
  text: () => Promise.resolve(JSON.stringify(response.body))
});

module.exports = {
  apiFixtures,
  createApiRequest,
  createApiResponse,
  mockFetchResponse
};