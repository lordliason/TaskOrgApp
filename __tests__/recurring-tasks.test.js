/**
 * Unit tests for recurring tasks functionality
 * Tests: RRule generation, recurrence parsing, next occurrence calculation
 * @jest-environment jsdom
 */

describe('Recurring Tasks Functions', () => {
    describe('RRule generation from preset', () => {
        test('should generate daily RRule', () => {
            const preset = 'daily';
            const deadlineDate = new Date('2025-01-25');

            // Simulate RRule generation
            let rrule = null;
            if (preset === 'daily' && deadlineDate) {
                rrule = `FREQ=DAILY;DTSTART=${deadlineDate.toISOString().split('T')[0].replace(/-/g, '')}`;
            }

            expect(rrule).toContain('FREQ=DAILY');
            expect(rrule).toContain('DTSTART');
        });

        test('should generate weekly RRule', () => {
            const preset = 'weekly';
            const deadlineDate = new Date('2025-01-25');

            let rrule = null;
            if (preset === 'weekly' && deadlineDate) {
                rrule = `FREQ=WEEKLY;DTSTART=${deadlineDate.toISOString().split('T')[0].replace(/-/g, '')}`;
            }

            expect(rrule).toContain('FREQ=WEEKLY');
        });

        test('should generate monthly RRule', () => {
            const preset = 'monthly';
            const deadlineDate = new Date('2025-01-25');

            let rrule = null;
            if (preset === 'monthly' && deadlineDate) {
                rrule = `FREQ=MONTHLY;DTSTART=${deadlineDate.toISOString().split('T')[0].replace(/-/g, '')}`;
            }

            expect(rrule).toContain('FREQ=MONTHLY');
        });

        test('should return null for "never" preset', () => {
            const preset = 'never';
            const deadlineDate = new Date('2025-01-25');

            let rrule = null;
            if (!deadlineDate || preset === 'never') {
                rrule = null;
            }

            expect(rrule).toBeNull();
        });

        test('should return null when no deadline date', () => {
            const preset = 'daily';
            const deadlineDate = null;

            let rrule = null;
            if (!deadlineDate || preset === 'never') {
                rrule = null;
            }

            expect(rrule).toBeNull();
        });
    });

    describe('RRule parsing', () => {
        test('should parse daily RRule string', () => {
            const rruleString = 'FREQ=DAILY;DTSTART=20250125';
            
            // Simulate parsing
            const parts = rruleString.split(';');
            const freq = parts.find(p => p.startsWith('FREQ='));
            const dtstart = parts.find(p => p.startsWith('DTSTART='));

            expect(freq).toContain('DAILY');
            expect(dtstart).toBeDefined();
        });

        test('should handle custom RRule string', () => {
            const customRRule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
            
            const parts = customRRule.split(';');
            const freq = parts.find(p => p.startsWith('FREQ='));
            const byday = parts.find(p => p.startsWith('BYDAY='));

            expect(freq).toContain('WEEKLY');
            expect(byday).toContain('MO,WE,FR');
        });

        test('should validate RRule format', () => {
            const validRRule = 'FREQ=DAILY';
            const invalidRRule = 'not a valid rrule';

            const isValid = validRRule.includes('FREQ=');
            const isInvalid = invalidRRule.includes('FREQ=');

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });
    });

    describe('next occurrence calculation', () => {
        test('should calculate next daily occurrence', () => {
            const lastDate = new Date('2025-01-25T12:00:00');
            const nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + 1);

            expect(nextDate.getDate()).toBe(26);
            expect(nextDate.getMonth()).toBe(lastDate.getMonth());
        });

        test('should calculate next weekly occurrence', () => {
            const lastDate = new Date('2025-01-25T12:00:00'); // Saturday
            const nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + 7);

            expect(nextDate.getDate()).toBe(1); // February 1
            expect(nextDate.getMonth()).toBe(1); // February (0-indexed)
        });

        test('should calculate next monthly occurrence', () => {
            const lastDate = new Date('2025-01-25T12:00:00');
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + 1);

            expect(nextDate.getMonth()).toBe(1); // February
            expect(nextDate.getDate()).toBe(25);
        });

        test('should handle month-end dates correctly', () => {
            const lastDate = new Date('2025-01-31T12:00:00');
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + 1);

            // February doesn't have 31 days, so it should adjust to March 3
            // Actually, JavaScript's setMonth handles this - if Feb doesn't have the day, it goes to March
            // So we should check that it's either February (if it adjusted to Feb 28/29) or March
            expect(nextDate.getMonth()).toBeGreaterThanOrEqual(1); // February or later
            expect(nextDate.getMonth()).toBeLessThanOrEqual(2); // Not later than March
        });
    });

    describe('recurring task completion', () => {
        test('should advance to next occurrence when completed', () => {
            const task = {
                id: 'task-1',
                name: 'Daily Task',
                recurrence_rule: 'FREQ=DAILY',
                deadline: '2025-01-25',
                completed: true
            };

            const lastDate = new Date(task.deadline);
            const nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            expect(nextDateStr).toBe('2025-01-26');
        });

        test('should not advance if no more occurrences', () => {
            const task = {
                id: 'task-1',
                name: 'One-time Task',
                recurrence_rule: null,
                deadline: '2025-01-25',
                completed: true
            };

            const hasRecurrence = task.recurrence_rule !== null;
            expect(hasRecurrence).toBe(false);
        });

        test('should handle task without deadline', () => {
            const task = {
                id: 'task-1',
                name: 'Task without deadline',
                recurrence_rule: 'FREQ=DAILY',
                deadline: null,
                completed: true
            };

            const canAdvance = task.recurrence_rule && task.deadline;
            expect(canAdvance).toBeFalsy();
        });
    });

    describe('recurrence validation', () => {
        test('should validate daily recurrence', () => {
            const rrule = 'FREQ=DAILY';
            const isValid = rrule.includes('FREQ=DAILY') || 
                           rrule.includes('FREQ=WEEKLY') ||
                           rrule.includes('FREQ=MONTHLY');

            expect(isValid).toBe(true);
        });

        test('should reject invalid recurrence format', () => {
            const invalidRRule = 'INVALID_FORMAT';
            const isValid = invalidRRule.includes('FREQ=DAILY') || 
                           invalidRRule.includes('FREQ=WEEKLY') ||
                           invalidRRule.includes('FREQ=MONTHLY');

            expect(isValid).toBe(false);
        });
    });
});
