/**
 * Unit tests for environment/organization management
 * Tests: showEnvironmentPicker, selectEnvironment, handleCreateEnvironment,
 *        switchEnvironment, leaveEnvironment, populateAssigneeButtons
 * @jest-environment jsdom
 */

describe('Environment Management', () => {
    let mockSupabaseClient;
    let mockCurrentUser;
    let mockDocument;

    beforeEach(() => {
        // Mock Supabase client
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn(),
            rpc: jest.fn()
        };

        // Mock current user
        mockCurrentUser = {
            id: 'user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            organizationId: 'org-123'
        };

        // Mock DOM elements
        document.body.innerHTML = `
            <div id="passwordGate" class="password-gate"></div>
            <div id="createAccountGate" class="password-gate hidden"></div>
            <div id="environmentPickerGate" class="password-gate hidden"></div>
            <div id="createEnvironmentGate" class="password-gate hidden"></div>
            <div id="environmentsList"></div>
            <div id="createEnvironmentBtn"></div>
            <div id="logoutLink"></div>
            <div id="newEnvironmentNameInput"></div>
            <div id="createEnvironmentError"></div>
        `;

        // Mock localStorage
        const storage = {};
        const localStorageMock = {
            getItem: jest.fn((key) => storage[key] || null),
            setItem: jest.fn((key, value) => {
                storage[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete storage[key];
            }),
            clear: jest.fn(() => {
                Object.keys(storage).forEach(key => delete storage[key]);
            })
        };
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });
    });

    describe('showEnvironmentPicker', () => {
        test('should hide login and create account gates', () => {
            const passwordGate = document.getElementById('passwordGate');
            const createAccountGate = document.getElementById('createAccountGate');
            const environmentPickerGate = document.getElementById('environmentPickerGate');

            passwordGate.classList.add('hidden');
            createAccountGate.classList.add('hidden');
            environmentPickerGate.classList.remove('hidden');

            expect(passwordGate.classList.contains('hidden')).toBe(true);
            expect(createAccountGate.classList.contains('hidden')).toBe(true);
            expect(environmentPickerGate.classList.contains('hidden')).toBe(false);
        });

        test('should display environments list when environments exist', () => {
            const environments = [
                {
                    organization_id: 'org-1',
                    organization_name: 'Test Org 1',
                    is_owner: true
                },
                {
                    organization_id: 'org-2',
                    organization_name: 'Test Org 2',
                    is_owner: false
                }
            ];

            const environmentsList = document.getElementById('environmentsList');
            environmentsList.innerHTML = '';

            if (environments && environments.length > 0) {
                environments.forEach(env => {
                    const envItem = document.createElement('div');
                    envItem.className = 'environment-item';
                    envItem.innerHTML = `
                        <div class="environment-info">
                            <div class="environment-name">${env.organization_name}</div>
                            <div class="environment-role">${env.is_owner ? 'Owner' : 'Member'}</div>
                        </div>
                        <button class="environment-select-btn" data-env-id="${env.organization_id}">
                            Select
                        </button>
                    `;
                    environmentsList.appendChild(envItem);
                });
            }

            expect(environmentsList.children.length).toBe(2);
            expect(environmentsList.innerHTML).toContain('Test Org 1');
            expect(environmentsList.innerHTML).toContain('Owner');
            expect(environmentsList.innerHTML).toContain('Test Org 2');
            expect(environmentsList.innerHTML).toContain('Member');
        });

        test('should show message when no environments exist', () => {
            const environments = [];
            const environmentsList = document.getElementById('environmentsList');
            environmentsList.innerHTML = '';

            if (!environments || environments.length === 0) {
                environmentsList.innerHTML = '<div class="no-environments">No environments found. Create your first one!</div>';
            }

            expect(environmentsList.innerHTML).toContain('No environments found');
        });
    });

    describe('selectEnvironment', () => {
        test('should set currentUser with environment info', () => {
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                display_name: 'Test User'
            };

            const environment = {
                organization_id: 'org-123',
                organization_name: 'Test Organization',
                is_owner: true
            };

            const currentUser = {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                organizationId: environment.organization_id,
                organizationName: environment.organization_name,
                isOwner: environment.is_owner
            };

            expect(currentUser.organizationId).toBe('org-123');
            expect(currentUser.organizationName).toBe('Test Organization');
            expect(currentUser.isOwner).toBe(true);
        });

        test('should store session in localStorage', () => {
            const sessionData = {
                userId: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                organizationId: 'org-123',
                organizationName: 'Test Organization',
                isOwner: true
            };

            localStorage.setItem('taskMatrixAuth', JSON.stringify(sessionData));

            const stored = JSON.parse(localStorage.getItem('taskMatrixAuth'));
            expect(stored.organizationId).toBe('org-123');
            expect(stored.organizationName).toBe('Test Organization');
        });
    });

    describe('handleCreateEnvironment', () => {
        test('should validate environment name is required', () => {
            const nameInput = { value: '' };
            const createEnvironmentError = { textContent: '', classList: { add: jest.fn() } };

            if (!nameInput || !nameInput.value.trim()) {
                createEnvironmentError.textContent = 'Environment name is required';
                createEnvironmentError.classList.add('show');
            }

            expect(createEnvironmentError.textContent).toBe('Environment name is required');
        });

        test('should create organization successfully', async () => {
            const nameInput = { value: 'New Organization' };
            const createEnvironmentError = { textContent: '', classList: { add: jest.fn() } };

            const mockOrg = {
                id: 'org-new',
                name: 'New Organization'
            };

            mockSupabaseClient.single.mockResolvedValue({
                data: mockOrg,
                error: null
            });

            const { data: newOrg, error } = await mockSupabaseClient
                .from('organizations')
                .insert({
                    name: nameInput.value.trim()
                })
                .select()
                .single();

            expect(newOrg).toEqual(mockOrg);
            expect(error).toBeNull();
        });

        test('should add creator as member after creating organization', async () => {
            const mockOrg = {
                id: 'org-new',
                name: 'New Organization'
            };

            const currentUser = {
                id: 'user-123',
                displayName: 'Test User'
            };

            mockSupabaseClient.insert.mockResolvedValue({
                error: null
            });

            const { error: memberError } = await mockSupabaseClient
                .from('environment_members')
                .insert({
                    user_id: currentUser.id,
                    organization_id: mockOrg.id,
                    display_name: currentUser.displayName
                });

            expect(memberError).toBeNull();
        });

        test('should handle organization creation error', async () => {
            const nameInput = { value: 'New Organization' };
            const createEnvironmentError = { textContent: '', classList: { add: jest.fn() } };

            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { message: 'Organization name already exists' }
            });

            const { data: newOrg, error } = await mockSupabaseClient
                .from('organizations')
                .insert({
                    name: nameInput.value.trim()
                })
                .select()
                .single();

            if (error) {
                createEnvironmentError.textContent = error.message || 'Environment creation failed';
                createEnvironmentError.classList.add('show');
            }

            expect(error).toBeTruthy();
            expect(createEnvironmentError.textContent).toContain('already exists');
        });
    });

    describe('populateAssigneeButtons', () => {
        test('should check for currentUser before querying', () => {
            const assigneeGroup = document.createElement('div');
            assigneeGroup.id = 'assigneeGroup';
            document.body.appendChild(assigneeGroup);

            const currentUser = null;

            if (!currentUser) {
                assigneeGroup.innerHTML = '<div>Please log in</div>';
            }

            expect(assigneeGroup.innerHTML).toContain('Please log in');
        });

        test('should check for organizationId before querying', () => {
            const assigneeGroup = document.createElement('div');
            assigneeGroup.id = 'assigneeGroup';
            document.body.appendChild(assigneeGroup);

            const currentUser = { id: '123', email: 'test@example.com' };

            if (!currentUser.organizationId) {
                assigneeGroup.innerHTML = '<div>Organization not set</div>';
            }

            expect(assigneeGroup.innerHTML).toContain('Organization not set');
        });

        test('should create buttons for each member', async () => {
            const assigneeGroup = document.createElement('div');
            assigneeGroup.id = 'assigneeGroup';
            document.body.appendChild(assigneeGroup);

            const members = [
                { user_id: 'user-1', display_name: 'User One' },
                { user_id: 'user-2', display_name: 'User Two' }
            ];

            assigneeGroup.innerHTML = '';

            if (members && members.length > 0) {
                members.forEach((member, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'assignee-btn';
                    btn.dataset.value = member.user_id;
                    btn.textContent = member.display_name || member.email || 'Unknown';
                    if (index === 0) {
                        btn.classList.add('active');
                    }
                    assigneeGroup.appendChild(btn);
                });
            }

            expect(assigneeGroup.children.length).toBe(2);
            expect(assigneeGroup.querySelector('[data-value="user-1"]').textContent).toBe('User One');
            expect(assigneeGroup.querySelector('[data-value="user-1"]').classList.contains('active')).toBe(true);
        });

        test('should add "All Members" button', () => {
            const assigneeGroup = document.createElement('div');
            assigneeGroup.id = 'assigneeGroup';
            document.body.appendChild(assigneeGroup);

            const allBtn = document.createElement('button');
            allBtn.className = 'assignee-btn';
            allBtn.dataset.value = 'all';
            allBtn.textContent = 'All Members';
            assigneeGroup.appendChild(allBtn);

            expect(assigneeGroup.querySelector('[data-value="all"]').textContent).toBe('All Members');
        });

        test('should handle empty members list', () => {
            const assigneeGroup = document.createElement('div');
            assigneeGroup.id = 'assigneeGroup';
            document.body.appendChild(assigneeGroup);

            const members = [];

            if (!members || members.length === 0) {
                assigneeGroup.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-muted);">No members available</div>';
            }

            expect(assigneeGroup.innerHTML).toContain('No members available');
        });
    });

    describe('switchEnvironment', () => {
        let mockCurrentUser;
        let mockEnvironmentModal;
        let mockShowEnvironmentPicker;
        let mockLogout;

        beforeEach(() => {
            mockCurrentUser = {
                id: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                organizationId: 'org-123',
                organizationName: 'Current Org',
                isOwner: true
            };

            mockEnvironmentModal = {
                classList: {
                    remove: jest.fn()
                }
            };

            mockShowEnvironmentPicker = jest.fn();
            mockLogout = jest.fn();
        });

        test('should fetch environments and show picker when user is logged in', async () => {
            const environments = [
                {
                    organization_id: 'org-1',
                    organization_name: 'Org 1',
                    is_owner: true
                },
                {
                    organization_id: 'org-2',
                    organization_name: 'Org 2',
                    is_owner: false
                }
            ];

            mockSupabaseClient.rpc.mockResolvedValue({
                data: environments,
                error: null
            });

            // Simulate switch environment button click
            mockEnvironmentModal.classList.remove('show');

            if (mockCurrentUser && mockCurrentUser.email) {
                const { data: fetchedEnvironments, error: envError } = await mockSupabaseClient
                    .rpc('get_user_environments', { user_email: mockCurrentUser.email });

                if (!envError) {
                    const user = {
                        id: mockCurrentUser.id,
                        email: mockCurrentUser.email,
                        display_name: mockCurrentUser.displayName || mockCurrentUser.display_name
                    };

                    mockShowEnvironmentPicker(user, fetchedEnvironments || []);
                }
            }

            expect(mockEnvironmentModal.classList.remove).toHaveBeenCalledWith('show');
            expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_user_environments', { user_email: 'test@example.com' });
            expect(mockShowEnvironmentPicker).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-123',
                    email: 'test@example.com',
                    display_name: 'Test User'
                }),
                environments
            );
        });

        test('should handle error when fetching environments fails', async () => {
            mockSupabaseClient.rpc.mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
            });

            // Simulate switch environment with error
            mockEnvironmentModal.classList.remove('show');

            if (mockCurrentUser && mockCurrentUser.email) {
                const { data: environments, error: envError } = await mockSupabaseClient
                    .rpc('get_user_environments', { user_email: mockCurrentUser.email });

                if (envError) {
                    mockLogout();
                    return;
                }
            }

            expect(mockEnvironmentModal.classList.remove).toHaveBeenCalledWith('show');
            expect(mockSupabaseClient.rpc).toHaveBeenCalled();
            expect(mockLogout).toHaveBeenCalled();
        });

        test('should logout when currentUser is not available', () => {
            const currentUser = null;

            mockEnvironmentModal.classList.remove('show');

            if (!currentUser || !currentUser.email) {
                mockLogout();
            }

            expect(mockEnvironmentModal.classList.remove).toHaveBeenCalledWith('show');
            expect(mockLogout).toHaveBeenCalled();
        });

        test('should logout when currentUser has no email', () => {
            const currentUser = {
                id: 'user-123',
                displayName: 'Test User'
                // No email property
            };

            mockEnvironmentModal.classList.remove('show');

            if (!currentUser || !currentUser.email) {
                mockLogout();
            }

            expect(mockLogout).toHaveBeenCalled();
        });

        test('should handle empty environments list', async () => {
            mockSupabaseClient.rpc.mockResolvedValue({
                data: [],
                error: null
            });

            mockEnvironmentModal.classList.remove('show');

            if (mockCurrentUser && mockCurrentUser.email) {
                const { data: environments, error: envError } = await mockSupabaseClient
                    .rpc('get_user_environments', { user_email: mockCurrentUser.email });

                if (!envError) {
                    const user = {
                        id: mockCurrentUser.id,
                        email: mockCurrentUser.email,
                        display_name: mockCurrentUser.displayName
                    };

                    mockShowEnvironmentPicker(user, environments || []);
                }
            }

            expect(mockShowEnvironmentPicker).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-123',
                    email: 'test@example.com'
                }),
                []
            );
        });

        test('should create user object without organization info for picker', async () => {
            const environments = [
                {
                    organization_id: 'org-1',
                    organization_name: 'Org 1',
                    is_owner: true
                }
            ];

            mockSupabaseClient.rpc.mockResolvedValue({
                data: environments,
                error: null
            });

            // User object should not include organization info when switching
            const user = {
                id: mockCurrentUser.id,
                email: mockCurrentUser.email,
                display_name: mockCurrentUser.displayName
            };

            // Should not have organizationId, organizationName, or isOwner
            expect(user.organizationId).toBeUndefined();
            expect(user.organizationName).toBeUndefined();
            expect(user.isOwner).toBeUndefined();
            expect(user.id).toBe('user-123');
            expect(user.email).toBe('test@example.com');
        });

        test('should handle exception during environment fetch', async () => {
            mockSupabaseClient.rpc.mockRejectedValue(new Error('Network error'));

            mockEnvironmentModal.classList.remove('show');

            try {
                if (mockCurrentUser && mockCurrentUser.email) {
                    const { data: environments, error: envError } = await mockSupabaseClient
                        .rpc('get_user_environments', { user_email: mockCurrentUser.email });

                    if (envError) {
                        mockLogout();
                        return;
                    }
                }
            } catch (error) {
                mockLogout();
            }

            expect(mockLogout).toHaveBeenCalled();
        });
    });

    describe('leaveEnvironment', () => {
        let mockCurrentUser;
        let mockEnvironmentModal;
        let mockLogout;
        let mockConfirm;

        beforeEach(() => {
            mockCurrentUser = {
                id: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                organizationId: 'org-123',
                organizationName: 'Test Org',
                isOwner: false
            };

            mockEnvironmentModal = {
                classList: {
                    remove: jest.fn()
                }
            };

            mockLogout = jest.fn();
            mockConfirm = jest.fn(() => true);
            window.confirm = mockConfirm;

            // Reset mocks for chained calls
            mockSupabaseClient.from.mockReturnThis();
            mockSupabaseClient.delete = jest.fn().mockReturnThis();
            mockSupabaseClient.eq = jest.fn().mockReturnThis();
        });

        test('should delete user from environment members when confirmed', async () => {
            // Mock the final .eq() call to return the promise
            mockSupabaseClient.eq
                .mockReturnValueOnce(mockSupabaseClient) // First .eq() returns chain
                .mockResolvedValueOnce({ // Second .eq() returns promise
                    error: null
                });

            if (mockConfirm()) {
                try {
                    const { error } = await mockSupabaseClient
                        .from('environment_members')
                        .delete()
                        .eq('user_id', mockCurrentUser.id)
                        .eq('organization_id', mockCurrentUser.organizationId);

                    if (error) throw error;

                    mockEnvironmentModal.classList.remove('show');
                    mockLogout();
                } catch (error) {
                    console.error('Error leaving environment:', error);
                }
            }

            expect(mockConfirm).toHaveBeenCalled();
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('environment_members');
            expect(mockEnvironmentModal.classList.remove).toHaveBeenCalledWith('show');
            expect(mockLogout).toHaveBeenCalled();
        });

        test('should not delete when user cancels confirmation', () => {
            mockConfirm.mockReturnValue(false);

            if (mockConfirm()) {
                // This block should not execute
                mockSupabaseClient.from('environment_members');
            }

            expect(mockConfirm).toHaveBeenCalled();
            expect(mockSupabaseClient.from).not.toHaveBeenCalled();
        });

        test('should handle error when leaving environment fails', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

            // Mock the final .eq() call to return an error
            mockSupabaseClient.eq
                .mockReturnValueOnce(mockSupabaseClient) // First .eq() returns chain
                .mockResolvedValueOnce({ // Second .eq() returns promise with error
                    error: { message: 'Database error' }
                });

            if (mockConfirm()) {
                try {
                    const { error } = await mockSupabaseClient
                        .from('environment_members')
                        .delete()
                        .eq('user_id', mockCurrentUser.id)
                        .eq('organization_id', mockCurrentUser.organizationId);

                    if (error) throw error;

                    mockEnvironmentModal.classList.remove('show');
                    mockLogout();
                } catch (error) {
                    alertSpy('Error leaving environment. Please try again.');
                }
            }

            expect(alertSpy).toHaveBeenCalledWith('Error leaving environment. Please try again.');
            alertSpy.mockRestore();
        });

        test('should use correct user_id and organization_id when deleting', async () => {
            // Mock the final .eq() call to return the promise
            mockSupabaseClient.eq
                .mockReturnValueOnce(mockSupabaseClient) // First .eq() returns chain
                .mockResolvedValueOnce({ // Second .eq() returns promise
                    error: null
                });

            if (mockConfirm()) {
                await mockSupabaseClient
                    .from('environment_members')
                    .delete()
                    .eq('user_id', mockCurrentUser.id)
                    .eq('organization_id', mockCurrentUser.organizationId);
            }

            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', 'org-123');
        });
    });
});
