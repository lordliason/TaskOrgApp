/**
 * Integration tests for task decomposition workflow
 * Tests the complete flow from chat input to task creation
 */

const { setupComponentTest, renderComponent, simulateEvent, simulateInput, cleanupComponentTest } = require('../helpers/componentHelpers');
const { mockSupabaseClient } = require('../mocks/supabase');
const { mockOpenAI } = require('../mocks/openai');
const { createValidTask } = require('../fixtures/tasks');

// Mock API layers
jest.mock('../../src/js/api/tasks', () => ({
  createTask: jest.fn(),
  getTasks: jest.fn()
}));

jest.mock('../../api/chat', () => ({
  decomposeTask: jest.fn(),
  createTask: jest.fn()
}));

const { createTask: mockCreateTask } = require('../../src/js/api/tasks');
const { decomposeTask: mockDecomposeTask } = require('../../api/chat');

describe('Task Decomposition Flow Integration', () => {
  let dom;
  let chatPanel;
  let taskMatrix;
  let chatContainer;
  let matrixContainer;

  beforeEach(() => {
    dom = setupComponentTest(`
      <html>
        <body>
          <div id="chat-container"></div>
          <div id="matrix-container"></div>
        </body>
      </html>
    `);

    // Mock ChatPanel component
    const MockChatPanel = class {
      constructor(props = {}) {
        this.props = props;
        this.messages = [];
        this.onSendMessage = props.onSendMessage || jest.fn();
      }

      render(container) {
        container.innerHTML = `
          <div data-testid="chat-panel">
            <div data-testid="messages-container"></div>
            <input data-testid="message-input" type="text" />
            <button data-testid="send-btn">Send</button>
          </div>
        `;

        const sendBtn = container.querySelector('[data-testid="send-btn"]');
        const input = container.querySelector('[data-testid="message-input"]');

        sendBtn.addEventListener('click', () => {
          const message = input.value.trim();
          if (message) {
            this.sendMessage(message);
          }
        });
      }

      async sendMessage(message) {
        this.addMessage('user', message);
        await this.onSendMessage(message);
      }

      addMessage(role, content) {
        this.messages.push({ role, content, timestamp: new Date().toLocaleTimeString() });
        this.updateMessages();
      }

      updateMessages() {
        const container = this.container?.querySelector('[data-testid="messages-container"]');
        if (container) {
          container.innerHTML = this.messages.map((msg, index) =>
            `<div data-testid="message-${index}" class="${msg.role}">${msg.content}</div>`
          ).join('');
        }
      }

      setContainer(container) {
        this.container = container;
      }
    };

    // Mock TaskMatrix component
    const MockTaskMatrix = class {
      constructor(props = {}) {
        this.props = props;
        this.tasks = [];
      }

      render(container) {
        container.innerHTML = `
          <div data-testid="task-matrix">
            <div data-testid="task-list">
              ${this.tasks.map(task => `
                <div data-testid="task-${task.id}" class="task-item">
                  <span class="task-name">${task.name}</span>
                  <span class="task-assignee">${task.assignee}</span>
                  <span class="task-size">${task.size}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      addTasks(tasks) {
        this.tasks.push(...tasks);
        this.render(this.container);
      }

      setContainer(container) {
        this.container = container;
      }
    };

    // Set up components
    ({ component: chatPanel, container: chatContainer } = renderComponent(MockChatPanel, {
      onSendMessage: handleChatMessage
    }));
    chatPanel.setContainer(chatContainer);

    ({ component: taskMatrix, container: matrixContainer } = renderComponent(MockTaskMatrix));
    taskMatrix.setContainer(matrixContainer);

    // Workflow handler
    async function handleChatMessage(message) {
      try {
        // Mock AI processing
        if (message.toLowerCase().includes('decompose')) {
          const taskName = message.replace(/decompose/i, '').trim();

          // Call decomposition API
          const decompositionResult = await mockDecomposeTask({ name: taskName });

          // Create tasks from decomposition
          const createdTasks = [];
          for (const subtask of decompositionResult.subtasks) {
            const createdTask = await mockCreateTask(subtask);
            createdTasks.push(createdTask);
          }

          // Update matrix
          taskMatrix.addTasks(createdTasks);

          // Add AI response to chat
          chatPanel.addMessage('assistant', `Successfully decomposed "${taskName}" into ${createdTasks.length} subtasks!`);

          return decompositionResult;
        } else {
          // Regular chat response
          chatPanel.addMessage('assistant', 'I can help you decompose tasks. Try saying "decompose [task name]"');
        }
      } catch (error) {
        chatPanel.addMessage('assistant', 'Sorry, I encountered an error processing your request.');
        throw error;
      }
    }
  });

  afterEach(() => {
    cleanupComponentTest();
    jest.clearAllMocks();
  });

  describe('Successful Decomposition Flow', () => {
    test('should decompose task and create subtasks through chat', async () => {
      // Mock decomposition API response
      const decompositionResult = {
        parentTask: createValidTask({
          id: 'parent_1',
          name: 'Plan Vacation',
          size: 'xl'
        }),
        subtasks: [
          createValidTask({ id: 'sub_1', name: 'Research destinations', assignee: 'mario', parent_task_id: 'parent_1' }),
          createValidTask({ id: 'sub_2', name: 'Book flights', assignee: 'maria', parent_task_id: 'parent_1' }),
          createValidTask({ id: 'sub_3', name: 'Pack luggage', assignee: 'both', parent_task_id: 'parent_1' })
        ],
        matrix_positions: [],
        integrations: [],
        message: 'Task decomposed successfully'
      };

      // Mock API responses
      mockDecomposeTask.mockResolvedValue(decompositionResult);
      mockCreateTask
        .mockResolvedValueOnce(decompositionResult.subtasks[0])
        .mockResolvedValueOnce(decompositionResult.subtasks[1])
        .mockResolvedValueOnce(decompositionResult.subtasks[2]);

      // Send decomposition message
      const input = chatContainer.querySelector('[data-testid="message-input"]');
      const sendBtn = chatContainer.querySelector('[data-testid="send-btn"]');

      simulateInput(input, 'decompose Plan Vacation');
      simulateEvent(sendBtn, 'click');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify decomposition was called
      expect(mockDecomposeTask).toHaveBeenCalledWith({ name: 'Plan Vacation' });

      // Verify subtasks were created
      expect(mockCreateTask).toHaveBeenCalledTimes(3);
      expect(mockCreateTask).toHaveBeenCalledWith(decompositionResult.subtasks[0]);
      expect(mockCreateTask).toHaveBeenCalledWith(decompositionResult.subtasks[1]);
      expect(mockCreateTask).toHaveBeenCalledWith(decompositionResult.subtasks[2]);

      // Verify tasks appear in matrix
      const taskElements = matrixContainer.querySelectorAll('[data-testid^="task-"]');
      expect(taskElements.length).toBe(3);

      expect(matrixContainer.textContent).toContain('Research destinations');
      expect(matrixContainer.textContent).toContain('Book flights');
      expect(matrixContainer.textContent).toContain('Pack luggage');

      // Verify chat responses
      const messages = chatContainer.querySelectorAll('[data-testid^="message-"]');
      expect(messages.length).toBe(2); // User message + AI response
      expect(messages[1].textContent).toContain('Successfully decomposed');
      expect(messages[1].textContent).toContain('3 subtasks');
    });

    test('should handle different decomposition patterns', async () => {
      const decompositionResult = {
        parentTask: createValidTask({ id: 'parent_2', name: 'Buy Groceries' }),
        subtasks: [
          createValidTask({ id: 'sub_4', name: 'Make shopping list', assignee: 'mario', parent_task_id: 'parent_2' }),
          createValidTask({ id: 'sub_5', name: 'Go to store', assignee: 'maria', parent_task_id: 'parent_2' })
        ]
      };

      mockDecomposeTask.mockResolvedValue(decompositionResult);
      mockCreateTask
        .mockResolvedValueOnce(decompositionResult.subtasks[0])
        .mockResolvedValueOnce(decompositionResult.subtasks[1]);

      // Test different message formats
      const testMessages = [
        'decompose Buy Groceries',
        'break down Buy Groceries',
        'Can you decompose "Buy Groceries"?'
      ];

      for (const message of testMessages) {
        // Clear previous state
        chatPanel.messages = [];
        taskMatrix.tasks = [];

        const input = chatContainer.querySelector('[data-testid="message-input"]');
        const sendBtn = chatContainer.querySelector('[data-testid="send-btn"]');

        simulateInput(input, message);
        simulateEvent(sendBtn, 'click');
        await new Promise(resolve => setTimeout(resolve, 0));

        // Should have created tasks
        const taskElements = matrixContainer.querySelectorAll('[data-testid^="task-"]');
        expect(taskElements.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle decomposition API errors gracefully', async () => {
      const error = new Error('AI service unavailable');
      mockDecomposeTask.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const input = chatContainer.querySelector('[data-testid="message-input"]');
      const sendBtn = chatContainer.querySelector('[data-testid="send-btn"]');

      simulateInput(input, 'decompose Failing Task');
      simulateEvent(sendBtn, 'click');

      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify error response in chat
      const messages = chatContainer.querySelectorAll('[data-testid^="message-"]');
      expect(messages.length).toBe(2);
      expect(messages[1].textContent).toContain('encountered an error');

      // Verify no tasks were created
      const taskElements = matrixContainer.querySelectorAll('[data-testid^="task-"]');
      expect(taskElements.length).toBe(0);

      consoleSpy.mockRestore();
    });

    test('should handle partial task creation failures', async () => {
      const decompositionResult = {
        parentTask: createValidTask({ id: 'parent_3', name: 'Test Task' }),
        subtasks: [
          createValidTask({ id: 'sub_6', name: 'Task 1', parent_task_id: 'parent_3' }),
          createValidTask({ id: 'sub_7', name: 'Task 2', parent_task_id: 'parent_3' })
        ]
      };

      mockDecomposeTask.mockResolvedValue(decompositionResult);
      mockCreateTask
        .mockResolvedValueOnce(decompositionResult.subtasks[0])
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(decompositionResult.subtasks[2]);

      const input = chatContainer.querySelector('[data-testid="message-input"]');
      const sendBtn = chatContainer.querySelector('[data-testid="send-btn"]');

      simulateInput(input, 'decompose Test Task');
      simulateEvent(sendBtn, 'click');

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should have created first and third tasks, failed on second
      expect(mockCreateTask).toHaveBeenCalledTimes(3);
      const taskElements = matrixContainer.querySelectorAll('[data-testid^="task-"]');
      expect(taskElements.length).toBe(2); // Only successful creations
    });
  });

  describe('Chat Interface Integration', () => {
    test('should respond appropriately to non-decomposition messages', async () => {
      const input = chatContainer.querySelector('[data-testid="message-input"]');
      const sendBtn = chatContainer.querySelector('[data-testid="send-btn"]');

      simulateInput(input, 'Hello, how are you?');
      simulateEvent(sendBtn, 'click');

      await new Promise(resolve => setTimeout(resolve, 0));

      const messages = chatContainer.querySelectorAll('[data-testid^="message-"]');
      expect(messages.length).toBe(2);
      expect(messages[1].textContent).toContain('decompose tasks');
      expect(messages[1].textContent).toContain('break down');
    });

    test('should maintain chat history across interactions', async () => {
      const input = chatContainer.querySelector('[data-testid="message-input"]');
      const sendBtn = chatContainer.querySelector('[data-testid="send-btn"]');

      // First message
      simulateInput(input, 'Hello');
      simulateEvent(sendBtn, 'click');
      await new Promise(resolve => setTimeout(resolve, 0));

      // Second message
      simulateInput(input, 'decompose Simple Task');
      simulateEvent(sendBtn, 'click');
      await new Promise(resolve => setTimeout(resolve, 0));

      const messages = chatContainer.querySelectorAll('[data-testid^="message-"]');
      expect(messages.length).toBe(4); // 2 user + 2 assistant messages
      expect(messages[0].textContent).toBe('Hello');
      expect(messages[2].textContent).toBe('decompose Simple Task');
    });
  });

  describe('Task Matrix Updates', () => {
    test('should update matrix with correct task relationships', async () => {
      const decompositionResult = {
        parentTask: createValidTask({
          id: 'parent_4',
          name: 'Complex Project',
          size: 'xl'
        }),
        subtasks: [
          createValidTask({
            id: 'sub_8',
            name: 'Planning Phase',
            assignee: 'mario',
            parent_task_id: 'parent_4',
            depends_on: null
          }),
          createValidTask({
            id: 'sub_9',
            name: 'Implementation',
            assignee: 'maria',
            parent_task_id: 'parent_4',
            depends_on: ['sub_8']
          })
        ]
      };

      mockDecomposeTask.mockResolvedValue(decompositionResult);
      mockCreateTask
        .mockResolvedValueOnce(decompositionResult.subtasks[0])
        .mockResolvedValueOnce(decompositionResult.subtasks[1]);

      const input = chatContainer.querySelector('[data-testid="message-input"]');
      const sendBtn = chatContainer.querySelector('[data-testid="send-btn"]');

      simulateInput(input, 'decompose Complex Project');
      simulateEvent(sendBtn, 'click');
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify tasks are displayed with correct information
      const planningTask = matrixContainer.querySelector('[data-testid="task-sub_8"]');
      const implementationTask = matrixContainer.querySelector('[data-testid="task-sub_9"]');

      expect(planningTask.textContent).toContain('Planning Phase');
      expect(planningTask.textContent).toContain('mario');
      expect(implementationTask.textContent).toContain('Implementation');
      expect(implementationTask.textContent).toContain('maria');
    });
  });
});