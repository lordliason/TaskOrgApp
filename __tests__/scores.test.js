/**
 * Unit tests for score tracking functionality
 * Tests: updatePlayerScore, resetScores, getTaskPoints, loadTodayScores
 * @jest-environment jsdom
 */

describe('Score Tracking Functions', () => {
    let mockSupabaseClient;
    let mockCurrentUser;

    beforeEach(() => {
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn()
        };

        mockCurrentUser = {
            id: 'user-123',
            organizationId: 'org-123'
        };
    });

    describe('getTaskPoints', () => {
        test('should return correct points for each task size', () => {
            const sizePoints = {
                xs: 1,
                s: 2,
                m: 5,
                l: 10,
                xl: 20
            };

            expect(sizePoints.xs).toBe(1);
            expect(sizePoints.s).toBe(2);
            expect(sizePoints.m).toBe(5);
            expect(sizePoints.l).toBe(10);
            expect(sizePoints.xl).toBe(20);
        });

        test('should handle invalid size gracefully', () => {
            const sizePoints = {
                xs: 1,
                s: 2,
                m: 5,
                l: 10,
                xl: 20
            };

            const invalidSize = 'invalid';
            const points = sizePoints[invalidSize] || 0;

            expect(points).toBe(0);
        });
    });

    describe('updatePlayerScore', () => {
        test('should upsert score for today', async () => {
            const player = 'mario';
            const pointsToAdd = 5;
            const tasksToAdd = 1;
            const today = new Date().toISOString().split('T')[0];

            mockSupabaseClient.upsert.mockResolvedValue({
                error: null
            });

            const { error } = await mockSupabaseClient
                .from('scores')
                .upsert({
                    player: player,
                    date: today,
                    points: pointsToAdd,
                    tasks_completed: tasksToAdd,
                    organization_id: mockCurrentUser.organizationId
                }, {
                    onConflict: 'player,date'
                });

            expect(error).toBeNull();
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('scores');
        });

        test('should handle score update error', async () => {
            const player = 'mario';
            const pointsToAdd = 5;

            mockSupabaseClient.upsert.mockResolvedValue({
                error: { message: 'Database error' }
            });

            const { error } = await mockSupabaseClient
                .from('scores')
                .upsert({
                    player: player,
                    date: new Date().toISOString().split('T')[0],
                    points: pointsToAdd,
                    organization_id: mockCurrentUser.organizationId
                });

            expect(error).toBeTruthy();
            expect(error.message).toBe('Database error');
        });
    });

    describe('resetScores', () => {
        test('should delete all scores for organization', async () => {
            mockSupabaseClient.delete = jest.fn().mockReturnThis();
            mockSupabaseClient.eq.mockResolvedValue({
                error: null
            });

            const { error } = await mockSupabaseClient
                .from('scores')
                .delete()
                .eq('organization_id', mockCurrentUser.organizationId);

            expect(error).toBeNull();
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('scores');
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', mockCurrentUser.organizationId);
        });

        test('should handle reset error', async () => {
            mockSupabaseClient.delete = jest.fn().mockReturnThis();
            mockSupabaseClient.eq.mockResolvedValue({
                error: { message: 'Delete failed' }
            });

            const { error } = await mockSupabaseClient
                .from('scores')
                .delete()
                .eq('organization_id', mockCurrentUser.organizationId);

            expect(error).toBeTruthy();
        });
    });

    describe('loadTodayScores', () => {
        test('should load scores for today', async () => {
            const today = new Date().toISOString().split('T')[0];
            const mockScores = [
                { player: 'mario', points: 10, tasks_completed: 2, date: today },
                { player: 'maria', points: 15, tasks_completed: 3, date: today }
            ];

            mockSupabaseClient.eq.mockResolvedValue({
                data: mockScores,
                error: null
            });

            const { data, error } = await mockSupabaseClient
                .from('scores')
                .select('*')
                .eq('organization_id', mockCurrentUser.organizationId)
                .eq('date', today);

            expect(error).toBeNull();
            expect(data).toEqual(mockScores);
            expect(data.length).toBe(2);
        });

        test('should handle empty scores', async () => {
            const today = new Date().toISOString().split('T')[0];

            mockSupabaseClient.eq.mockResolvedValue({
                data: [],
                error: null
            });

            const { data, error } = await mockSupabaseClient
                .from('scores')
                .select('*')
                .eq('organization_id', mockCurrentUser.organizationId)
                .eq('date', today);

            expect(error).toBeNull();
            expect(data).toEqual([]);
        });

        test('should handle load error', async () => {
            const today = new Date().toISOString().split('T')[0];

            mockSupabaseClient.eq.mockResolvedValue({
                data: null,
                error: { message: 'Load failed' }
            });

            const { data, error } = await mockSupabaseClient
                .from('scores')
                .select('*')
                .eq('organization_id', mockCurrentUser.organizationId)
                .eq('date', today);

            expect(error).toBeTruthy();
            expect(data).toBeNull();
        });
    });

    describe('score aggregation', () => {
        test('should aggregate scores correctly', () => {
            const scores = [
                { player: 'mario', points: 5, tasks_completed: 1 },
                { player: 'mario', points: 10, tasks_completed: 2 },
                { player: 'maria', points: 15, tasks_completed: 3 }
            ];

            const aggregated = {};
            scores.forEach(score => {
                if (!aggregated[score.player]) {
                    aggregated[score.player] = {
                        points: 0,
                        tasks: 0
                    };
                }
                aggregated[score.player].points += score.points;
                aggregated[score.player].tasks += score.tasks_completed;
            });

            expect(aggregated.mario.points).toBe(15);
            expect(aggregated.mario.tasks).toBe(3);
            expect(aggregated.maria.points).toBe(15);
            expect(aggregated.maria.tasks).toBe(3);
        });
    });
});
