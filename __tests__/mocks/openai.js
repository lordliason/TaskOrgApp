/**
 * OpenAI API mocks for testing
 * Provides mock implementations for AI operations
 */

const mockOpenAIResponse = (content = '', finishReason = 'stop', usage = null) => ({
  choices: [{
    message: {
      role: 'assistant',
      content: content
    },
    finish_reason: finishReason,
    index: 0
  }],
  usage: usage || {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150
  }
});

const createMockOpenAIClient = () => ({
  chat: {
    completions: {
      create: jest.fn()
    }
  }
});

// Pre-configured responses for common scenarios
const mockOpenAIResponses = {
  taskDecomposition: mockOpenAIResponse(`{
    "parentTask": {
      "name": "Plan vacation",
      "assignee": "both",
      "size": "xl",
      "urgent": 3,
      "important": 4,
      "deadline": "2025-08-15"
    },
    "subtasks": [
      {
        "name": "Research destinations",
        "assignee": "mario",
        "size": "m",
        "urgent": 3,
        "important": 4,
        "deadline": "2025-07-01"
      },
      {
        "name": "Book flights",
        "assignee": "maria",
        "size": "s",
        "urgent": 4,
        "important": 5,
        "deadline": "2025-07-15"
      }
    ],
    "message": "Task decomposed successfully"
  }`),

  chatResponse: mockOpenAIResponse("I understand you want to create a task. Let me help you with that."),

  error: mockOpenAIResponse("", "error", null),

  functionCall: mockOpenAIResponse("", "function_call", null)
};

// Mock function call response
mockOpenAIResponses.functionCall.choices[0].message = {
  role: 'assistant',
  content: null,
  function_call: {
    name: 'createTask',
    arguments: JSON.stringify({
      name: 'Test task',
      assignee: 'mario'
    })
  }
};

// Helper to mock OpenAI responses
const mockOpenAI = (client, responseType = 'taskDecomposition') => {
  client.chat.completions.create.mockResolvedValue(mockOpenAIResponses[responseType]);
  return client;
};

// Helper to mock OpenAI errors
const mockOpenAIError = (client, error = new Error('OpenAI API error')) => {
  client.chat.completions.create.mockRejectedValue(error);
  return client;
};

// Helper to simulate streaming responses
const mockStreamingResponse = async function* (chunks) {
  for (const chunk of chunks) {
    yield {
      choices: [{
        delta: {
          content: chunk
        },
        finish_reason: null
      }]
    };
  }

  yield {
    choices: [{
      delta: {},
      finish_reason: 'stop'
    }]
  };
};

module.exports = {
  mockOpenAIResponse,
  createMockOpenAIClient,
  mockOpenAIResponses,
  mockOpenAI,
  mockOpenAIError,
  mockStreamingResponse
};