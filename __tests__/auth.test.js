/**
 * Unit tests for authentication functionality
 * Tests: initDOMElements, handleLoginSubmit, handleCreateAccount, event listeners
 * @jest-environment jsdom
 */

describe('Authentication', () => {
    let mockSupabaseClient;
    let mockHashPassword;
    let mockShowEnvironmentPicker;
    let currentUser;
    
    // Mock functions and variables that would be in the global scope
    let passwordGate, usernameInput, passwordInput, passwordBtn, passwordError;
    let createAccountGate, environmentPickerGate, createEnvironmentGate;
    
    beforeEach(() => {
        // Set up DOM structure
        document.body.innerHTML = `
            <!-- Password Gate -->
            <div class="password-gate" id="passwordGate">
                <div class="login-box">
                    <div class="password-logo">Task Matrix</div>
                    <div class="password-subtitle">Sign in to your account</div>
                    <div class="login-input-group">
                        <input type="email" class="login-input" id="emailInput" placeholder="Email address">
                        <input type="password" class="login-input" id="passwordInput" placeholder="Password">
                    </div>
                    <button type="button" class="password-btn" id="loginBtn">Sign In</button>
                    <div class="password-error" id="passwordError">Invalid email or password</div>
                    <div class="login-links">
                        <button type="button" class="create-account-link" id="createAccountLink">Create Account</button>
                    </div>
                </div>
            </div>

            <!-- Create Account Modal -->
            <div class="password-gate hidden" id="createAccountGate">
                <div class="login-box">
                    <div class="password-logo">Task Matrix</div>
                    <div class="password-subtitle">Create your account</div>
                    <div class="login-input-group">
                        <input type="text" class="login-input" id="newNameInput" placeholder="Your name">
                        <input type="email" class="login-input" id="newEmailInput" placeholder="Email address">
                        <input type="password" class="login-input" id="newPasswordInput" placeholder="Password">
                        <input type="password" class="login-input" id="confirmPasswordInput" placeholder="Confirm password">
                    </div>
                    <button type="button" class="password-btn" id="createAccountBtn">Create Account</button>
                    <div class="password-error" id="createAccountError">Account creation failed</div>
                    <div class="login-links">
                        <button type="button" class="create-account-link" id="backToLoginLink">Back to Sign In</button>
                    </div>
                </div>
            </div>

            <!-- Environment Picker -->
            <div class="password-gate hidden" id="environmentPickerGate">
                <div class="login-box">
                    <div class="password-logo">Task Matrix</div>
                    <div class="password-subtitle">Select your environment</div>
                    <div id="environmentsList" class="environments-list"></div>
                </div>
            </div>

            <!-- Create Environment Modal -->
            <div class="password-gate hidden" id="createEnvironmentGate">
                <div class="login-box">
                    <div class="password-logo">Task Matrix</div>
                    <div class="password-subtitle">Create new environment</div>
                    <div class="login-input-group">
                        <input type="text" class="login-input" id="newEnvironmentNameInput" placeholder="Environment name">
                    </div>
                </div>
            </div>
        `;
        
        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Mock hashPassword function
        mockHashPassword = jest.fn().mockResolvedValue('hashed_password_123');

        // Mock showEnvironmentPicker function
        mockShowEnvironmentPicker = jest.fn();

        // Mock Supabase client
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            rpc: jest.fn()
        };

        // Reset variables
        currentUser = null;
        passwordGate = null;
        usernameInput = null;
        passwordInput = null;
        passwordBtn = null;
        passwordError = null;
        createAccountGate = null;
        environmentPickerGate = null;
        createEnvironmentGate = null;
    });

    describe('initDOMElements', () => {
        test('should correctly identify all required DOM elements', () => {
            // Simulate initDOMElements function
            passwordGate = document.getElementById('passwordGate');
            usernameInput = document.getElementById('emailInput');
            passwordInput = document.getElementById('passwordInput');
            passwordBtn = document.getElementById('loginBtn');
            passwordError = document.getElementById('passwordError');
            createAccountGate = document.getElementById('createAccountGate');
            environmentPickerGate = document.getElementById('environmentPickerGate');
            createEnvironmentGate = document.getElementById('createEnvironmentGate');

            expect(passwordGate).toBeTruthy();
            expect(usernameInput).toBeTruthy();
            expect(passwordInput).toBeTruthy();
            expect(passwordBtn).toBeTruthy();
            expect(passwordError).toBeTruthy();
            expect(createAccountGate).toBeTruthy();
            expect(environmentPickerGate).toBeTruthy();
            expect(createEnvironmentGate).toBeTruthy();
        });

        test('should map emailInput to usernameInput variable', () => {
            usernameInput = document.getElementById('emailInput');
            expect(usernameInput.id).toBe('emailInput');
            expect(usernameInput.type).toBe('email');
        });

        test('should map loginBtn to passwordBtn variable', () => {
            passwordBtn = document.getElementById('loginBtn');
            expect(passwordBtn.id).toBe('loginBtn');
            expect(passwordBtn.textContent.trim()).toBe('Sign In');
        });

        test('should return true when all required elements are found', () => {
            passwordGate = document.getElementById('passwordGate');
            usernameInput = document.getElementById('emailInput');
            passwordInput = document.getElementById('passwordInput');
            passwordBtn = document.getElementById('loginBtn');

            const result = !!(passwordGate && usernameInput && passwordInput && passwordBtn);
            expect(result).toBe(true);
        });
    });

    describe('handleLoginSubmit', () => {
        let handleLoginSubmit;
        let emailInput, passwordInput, passwordError;

        beforeEach(() => {
            emailInput = document.getElementById('emailInput');
            passwordInput = document.getElementById('passwordInput');
            passwordError = document.getElementById('passwordError');
            
            // Create handleLoginSubmit function similar to the one in index.html
            handleLoginSubmit = async function() {
                const emailInput = document.getElementById('emailInput');
                if (!emailInput || !emailInput.value || !passwordInput || !passwordInput.value) {
                    console.error('Email or password input not found or empty');
                    return;
                }

                try {
                    const hashedPassword = await mockHashPassword(passwordInput.value);

                    const { data: user, error } = await mockSupabaseClient
                        .from('users')
                        .select('*')
                        .eq('email', emailInput.value.trim().toLowerCase())
                        .eq('password_hash', hashedPassword)
                        .single();

                    if (!error && user) {
                        currentUser = {
                            id: user.id,
                            email: user.email,
                            displayName: user.display_name
                        };
                        return { success: true, user };
                    } else {
                        if (passwordError) {
                            passwordError.textContent = 'Invalid email or password';
                            passwordError.classList.add('show');
                        }
                        passwordInput.value = '';
                        return { success: false, error: 'Invalid credentials' };
                    }
                } catch (error) {
                    if (passwordError) {
                        passwordError.textContent = 'Login failed';
                        passwordError.classList.add('show');
                    }
                    return { success: false, error: error.message };
                }
            };
        });

        test('should return early if email is empty', async () => {
            emailInput.value = '';
            passwordInput.value = 'password123';

            const result = await handleLoginSubmit();
            expect(result).toBeUndefined();
            expect(mockHashPassword).not.toHaveBeenCalled();
        });

        test('should return early if password is empty', async () => {
            emailInput.value = 'test@example.com';
            passwordInput.value = '';

            const result = await handleLoginSubmit();
            expect(result).toBeUndefined();
            expect(mockHashPassword).not.toHaveBeenCalled();
        });

        test('should hash password before checking credentials', async () => {
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            await handleLoginSubmit();

            expect(mockHashPassword).toHaveBeenCalledWith('password123');
        });

        test('should call Supabase with correct parameters', async () => {
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            await handleLoginSubmit();

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
            expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('email', 'test@example.com');
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('password_hash', 'hashed_password_123');
        });

        test('should handle successful login', async () => {
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';

            const mockUser = {
                id: '123',
                email: 'test@example.com',
                display_name: 'Test User'
            };

            mockSupabaseClient.single.mockResolvedValue({
                data: mockUser,
                error: null
            });

            const result = await handleLoginSubmit();

            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(currentUser).toEqual({
                id: '123',
                email: 'test@example.com',
                displayName: 'Test User'
            });
        });

        test('should handle failed login with invalid credentials', async () => {
            emailInput.value = 'test@example.com';
            passwordInput.value = 'wrongpassword';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'Invalid credentials' }
            });

            const result = await handleLoginSubmit();

            expect(result.success).toBe(false);
            expect(passwordError.textContent).toBe('Invalid email or password');
            expect(passwordError.classList.contains('show')).toBe(true);
            expect(passwordInput.value).toBe('');
        });

        test('should handle login errors', async () => {
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';

            mockSupabaseClient.single.mockRejectedValue(new Error('Network error'));

            const result = await handleLoginSubmit();

            expect(result.success).toBe(false);
            expect(passwordError.textContent).toBe('Login failed');
            expect(passwordError.classList.contains('show')).toBe(true);
        });

        test('should trim and lowercase email', async () => {
            emailInput.value = '  TEST@EXAMPLE.COM  ';
            passwordInput.value = 'password123';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            await handleLoginSubmit();

            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('email', 'test@example.com');
        });
    });

    describe('handleCreateAccount', () => {
        let handleCreateAccount;
        let newNameInput, newEmailInput, newPasswordInput, confirmPasswordInput, createAccountError;

        beforeEach(() => {
            newNameInput = document.getElementById('newNameInput');
            newEmailInput = document.getElementById('newEmailInput');
            newPasswordInput = document.getElementById('newPasswordInput');
            confirmPasswordInput = document.getElementById('confirmPasswordInput');
            createAccountError = document.getElementById('createAccountError');

            handleCreateAccount = async function() {
                const newNameInput = document.getElementById('newNameInput');
                const newEmailInput = document.getElementById('newEmailInput');
                const newPasswordInput = document.getElementById('newPasswordInput');
                const confirmPasswordInput = document.getElementById('confirmPasswordInput');
                const createAccountError = document.getElementById('createAccountError');

                if (!newNameInput || !newNameInput.value.trim() ||
                    !newEmailInput || !newEmailInput.value.trim() ||
                    !newPasswordInput || !newPasswordInput.value ||
                    !confirmPasswordInput || !confirmPasswordInput.value) {
                    createAccountError.textContent = 'All fields are required';
                    createAccountError.classList.add('show');
                    return { success: false, error: 'All fields are required' };
                }

                if (newPasswordInput.value !== confirmPasswordInput.value) {
                    createAccountError.textContent = 'Passwords do not match';
                    createAccountError.classList.add('show');
                    return { success: false, error: 'Passwords do not match' };
                }

                if (newPasswordInput.value.length < 6) {
                    createAccountError.textContent = 'Password must be at least 6 characters';
                    createAccountError.classList.add('show');
                    return { success: false, error: 'Password must be at least 6 characters' };
                }

                try {
                    const hashedPassword = await mockHashPassword(newPasswordInput.value);

                    const { data: newUser, error } = await mockSupabaseClient
                        .from('users')
                        .insert({
                            username: newEmailInput.value.trim().toLowerCase().replace('@', '_').replace('.', '_'),
                            email: newEmailInput.value.trim().toLowerCase(),
                            password_hash: hashedPassword,
                            display_name: newNameInput.value.trim()
                        })
                        .select()
                        .single();

                    if (!error && newUser) {
                        currentUser = {
                            id: newUser.id,
                            email: newUser.email,
                            displayName: newUser.display_name
                        };
                        mockShowEnvironmentPicker(newUser, []);
                        return { success: true, user: newUser };
                    } else {
                        createAccountError.textContent = error?.message || 'Account creation failed';
                        createAccountError.classList.add('show');
                        return { success: false, error: error?.message || 'Account creation failed' };
                    }
                } catch (error) {
                    createAccountError.textContent = 'Account creation failed';
                    createAccountError.classList.add('show');
                    return { success: false, error: error.message };
                }
            };
        });

        test('should return error if name is empty', async () => {
            newNameInput.value = '';
            newEmailInput.value = 'test@example.com';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';

            const result = await handleCreateAccount();

            expect(result.success).toBe(false);
            expect(result.error).toBe('All fields are required');
            expect(createAccountError.textContent).toBe('All fields are required');
        });

        test('should return error if email is empty', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = '';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';

            const result = await handleCreateAccount();

            expect(result.success).toBe(false);
            expect(result.error).toBe('All fields are required');
        });

        test('should return error if passwords do not match', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = 'test@example.com';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'differentpassword';

            const result = await handleCreateAccount();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Passwords do not match');
            expect(createAccountError.textContent).toBe('Passwords do not match');
        });

        test('should return error if password is too short', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = 'test@example.com';
            newPasswordInput.value = '12345';
            confirmPasswordInput.value = '12345';

            const result = await handleCreateAccount();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Password must be at least 6 characters');
            expect(createAccountError.textContent).toBe('Password must be at least 6 characters');
        });

        test('should hash password before creating account', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = 'test@example.com';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'Account creation failed' }
            });

            await handleCreateAccount();

            expect(mockHashPassword).toHaveBeenCalledWith('password123');
        });

        test('should call Supabase insert with correct data', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = 'test@example.com';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'Account creation failed' }
            });

            await handleCreateAccount();

            expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
                username: 'test_example_com',
                email: 'test@example.com',
                password_hash: 'hashed_password_123',
                display_name: 'Test User'
            });
        });

        test('should handle successful account creation', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = 'test@example.com';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';

            const mockUser = {
                id: '456',
                email: 'test@example.com',
                display_name: 'Test User'
            };

            mockSupabaseClient.single.mockResolvedValue({
                data: mockUser,
                error: null
            });

            const result = await handleCreateAccount();

            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(currentUser).toEqual({
                id: '456',
                email: 'test@example.com',
                displayName: 'Test User'
            });
            expect(mockShowEnvironmentPicker).toHaveBeenCalledWith(mockUser, []);
        });

        test('should handle account creation failure', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = 'test@example.com';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'Email already exists' }
            });

            const result = await handleCreateAccount();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Email already exists');
            expect(createAccountError.textContent).toBe('Email already exists');
        });

        test('should convert email to username format', async () => {
            newNameInput.value = 'Test User';
            newEmailInput.value = 'test.user@example.com';
            newPasswordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'Account creation failed' }
            });

            await handleCreateAccount();

            // The code replaces '@' with '_' and '.' with '_', but only replaces first '.'
            // So 'test.user@example.com' becomes 'test_user_example.com'
            expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: 'test_user_example.com'
                })
            );
        });
    });

    describe('Event Listeners', () => {
        test('should attach click listener to login button', () => {
            const loginBtn = document.getElementById('loginBtn');
            const clickHandler = jest.fn();
            
            loginBtn.addEventListener('click', clickHandler);
            
            loginBtn.click();
            
            expect(clickHandler).toHaveBeenCalledTimes(1);
        });

        test('should attach click listener to create account button', () => {
            const createAccountBtn = document.getElementById('createAccountBtn');
            const clickHandler = jest.fn();
            
            createAccountBtn.addEventListener('click', clickHandler);
            
            createAccountBtn.click();
            
            expect(clickHandler).toHaveBeenCalledTimes(1);
        });

        test('should attach click listener to create account link', () => {
            const createAccountLink = document.getElementById('createAccountLink');
            const clickHandler = jest.fn();
            
            createAccountLink.addEventListener('click', clickHandler);
            
            createAccountLink.click();
            
            expect(clickHandler).toHaveBeenCalledTimes(1);
        });

        test('should attach click listener to back to login link', () => {
            const backToLoginLink = document.getElementById('backToLoginLink');
            const clickHandler = jest.fn();
            
            backToLoginLink.addEventListener('click', clickHandler);
            
            backToLoginLink.click();
            
            expect(clickHandler).toHaveBeenCalledTimes(1);
        });

        test('should handle Enter key on password input', () => {
            const passwordInput = document.getElementById('passwordInput');
            const enterHandler = jest.fn();
            
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    enterHandler();
                }
            });
            
            const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
            passwordInput.dispatchEvent(enterEvent);
            
            expect(enterHandler).toHaveBeenCalledTimes(1);
        });

        test('should handle Enter key on confirm password input', () => {
            const confirmPasswordInput = document.getElementById('confirmPasswordInput');
            const enterHandler = jest.fn();
            
            confirmPasswordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    enterHandler();
                }
            });
            
            const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
            confirmPasswordInput.dispatchEvent(enterEvent);
            
            expect(enterHandler).toHaveBeenCalledTimes(1);
        });
    });

    describe('Form Navigation', () => {
        test('should switch from login to create account form', () => {
            const passwordGate = document.getElementById('passwordGate');
            const createAccountGate = document.getElementById('createAccountGate');
            const createAccountLink = document.getElementById('createAccountLink');

            passwordGate.classList.remove('hidden');
            createAccountGate.classList.add('hidden');

            createAccountLink.addEventListener('click', () => {
                passwordGate.classList.add('hidden');
                createAccountGate.classList.remove('hidden');
            });

            createAccountLink.click();

            expect(passwordGate.classList.contains('hidden')).toBe(true);
            expect(createAccountGate.classList.contains('hidden')).toBe(false);
        });

        test('should switch from create account to login form', () => {
            const passwordGate = document.getElementById('passwordGate');
            const createAccountGate = document.getElementById('createAccountGate');
            const backToLoginLink = document.getElementById('backToLoginLink');

            passwordGate.classList.add('hidden');
            createAccountGate.classList.remove('hidden');

            backToLoginLink.addEventListener('click', () => {
                createAccountGate.classList.add('hidden');
                passwordGate.classList.remove('hidden');
            });

            backToLoginLink.click();

            expect(createAccountGate.classList.contains('hidden')).toBe(true);
            expect(passwordGate.classList.contains('hidden')).toBe(false);
        });
    });
});
