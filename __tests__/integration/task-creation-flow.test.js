/**
 * Integration tests for task creation workflow
 * Tests the complete flow from form submission to API response
 */

const { setupComponentTest, renderComponent, simulateEvent, simulateInput, simulateSubmit, cleanupComponentTest } = require('../helpers/componentHelpers');
const { mockSupabaseClient } = require('../mocks/supabase');
const { createValidTask } = require('../fixtures/tasks');

// Mock the API layer
jest.mock('../../src/js/api/tasks', () => ({
  createTask: jest.fn(),
  getTasks: jest.fn()
}));

const { createTask: mockCreateTask, getTasks: mockGetTasks } = require('../../src/js/api/tasks');

describe('Task Creation Flow Integration', () => {
  let dom;
  let taskForm;
  let taskMatrix;
  let formContainer;
  let matrixContainer;

  beforeEach(() => {
    dom = setupComponentTest(`
      <html>
        <body>
          <div id="form-container"></div>
          <div id="matrix-container"></div>
        </body>
      </html>
    `);

    // Mock TaskForm component
    const MockTaskForm = class {
      constructor(props = {}) {
        this.props = props;
        this.state = {
          name: '',
          assignee: 'mario',
          size: 'm',
          urgent: 3,
          important: 3,
          errors: {}
        };
        this.onSubmit = props.onSubmit || jest.fn();
      }

      render(container) {
        container.innerHTML = `
          <form data-testid="task-form">
            <input data-testid="task-name-input" type="text" required />
            <select data-testid="task-assignee-select">
              <option value="mario">Mario</option>
              <option value="maria">Maria</option>
              <option value="both">Both</option>
            </select>
            <select data-testid="task-size-select">
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
            </select>
            <input data-testid="urgent-slider" type="range" min="1" max="5" value="3" />
            <input data-testid="important-slider" type="range" min="1" max="5" value="3" />
            <button data-testid="submit-button" type="submit">Create Task</button>
          </form>
        `;

        const form = container.querySelector('[data-testid="task-form"]');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSubmit();
        });
      }

      handleSubmit() {
        const taskData = {
          name: this.state.name,
          assignee: this.state.assignee,
          size: this.state.size,
          urgent: this.state.urgent,
          important: this.state.important
        };
        this.onSubmit(taskData);
      }
    };

    // Mock TaskMatrix component
    const MockTaskMatrix = class {
      constructor(props = {}) {
        this.props = props;
        this.tasks = props.tasks || [];
        this.onTaskUpdate = props.onTaskUpdate || jest.fn();
      }

      render(container) {
        container.innerHTML = `
          <div data-testid="task-matrix">
            <div data-testid="task-list">
              ${this.tasks.map(task => `
                <div data-testid="task-${task.id}" class="task-item">
                  <span class="task-name">${task.name}</span>
                  <span class="task-assignee">${task.assignee}</span>
                  <span class="task-status">${task.completed ? 'completed' : 'pending'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      addTask(task) {
        this.tasks.push(task);
        this.render(this.container);
      }

      setContainer(container) {
        this.container = container;
      }
    };

    // Set up components
    ({ component: taskForm, container: formContainer } = renderComponent(MockTaskForm, {
      onSubmit: handleTaskSubmit
    }));

    ({ component: taskMatrix, container: matrixContainer } = renderComponent(MockTaskMatrix));
    taskMatrix.setContainer(matrixContainer);

    // Workflow handler
    async function handleTaskSubmit(taskData) {
      try {
        const result = await mockCreateTask(taskData);
        taskMatrix.addTask(result);
        return result;
      } catch (error) {
        console.error('Task creation failed:', error);
        throw error;
      }
    }
  });

  afterEach(() => {
    cleanupComponentTest();
    jest.clearAllMocks();
  });

  describe('Successful Task Creation', () => {
    test('should create task and update matrix on successful form submission', async () => {
      // Mock successful API response
      const createdTask = createValidTask({
        id: 'task_new',
        name: 'Integration Test Task',
        assignee: 'maria',
        completed: false
      });
      mockCreateTask.mockResolvedValue(createdTask);

      // Fill out form
      const nameInput = formContainer.querySelector('[data-testid="task-name-input"]');
      const assigneeSelect = formContainer.querySelector('[data-testid="task-assignee-select"]');
      const form = formContainer.querySelector('[data-testid="task-form"]');

      simulateInput(nameInput, 'Integration Test Task');
      simulateEvent(assigneeSelect, 'change', { target: { value: 'maria' } });

      // Submit form
      simulateSubmit(form);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify API was called correctly
      expect(mockCreateTask).toHaveBeenCalledWith({
        name: 'Integration Test Task',
        assignee: 'maria',
        size: 'm',
        urgent: 3,
        important: 3
      });

      // Verify task appears in matrix
      const taskElement = matrixContainer.querySelector('[data-testid="task-task_new"]');
      expect(taskElement).toBeTruthy();
      expect(taskElement.textContent).toContain('Integration Test Task');
      expect(taskElement.textContent).toContain('maria');
      expect(taskElement.textContent).toContain('pending');
    });

    test('should handle different task priorities correctly', async () => {
      const createdTask = createValidTask({
        id: 'task_priority',
        name: 'High Priority Task',
        assignee: 'mario',
        urgent: 5,
        important: 4
      });
      mockCreateTask.mockResolvedValue(createdTask);

      // Fill form with high priority
      const nameInput = formContainer.querySelector('[data-testid="task-name-input"]');
      const urgentSlider = formContainer.querySelector('[data-testid="urgent-slider"]');
      const importantSlider = formContainer.querySelector('[data-testid="important-slider"]');
      const form = formContainer.querySelector('[data-testid="task-form"]');

      simulateInput(nameInput, 'High Priority Task');
      simulateEvent(urgentSlider, 'input', { target: { value: '5' } });
      simulateEvent(importantSlider, 'input', { target: { value: '4' } });
      simulateSubmit(form);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCreateTask).toHaveBeenCalledWith({
        name: 'High Priority Task',
        assignee: 'mario',
        size: 'm',
        urgent: 5,
        important: 4
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Mock API error
      const error = new Error('Database connection failed');
      mockCreateTask.mockRejectedValue(error);

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Fill and submit form
      const nameInput = formContainer.querySelector('[data-testid="task-name-input"]');
      const form = formContainer.querySelector('[data-testid="task-form"]');

      simulateInput(nameInput, 'Failing Task');
      simulateSubmit(form);

      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Task creation failed:', error);

      // Verify task was not added to matrix
      const taskElement = matrixContainer.querySelector('[data-testid="task-task_new"]');
      expect(taskElement).toBeFalsy();

      consoleSpy.mockRestore();
    });

    test('should handle network timeouts', async () => {
      // Mock timeout
      mockCreateTask.mockImplementation(() => new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), 100);
      }));

      const nameInput = formContainer.querySelector('[data-testid="task-name-input"]');
      const form = formContainer.querySelector('[data-testid="task-form"]');

      simulateInput(nameInput, 'Timeout Task');
      simulateSubmit(form);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify task was not added
      const taskElements = matrixContainer.querySelectorAll('[data-testid^="task-"]');
      expect(taskElements.length).toBe(0);
    });
  });

  describe('Form Validation Integration', () => {
    test('should prevent submission with invalid data', () => {
      const form = formContainer.querySelector('[data-testid="task-form"]');

      // Submit empty form
      simulateSubmit(form);

      // Verify API was not called
      expect(mockCreateTask).not.toHaveBeenCalled();

      // Verify no tasks were added
      const taskElements = matrixContainer.querySelectorAll('[data-testid^="task-"]');
      expect(taskElements.length).toBe(0);
    });

    test('should validate required fields before API call', () => {
      const assigneeSelect = formContainer.querySelector('[data-testid="task-assignee-select"]');
      const form = formContainer.querySelector('[data-testid="task-form"]');

      // Change assignee but leave name empty
      simulateEvent(assigneeSelect, 'change', { target: { value: 'both' } });
      simulateSubmit(form);

      expect(mockCreateTask).not.toHaveBeenCalled();
    });
  });

  describe('State Synchronization', () => {
    test('should maintain consistent state between form and matrix', async () => {
      const createdTask1 = createValidTask({
        id: 'task_1',
        name: 'First Task',
        assignee: 'mario'
      });
      const createdTask2 = createValidTask({
        id: 'task_2',
        name: 'Second Task',
        assignee: 'maria'
      });

      mockCreateTask.mockResolvedValueOnce(createdTask1).mockResolvedValueOnce(createdTask2);

      // Create first task
      const nameInput = formContainer.querySelector('[data-testid="task-name-input"]');
      const form = formContainer.querySelector('[data-testid="task-form"]');

      simulateInput(nameInput, 'First Task');
      simulateSubmit(form);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Create second task
      simulateInput(nameInput, 'Second Task');
      const assigneeSelect = formContainer.querySelector('[data-testid="task-assignee-select"]');
      simulateEvent(assigneeSelect, 'change', { target: { value: 'maria' } });
      simulateSubmit(form);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify both tasks are in matrix
      expect(matrixContainer.querySelector('[data-testid="task-task_1"]')).toBeTruthy();
      expect(matrixContainer.querySelector('[data-testid="task-task_2"]')).toBeTruthy();

      // Verify task details
      const task1Element = matrixContainer.querySelector('[data-testid="task-task_1"]');
      const task2Element = matrixContainer.querySelector('[data-testid="task-task_2"]');

      expect(task1Element.textContent).toContain('First Task');
      expect(task1Element.textContent).toContain('mario');
      expect(task2Element.textContent).toContain('Second Task');
      expect(task2Element.textContent).toContain('maria');
    });
  });
});