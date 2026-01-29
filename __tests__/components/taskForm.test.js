/**
 * Unit tests for TaskForm component
 * Tests form rendering, validation, and submission
 */

const { setupComponentTest, renderComponent, simulateEvent, simulateInput, simulateSubmit, cleanupComponentTest, expectToBeVisible, expectToHaveText } = require('../helpers/componentHelpers');

describe('TaskForm Component', () => {
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

    // Mock the actual component since it's currently a placeholder
    // This will be replaced with the real component import when implemented
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
        this.onCancel = props.onCancel || jest.fn();
      }

      render(container) {
        container.innerHTML = `
          <form data-testid="task-form" class="task-form">
            <div class="form-group">
              <label for="task-name">Task Name</label>
              <input
                type="text"
                id="task-name"
                data-testid="task-name-input"
                value="${this.state.name}"
                required
              />
              ${this.state.errors.name ? `<span class="error" data-testid="name-error">${this.state.errors.name}</span>` : ''}
            </div>

            <div class="form-group">
              <label for="task-assignee">Assignee</label>
              <select id="task-assignee" data-testid="task-assignee-select">
                <option value="mario" ${this.state.assignee === 'mario' ? 'selected' : ''}>Mario</option>
                <option value="maria" ${this.state.assignee === 'maria' ? 'selected' : ''}>Maria</option>
                <option value="both" ${this.state.assignee === 'both' ? 'selected' : ''}>Both</option>
              </select>
            </div>

            <div class="form-group">
              <label for="task-size">Size</label>
              <select id="task-size" data-testid="task-size-select">
                <option value="xs" ${this.state.size === 'xs' ? 'selected' : ''}>Extra Small</option>
                <option value="s" ${this.state.size === 's' ? 'selected' : ''}>Small</option>
                <option value="m" ${this.state.size === 'm' ? 'selected' : ''}>Medium</option>
                <option value="l" ${this.state.size === 'l' ? 'selected' : ''}>Large</option>
                <option value="xl" ${this.state.size === 'xl' ? 'selected' : ''}>Extra Large</option>
              </select>
            </div>

            <div class="form-group">
              <label>Urgency: <span data-testid="urgent-value">${this.state.urgent}</span></label>
              <input
                type="range"
                min="1"
                max="5"
                data-testid="urgent-slider"
                value="${this.state.urgent}"
              />
            </div>

            <div class="form-group">
              <label>Importance: <span data-testid="important-value">${this.state.important}</span></label>
              <input
                type="range"
                min="1"
                max="5"
                data-testid="important-slider"
                value="${this.state.important}"
              />
            </div>

            <div class="form-actions">
              <button type="submit" data-testid="submit-button">Create Task</button>
              <button type="button" data-testid="cancel-button">Cancel</button>
            </div>
          </form>
        `;

        // Bind events
        const form = container.querySelector('[data-testid="task-form"]');
        const nameInput = container.querySelector('[data-testid="task-name-input"]');
        const assigneeSelect = container.querySelector('[data-testid="task-assignee-select"]');
        const sizeSelect = container.querySelector('[data-testid="task-size-select"]');
        const urgentSlider = container.querySelector('[data-testid="urgent-slider"]');
        const importantSlider = container.querySelector('[data-testid="important-slider"]');
        const submitButton = container.querySelector('[data-testid="submit-button"]');
        const cancelButton = container.querySelector('[data-testid="cancel-button"]');

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSubmit();
        });

        nameInput.addEventListener('input', (e) => {
          this.state.name = e.target.value;
          this.validate();
        });

        assigneeSelect.addEventListener('change', (e) => {
          this.state.assignee = e.target.value;
        });

        sizeSelect.addEventListener('change', (e) => {
          this.state.size = e.target.value;
        });

        urgentSlider.addEventListener('input', (e) => {
          this.state.urgent = parseInt(e.target.value);
          this.updateDisplay();
        });

        importantSlider.addEventListener('input', (e) => {
          this.state.important = parseInt(e.target.value);
          this.updateDisplay();
        });

        cancelButton.addEventListener('click', () => {
          this.onCancel();
        });
      }

      handleSubmit() {
        if (this.validate()) {
          const taskData = {
            name: this.state.name,
            assignee: this.state.assignee,
            size: this.state.size,
            urgent: this.state.urgent,
            important: this.state.important
          };
          this.onSubmit(taskData);
        }
      }

      validate() {
        this.state.errors = {};

        if (!this.state.name.trim()) {
          this.state.errors.name = 'Task name is required';
        }

        this.updateDisplay();
        return Object.keys(this.state.errors).length === 0;
      }

      updateDisplay() {
        const urgentValue = this.container?.querySelector('[data-testid="urgent-value"]');
        const importantValue = this.container?.querySelector('[data-testid="important-value"]');
        const nameError = this.container?.querySelector('[data-testid="name-error"]');

        if (urgentValue) urgentValue.textContent = this.state.urgent;
        if (importantValue) importantValue.textContent = this.state.important;

        if (nameError) {
          nameError.textContent = this.state.errors.name || '';
          nameError.style.display = this.state.errors.name ? 'block' : 'none';
        }
      }

      setContainer(container) {
        this.container = container;
      }
    };

    ({ component, container } = renderComponent(MockTaskForm));
    component.setContainer(container);
  });

  afterEach(() => {
    cleanupComponentTest();
  });

  describe('Rendering', () => {
    test('should render form with all required fields', () => {
      const form = container.querySelector('[data-testid="task-form"]');
      expectToBeVisible(form);

      expect(container.querySelector('[data-testid="task-name-input"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="task-assignee-select"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="task-size-select"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="urgent-slider"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="important-slider"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="submit-button"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="cancel-button"]')).toBeTruthy();
    });

    test('should render with default values', () => {
      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const assigneeSelect = container.querySelector('[data-testid="task-assignee-select"]');
      const urgentValue = container.querySelector('[data-testid="urgent-value"]');
      const importantValue = container.querySelector('[data-testid="important-value"]');

      expect(nameInput.value).toBe('');
      expect(assigneeSelect.value).toBe('mario');
      expect(urgentValue.textContent).toBe('3');
      expect(importantValue.textContent).toBe('3');
    });

    test('should render with provided initial values', () => {
      cleanupComponentTest();

      const initialProps = {
        initialData: {
          name: 'Test Task',
          assignee: 'maria',
          urgent: 5,
          important: 4
        }
      };

      ({ component, container } = renderComponent(class extends component.constructor {
        constructor(props) {
          super(props);
          if (props.initialData) {
            this.state = { ...this.state, ...props.initialData };
          }
        }
      }, initialProps));
      component.setContainer(container);

      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const assigneeSelect = container.querySelector('[data-testid="task-assignee-select"]');
      const urgentValue = container.querySelector('[data-testid="urgent-value"]');
      const importantValue = container.querySelector('[data-testid="important-value"]');

      expect(nameInput.value).toBe('Test Task');
      expect(assigneeSelect.value).toBe('maria');
      expect(urgentValue.textContent).toBe('5');
      expect(importantValue.textContent).toBe('4');
    });
  });

  describe('Form Validation', () => {
    test('should show error when name is empty', () => {
      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const form = container.querySelector('[data-testid="task-form"]');

      // Clear the name
      simulateInput(nameInput, '');

      // Submit form
      simulateSubmit(form);

      const errorElement = container.querySelector('[data-testid="name-error"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toBe('Task name is required');
    });

    test('should not show error when name is provided', () => {
      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const form = container.querySelector('[data-testid="task-form"]');

      // Set a valid name
      simulateInput(nameInput, 'Valid Task Name');

      // Submit form
      simulateSubmit(form);

      const errorElement = container.querySelector('[data-testid="name-error"]');
      expect(errorElement.style.display).toBe('none');
    });

    test('should validate form before submission', () => {
      const mockSubmit = jest.fn();
      component.onSubmit = mockSubmit;

      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const form = container.querySelector('[data-testid="task-form"]');

      // Try to submit with empty name
      simulateSubmit(form);
      expect(mockSubmit).not.toHaveBeenCalled();

      // Set valid name and submit
      simulateInput(nameInput, 'Valid Task');
      simulateSubmit(form);
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Valid Task',
        assignee: 'mario',
        size: 'm',
        urgent: 3,
        important: 3
      });
    });
  });

  describe('User Interactions', () => {
    test('should update state when inputs change', () => {
      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const assigneeSelect = container.querySelector('[data-testid="task-assignee-select"]');
      const sizeSelect = container.querySelector('[data-testid="task-size-select"]');
      const urgentSlider = container.querySelector('[data-testid="urgent-slider"]');
      const importantSlider = container.querySelector('[data-testid="important-slider"]');

      simulateInput(nameInput, 'Updated Task');
      simulateEvent(assigneeSelect, 'change', { target: { value: 'maria' } });
      simulateEvent(sizeSelect, 'change', { target: { value: 'l' } });
      simulateEvent(urgentSlider, 'input', { target: { value: '5' } });
      simulateEvent(importantSlider, 'input', { target: { value: '4' } });

      expect(component.state.name).toBe('Updated Task');
      expect(component.state.assignee).toBe('maria');
      expect(component.state.size).toBe('l');
      expect(component.state.urgent).toBe(5);
      expect(component.state.important).toBe(4);
    });

    test('should call onSubmit with correct data when form is valid', () => {
      const mockSubmit = jest.fn();
      component.onSubmit = mockSubmit;

      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const assigneeSelect = container.querySelector('[data-testid="task-assignee-select"]');
      const form = container.querySelector('[data-testid="task-form"]');

      simulateInput(nameInput, 'Test Task');
      simulateEvent(assigneeSelect, 'change', { target: { value: 'both' } });
      simulateSubmit(form);

      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Task',
        assignee: 'both',
        size: 'm',
        urgent: 3,
        important: 3
      });
    });

    test('should call onCancel when cancel button is clicked', () => {
      const mockCancel = jest.fn();
      component.onCancel = mockCancel;

      const cancelButton = container.querySelector('[data-testid="cancel-button"]');
      simulateEvent(cancelButton, 'click');

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper labels for form inputs', () => {
      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      const assigneeSelect = container.querySelector('[data-testid="task-assignee-select"]');
      const sizeSelect = container.querySelector('[data-testid="task-size-select"]');

      expect(nameInput.getAttribute('id')).toBe('task-name');
      expect(document.querySelector('label[for="task-name"]')).toBeTruthy();

      expect(assigneeSelect.getAttribute('id')).toBe('task-assignee');
      expect(document.querySelector('label[for="task-assignee"]')).toBeTruthy();

      expect(sizeSelect.getAttribute('id')).toBe('task-size');
      expect(document.querySelector('label[for="task-size"]')).toBeTruthy();
    });

    test('should have required attribute on name input', () => {
      const nameInput = container.querySelector('[data-testid="task-name-input"]');
      expect(nameInput.hasAttribute('required')).toBe(true);
    });
  });
});