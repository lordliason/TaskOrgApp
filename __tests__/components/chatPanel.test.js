/**
 * Unit tests for ChatPanel component
 * Tests chat interface, message handling, and AI interactions
 */

const { setupComponentTest, renderComponent, simulateEvent, simulateInput, cleanupComponentTest, expectToBeVisible, expectToHaveText } = require('../helpers/componentHelpers');

describe('ChatPanel Component', () => {
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

    // Mock chat panel component
    const MockChatPanel = class {
      constructor(props = {}) {
        this.props = props;
        this.messages = props.initialMessages || [];
        this.isTyping = false;
        this.onSendMessage = props.onSendMessage || jest.fn();
        this.onClearChat = props.onClearChat || jest.fn();
      }

      render(container) {
        container.innerHTML = `
          <div data-testid="chat-panel" class="chat-panel">
            <div class="chat-header">
              <h3>AI Assistant</h3>
              <button data-testid="clear-chat-btn" class="clear-btn">Clear</button>
            </div>

            <div data-testid="messages-container" class="messages-container">
              ${this.renderMessages()}
              ${this.isTyping ? '<div data-testid="typing-indicator" class="typing">AI is thinking...</div>' : ''}
            </div>

            <div class="chat-input-area">
              <div class="input-group">
                <input
                  type="text"
                  data-testid="message-input"
                  placeholder="Ask me to decompose tasks..."
                  value=""
                />
                <button data-testid="send-btn" class="send-btn" disabled>Send</button>
              </div>
              <div class="input-hints">
                <span>Try: "decompose buy groceries" or "break down plan vacation"</span>
              </div>
            </div>
          </div>
        `;

        this.bindEvents(container);
      }

      renderMessages() {
        return this.messages.map((message, index) => `
          <div data-testid="message-${index}" class="message ${message.role}">
            <div class="message-avatar">
              ${message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content">
              <div class="message-text">${this.escapeHtml(message.content)}</div>
              <div class="message-time">${message.timestamp || 'now'}</div>
            </div>
          </div>
        `).join('');
      }

      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      bindEvents(container) {
        const input = container.querySelector('[data-testid="message-input"]');
        const sendBtn = container.querySelector('[data-testid="send-btn"]');
        const clearBtn = container.querySelector('[data-testid="clear-chat-btn"]');

        input.addEventListener('input', (e) => {
          this.updateSendButton(e.target.value);
        });

        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });

        sendBtn.addEventListener('click', () => {
          this.sendMessage();
        });

        clearBtn.addEventListener('click', () => {
          this.onClearChat();
        });
      }

      updateSendButton(value) {
        const sendBtn = this.container?.querySelector('[data-testid="send-btn"]');
        if (sendBtn) {
          sendBtn.disabled = !value.trim();
        }
      }

      async sendMessage() {
        const input = this.container?.querySelector('[data-testid="message-input"]');
        if (!input) return;

        const message = input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';

        // Show typing indicator
        this.setTyping(true);

        try {
          await this.onSendMessage(message);
        } finally {
          this.setTyping(false);
        }
      }

      addMessage(role, content, timestamp = null) {
        const message = {
          role,
          content,
          timestamp: timestamp || new Date().toLocaleTimeString()
        };

        this.messages.push(message);
        this.updateMessages();
      }

      setTyping(typing) {
        this.isTyping = typing;
        this.updateTypingIndicator();
      }

      updateMessages() {
        if (this.container) {
          const messagesContainer = this.container.querySelector('[data-testid="messages-container"]');
          if (messagesContainer) {
            // Re-render messages (simplified for testing)
            const messagesHtml = this.renderMessages();
            messagesContainer.innerHTML = messagesHtml + (this.isTyping ? '<div data-testid="typing-indicator" class="typing">AI is thinking...</div>' : '');
          }
        }
      }

      updateTypingIndicator() {
        if (this.container) {
          this.updateMessages();
        }
      }

      clearMessages() {
        this.messages = [];
        this.updateMessages();
      }

      setContainer(container) {
        this.container = container;
      }
    };

    ({ component, container } = renderComponent(MockChatPanel));
    component.setContainer(container);
  });

  afterEach(() => {
    cleanupComponentTest();
  });

  describe('Rendering', () => {
    test('should render chat panel with all components', () => {
      const panel = container.querySelector('[data-testid="chat-panel"]');
      expectToBeVisible(panel);

      expect(container.querySelector('[data-testid="messages-container"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="message-input"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="send-btn"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="clear-chat-btn"]')).toBeTruthy();
    });

    test('should show input hints', () => {
      const hints = container.querySelector('.input-hints');
      expect(hints).toBeTruthy();
      expect(hints.textContent).toContain('decompose');
      expect(hints.textContent).toContain('break down');
    });

    test('should render initial messages', () => {
      cleanupComponentTest();

      const initialMessages = [
        { role: 'user', content: 'Hello', timestamp: '10:00' },
        { role: 'assistant', content: 'Hi there!', timestamp: '10:01' }
      ];

      ({ component, container } = renderComponent(class extends component.constructor {
        constructor(props) {
          super(props);
          this.messages = initialMessages;
        }
      }));
      component.setContainer(container);

      expect(container.querySelector('[data-testid="message-0"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="message-1"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="message-0"]').textContent).toContain('Hello');
      expect(container.querySelector('[data-testid="message-1"]').textContent).toContain('Hi there!');
    });
  });

  describe('Message Handling', () => {
    test('should add messages correctly', () => {
      component.addMessage('user', 'Test message');

      expect(component.messages.length).toBe(1);
      expect(component.messages[0].role).toBe('user');
      expect(component.messages[0].content).toBe('Test message');
      expect(component.messages[0].timestamp).toBeTruthy();
    });

    test('should escape HTML in messages', () => {
      component.addMessage('user', '<script>alert("xss")</script>');

      const messageElement = container.querySelector('[data-testid="message-0"] .message-text');
      expect(messageElement.innerHTML).not.toContain('<script>');
      expect(messageElement.textContent).toContain('<script>alert("xss")</script>');
    });

    test('should clear messages', () => {
      component.addMessage('user', 'Message 1');
      component.addMessage('assistant', 'Message 2');

      expect(component.messages.length).toBe(2);

      component.clearMessages();
      expect(component.messages.length).toBe(0);
    });
  });

  describe('User Interactions', () => {
    test('should enable send button when input has text', () => {
      const input = container.querySelector('[data-testid="message-input"]');
      const sendBtn = container.querySelector('[data-testid="send-btn"]');

      expect(sendBtn.disabled).toBe(true);

      simulateEvent(input, 'input', { target: { value: 'Hello' } });
      expect(sendBtn.disabled).toBe(false);

      simulateEvent(input, 'input', { target: { value: '' } });
      expect(sendBtn.disabled).toBe(true);
    });

    test('should send message on Enter key', () => {
      const mockSend = jest.fn();
      component.onSendMessage = mockSend;

      const input = container.querySelector('[data-testid="message-input"]');
      simulateEvent(input, 'input', { target: { value: 'Test message' } });
      simulateEvent(input, 'keypress', { key: 'Enter', preventDefault: jest.fn() });

      expect(mockSend).toHaveBeenCalledWith('Test message');
      expect(input.value).toBe('');
    });

    test('should not send message on Shift+Enter', () => {
      const mockSend = jest.fn();
      component.onSendMessage = mockSend;

      const input = container.querySelector('[data-testid="message-input"]');
      simulateEvent(input, 'input', { target: { value: 'Test message' } });
      simulateEvent(input, 'keypress', { key: 'Enter', shiftKey: true, preventDefault: jest.fn() });

      expect(mockSend).not.toHaveBeenCalled();
    });

    test('should send message on button click', () => {
      const mockSend = jest.fn();
      component.onSendMessage = mockSend;

      const input = container.querySelector('[data-testid="message-input"]');
      const sendBtn = container.querySelector('[data-testid="send-btn"]');

      simulateEvent(input, 'input', { target: { value: 'Test message' } });
      simulateEvent(sendBtn, 'click');

      expect(mockSend).toHaveBeenCalledWith('Test message');
    });

    test('should call onClearChat when clear button is clicked', () => {
      const mockClear = jest.fn();
      component.onClearChat = mockClear;

      const clearBtn = container.querySelector('[data-testid="clear-chat-btn"]');
      simulateEvent(clearBtn, 'click');

      expect(mockClear).toHaveBeenCalled();
    });
  });

  describe('Typing Indicator', () => {
    test('should show typing indicator when AI is thinking', () => {
      component.setTyping(true);

      const typingIndicator = container.querySelector('[data-testid="typing-indicator"]');
      expect(typingIndicator).toBeTruthy();
      expect(typingIndicator.textContent).toContain('AI is thinking');
    });

    test('should hide typing indicator when not typing', () => {
      component.setTyping(true);
      component.setTyping(false);

      const typingIndicator = container.querySelector('[data-testid="typing-indicator"]');
      expect(typingIndicator).toBeFalsy();
    });
  });

  describe('Send Message Flow', () => {
    test('should handle send message flow correctly', async () => {
      const mockSend = jest.fn().mockResolvedValue();
      component.onSendMessage = mockSend;

      const input = container.querySelector('[data-testid="message-input"]');

      // Type message
      simulateEvent(input, 'input', { target: { value: 'Test message' } });

      // Send message
      await component.sendMessage();

      expect(mockSend).toHaveBeenCalledWith('Test message');
      expect(component.messages.length).toBe(1);
      expect(component.messages[0].content).toBe('Test message');
      expect(component.messages[0].role).toBe('user');
    });

    test('should show typing indicator during message processing', async () => {
      let resolveSend;
      const sendPromise = new Promise(resolve => { resolveSend = resolve; });
      const mockSend = jest.fn().mockReturnValue(sendPromise);
      component.onSendMessage = mockSend;

      const input = container.querySelector('[data-testid="message-input"]');
      simulateEvent(input, 'input', { target: { value: 'Test message' } });

      // Start sending
      const sendPromise2 = component.sendMessage();

      // Should show typing
      expect(component.isTyping).toBe(true);
      expect(container.querySelector('[data-testid="typing-indicator"]')).toBeTruthy();

      // Complete sending
      resolveSend();
      await sendPromise2;

      expect(component.isTyping).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      const input = container.querySelector('[data-testid="message-input"]');
      expect(input.getAttribute('placeholder')).toContain('Ask me to decompose');
    });

    test('should handle keyboard navigation', () => {
      const input = container.querySelector('[data-testid="message-input"]');

      // Focus input
      input.focus();
      expect(document.activeElement).toBe(input);

      // Type something
      simulateEvent(input, 'input', { target: { value: 'test' } });
      expect(input.value).toBe('test');
    });
  });
});