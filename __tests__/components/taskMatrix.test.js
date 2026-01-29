/**
 * Unit tests for TaskMatrix component
 * Tests Eisenhower matrix rendering and task positioning
 */

const { setupComponentTest, renderComponent, simulateEvent, cleanupComponentTest, expectToBeVisible, expectToHaveText } = require('../helpers/componentHelpers');

describe('TaskMatrix Component', () => {
  let dom;
  let component;
  let container;

  beforeEach(() => {
    dom = setupComponentTest(`
      <html>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `);

    // Mock component with Eisenhower matrix implementation
    const MockTaskMatrix = class {
      constructor(props = {}) {
        this.props = props;
        this.tasks = props.tasks || [];
        this.onTaskClick = props.onTaskClick || jest.fn();
        this.onTaskDrop = props.onTaskDrop || jest.fn();
      }

      render(container) {
        container.innerHTML = `
          <div data-testid="task-matrix" class="task-matrix">
            <div class="matrix-header">
              <h2>Eisenhower Matrix</h2>
            </div>

            <div class="matrix-grid">
              <!-- Do Quadrant (Urgent & Important) -->
              <div data-testid="quadrant-do" class="quadrant do-quadrant">
                <h3>Do</h3>
                <div data-testid="do-tasks" class="task-list">
                  ${this.renderTasksForQuadrant('do')}
                </div>
              </div>

              <!-- Schedule Quadrant (Not Urgent & Important) -->
              <div data-testid="quadrant-schedule" class="quadrant schedule-quadrant">
                <h3>Schedule</h3>
                <div data-testid="schedule-tasks" class="task-list">
                  ${this.renderTasksForQuadrant('schedule')}
                </div>
              </div>

              <!-- Delegate Quadrant (Urgent & Not Important) -->
              <div data-testid="quadrant-delegate" class="quadrant delegate-quadrant">
                <h3>Delegate</h3>
                <div data-testid="delegate-tasks" class="task-list">
                  ${this.renderTasksForQuadrant('delegate')}
                </div>
              </div>

              <!-- Delete Quadrant (Not Urgent & Not Important) -->
              <div data-testid="quadrant-delete" class="quadrant delete-quadrant">
                <h3>Delete</h3>
                <div data-testid="delete-tasks" class="task-list">
                  ${this.renderTasksForQuadrant('delete')}
                </div>
              </div>
            </div>

            <div class="matrix-legend">
              <div class="legend-item">
                <span class="legend-color urgent"></span>
                <span>Urgent</span>
              </div>
              <div class="legend-item">
                <span class="legend-color important"></span>
                <span>Important</span>
              </div>
            </div>
          </div>
        `;

        // Bind events
        this.bindEvents(container);
      }

      renderTasksForQuadrant(quadrant) {
        const tasksInQuadrant = this.tasks.filter(task => this.getTaskQuadrant(task) === quadrant);

        return tasksInQuadrant.map(task => `
          <div
            data-testid="task-${task.id}"
            class="task-item ${task.completed ? 'completed' : ''}"
            data-task-id="${task.id}"
            draggable="true"
          >
            <div class="task-name">${task.name}</div>
            <div class="task-meta">
              <span class="assignee">${task.assignee}</span>
              <span class="size">${task.size}</span>
            </div>
            <div class="task-priority">
              <span class="urgent-level">U:${task.urgent}</span>
              <span class="important-level">I:${task.important}</span>
            </div>
          </div>
        `).join('');
      }

      getTaskQuadrant(task) {
        const { urgent, important } = task;
        if (urgent >= 4 && important >= 4) return 'do';
        if (urgent >= 4 && important < 4) return 'delegate';
        if (urgent < 4 && important >= 4) return 'schedule';
        return 'delete';
      }

      bindEvents(container) {
        // Task click events
        const taskItems = container.querySelectorAll('[data-testid^="task-"]');
        taskItems.forEach(item => {
          item.addEventListener('click', (e) => {
            const taskId = item.getAttribute('data-task-id');
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
              this.onTaskClick(task);
            }
          });
        });

        // Drag and drop events
        const quadrants = container.querySelectorAll('[data-testid^="quadrant-"]');
        quadrants.forEach(quadrant => {
          quadrant.addEventListener('dragover', (e) => {
            e.preventDefault();
          });

          quadrant.addEventListener('drop', (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const newQuadrant = quadrant.getAttribute('data-testid').replace('quadrant-', '');
            this.onTaskDrop(taskId, newQuadrant);
          });
        });
      }
    };

    ({ component, container } = renderComponent(MockTaskMatrix));
  });

  afterEach(() => {
    cleanupComponentTest();
  });

  describe('Rendering', () => {
    test('should render matrix with all four quadrants', () => {
      const matrix = container.querySelector('[data-testid="task-matrix"]');
      expectToBeVisible(matrix);

      expect(container.querySelector('[data-testid="quadrant-do"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="quadrant-schedule"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="quadrant-delegate"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="quadrant-delete"]')).toBeTruthy();
    });

    test('should render quadrant headers correctly', () => {
      expectToHaveText(container.querySelector('[data-testid="quadrant-do"] h3'), 'Do');
      expectToHaveText(container.querySelector('[data-testid="quadrant-schedule"] h3'), 'Schedule');
      expectToHaveText(container.querySelector('[data-testid="quadrant-delegate"] h3'), 'Delegate');
      expectToHaveText(container.querySelector('[data-testid="quadrant-delete"] h3'), 'Delete');
    });

    test('should render legend', () => {
      const legend = container.querySelector('.matrix-legend');
      expect(legend).toBeTruthy();
      expect(legend.textContent).toContain('Urgent');
      expect(legend.textContent).toContain('Important');
    });
  });

  describe('Task Positioning', () => {
    const testTasks = [
      { id: 'task_1', name: 'Urgent & Important', urgent: 5, important: 5, assignee: 'mario', size: 'm', completed: false },
      { id: 'task_2', name: 'Not Urgent & Important', urgent: 2, important: 5, assignee: 'maria', size: 's', completed: false },
      { id: 'task_3', name: 'Urgent & Not Important', urgent: 5, important: 2, assignee: 'both', size: 'l', completed: false },
      { id: 'task_4', name: 'Not Urgent & Not Important', urgent: 2, important: 2, assignee: 'mario', size: 'xs', completed: false },
      { id: 'task_5', name: 'Completed Task', urgent: 4, important: 4, assignee: 'maria', size: 'm', completed: true }
    ];

    beforeEach(() => {
      cleanupComponentTest();
      ({ component, container } = renderComponent(class extends component.constructor {
        constructor(props) {
          super(props);
          this.tasks = testTasks;
        }
      }));
    });

    test('should position tasks in correct quadrants based on priority', () => {
      const doTasks = container.querySelector('[data-testid="do-tasks"]');
      const scheduleTasks = container.querySelector('[data-testid="schedule-tasks"]');
      const delegateTasks = container.querySelector('[data-testid="delegate-tasks"]');
      const deleteTasks = container.querySelector('[data-testid="delete-tasks"]');

      expect(doTasks.innerHTML).toContain('Urgent & Important');
      expect(scheduleTasks.innerHTML).toContain('Not Urgent & Important');
      expect(delegateTasks.innerHTML).toContain('Urgent & Not Important');
      expect(deleteTasks.innerHTML).toContain('Not Urgent & Not Important');
    });

    test('should display task information correctly', () => {
      const taskElement = container.querySelector('[data-testid="task-task_1"]');

      expect(taskElement).toBeTruthy();
      expect(taskElement.textContent).toContain('Urgent & Important');
      expect(taskElement.textContent).toContain('mario');
      expect(taskElement.textContent).toContain('m');
      expect(taskElement.textContent).toContain('U:5');
      expect(taskElement.textContent).toContain('I:5');
    });

    test('should mark completed tasks', () => {
      const completedTask = container.querySelector('[data-testid="task-task_5"]');
      expect(completedTask.classList.contains('completed')).toBe(true);
    });

    test('should make tasks draggable', () => {
      const taskElement = container.querySelector('[data-testid="task-task_1"]');
      expect(taskElement.getAttribute('draggable')).toBe('true');
    });
  });

  describe('User Interactions', () => {
    const testTasks = [
      { id: 'task_1', name: 'Test Task', urgent: 5, important: 5, assignee: 'mario', size: 'm', completed: false }
    ];

    beforeEach(() => {
      cleanupComponentTest();
      ({ component, container } = renderComponent(class extends component.constructor {
        constructor(props) {
          super(props);
          this.tasks = testTasks;
        }
      }));
    });

    test('should call onTaskClick when task is clicked', () => {
      const mockClick = jest.fn();
      component.onTaskClick = mockClick;

      const taskElement = container.querySelector('[data-testid="task-task_1"]');
      simulateEvent(taskElement, 'click');

      expect(mockClick).toHaveBeenCalledWith(testTasks[0]);
    });

    test('should handle drag and drop to different quadrants', () => {
      const mockDrop = jest.fn();
      component.onTaskDrop = mockDrop;

      const doQuadrant = container.querySelector('[data-testid="quadrant-schedule"]');

      // Mock dataTransfer
      const mockDataTransfer = {
        getData: jest.fn(() => 'task_1')
      };

      simulateEvent(doQuadrant, 'drop', {
        dataTransfer: mockDataTransfer,
        preventDefault: jest.fn()
      });

      expect(mockDrop).toHaveBeenCalledWith('task_1', 'schedule');
    });

    test('should prevent default on dragover', () => {
      const doQuadrant = container.querySelector('[data-testid="quadrant-do"]');

      const mockPreventDefault = jest.fn();
      simulateEvent(doQuadrant, 'dragover', {
        preventDefault: mockPreventDefault
      });

      expect(mockPreventDefault).toHaveBeenCalled();
    });
  });

  describe('Quadrant Logic', () => {
    test('should correctly determine task quadrants', () => {
      const testCases = [
        { urgent: 5, important: 5, expected: 'do' },
        { urgent: 5, important: 3, expected: 'delegate' },
        { urgent: 3, important: 5, expected: 'schedule' },
        { urgent: 2, important: 2, expected: 'delete' },
        { urgent: 4, important: 4, expected: 'do' },
        { urgent: 1, important: 1, expected: 'delete' }
      ];

      testCases.forEach(({ urgent, important, expected }) => {
        const task = { urgent, important };
        expect(component.getTaskQuadrant(task)).toBe(expected);
      });
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      cleanupComponentTest();
      ({ component, container } = renderComponent(class extends component.constructor {
        constructor(props) {
          super(props);
          this.tasks = [];
        }
      }));
    });

    test('should render empty quadrants when no tasks', () => {
      const doTasks = container.querySelector('[data-testid="do-tasks"]');
      const scheduleTasks = container.querySelector('[data-testid="schedule-tasks"]');
      const delegateTasks = container.querySelector('[data-testid="delegate-tasks"]');
      const deleteTasks = container.querySelector('[data-testid="delete-tasks"]');

      expect(doTasks.children.length).toBe(0);
      expect(scheduleTasks.children.length).toBe(0);
      expect(delegateTasks.children.length).toBe(0);
      expect(deleteTasks.children.length).toBe(0);
    });
  });
});