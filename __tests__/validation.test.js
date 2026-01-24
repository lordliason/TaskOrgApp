/**
 * Unit tests for task validation functions.
 * Tests: validateAssigneeCreate, validateAssigneeUpdate, validateSize, clampUrgencyImportance
 */

const {
    VALID_ASSIGNEES_CREATE,
    VALID_ASSIGNEES_UPDATE,
    VALID_SIZES,
    validateAssigneeCreate,
    validateAssigneeUpdate,
    validateSize,
    clampUrgencyImportance
} = require('../api/lib/validation/taskValidation');

describe('Task Validation', () => {
    describe('exported constants', () => {
        test('VALID_ASSIGNEES_CREATE should contain expected values', () => {
            expect(VALID_ASSIGNEES_CREATE).toEqual(['mario', 'maria', 'both', 'all']);
        });

        test('VALID_ASSIGNEES_UPDATE should contain expected values', () => {
            expect(VALID_ASSIGNEES_UPDATE).toEqual(['mario', 'maria', 'both']);
        });

        test('VALID_SIZES should contain expected values', () => {
            expect(VALID_SIZES).toEqual(['xs', 's', 'm', 'l', 'xl']);
        });
    });

    describe('validateAssigneeCreate', () => {
        test('should accept "mario" as valid assignee', () => {
            expect(() => validateAssigneeCreate('mario')).not.toThrow();
        });

        test('should accept "maria" as valid assignee', () => {
            expect(() => validateAssigneeCreate('maria')).not.toThrow();
        });

        test('should accept "both" as valid assignee', () => {
            expect(() => validateAssigneeCreate('both')).not.toThrow();
        });

        test('should accept "all" as valid assignee for creation', () => {
            expect(() => validateAssigneeCreate('all')).not.toThrow();
        });

        test('should accept valid UUID as assignee', () => {
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            expect(() => validateAssigneeCreate(validUUID)).not.toThrow();
        });

        test('should accept uppercase UUID', () => {
            const uppercaseUUID = '123E4567-E89B-12D3-A456-426614174000';
            expect(() => validateAssigneeCreate(uppercaseUUID)).not.toThrow();
        });

        test('should accept mixed-case UUID', () => {
            const mixedCaseUUID = '123e4567-E89B-12d3-A456-426614174000';
            expect(() => validateAssigneeCreate(mixedCaseUUID)).not.toThrow();
        });

        test('should reject invalid assignee string', () => {
            expect(() => validateAssigneeCreate('john')).toThrow();
            expect(() => validateAssigneeCreate('john')).toThrow(/Assignee must be/);
        });

        test('should reject empty string', () => {
            expect(() => validateAssigneeCreate('')).toThrow();
        });

        test('should reject invalid UUID format', () => {
            expect(() => validateAssigneeCreate('not-a-uuid')).toThrow();
            expect(() => validateAssigneeCreate('123456')).toThrow();
            expect(() => validateAssigneeCreate('123e4567-e89b-12d3-a456')).toThrow();
        });

        test('should reject UUID with invalid characters', () => {
            expect(() => validateAssigneeCreate('123g4567-e89b-12d3-a456-426614174000')).toThrow();
        });

        test('error message should list valid options', () => {
            try {
                validateAssigneeCreate('invalid');
            } catch (error) {
                expect(error.message).toContain('mario');
                expect(error.message).toContain('maria');
                expect(error.message).toContain('both');
                expect(error.message).toContain('all');
                expect(error.message).toContain('valid user ID');
            }
        });
    });

    describe('validateAssigneeUpdate', () => {
        test('should accept "mario" as valid assignee', () => {
            expect(() => validateAssigneeUpdate('mario')).not.toThrow();
        });

        test('should accept "maria" as valid assignee', () => {
            expect(() => validateAssigneeUpdate('maria')).not.toThrow();
        });

        test('should accept "both" as valid assignee', () => {
            expect(() => validateAssigneeUpdate('both')).not.toThrow();
        });

        test('should reject "all" for updates (unlike create)', () => {
            expect(() => validateAssigneeUpdate('all')).toThrow();
            expect(() => validateAssigneeUpdate('all')).toThrow(/Assignee must be one of/);
        });

        test('should reject UUID for updates (unlike create)', () => {
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            expect(() => validateAssigneeUpdate(validUUID)).toThrow();
        });

        test('should reject invalid assignee string', () => {
            expect(() => validateAssigneeUpdate('john')).toThrow();
        });

        test('should reject empty string', () => {
            expect(() => validateAssigneeUpdate('')).toThrow();
        });

        test('error message should list valid options', () => {
            try {
                validateAssigneeUpdate('invalid');
            } catch (error) {
                expect(error.message).toContain('mario');
                expect(error.message).toContain('maria');
                expect(error.message).toContain('both');
                expect(error.message).not.toContain('all');
            }
        });
    });

    describe('validateSize', () => {
        test('should accept "xs" as valid size', () => {
            expect(() => validateSize('xs')).not.toThrow();
        });

        test('should accept "s" as valid size', () => {
            expect(() => validateSize('s')).not.toThrow();
        });

        test('should accept "m" as valid size', () => {
            expect(() => validateSize('m')).not.toThrow();
        });

        test('should accept "l" as valid size', () => {
            expect(() => validateSize('l')).not.toThrow();
        });

        test('should accept "xl" as valid size', () => {
            expect(() => validateSize('xl')).not.toThrow();
        });

        test('should accept null/undefined (size is optional)', () => {
            expect(() => validateSize(null)).not.toThrow();
            expect(() => validateSize(undefined)).not.toThrow();
        });

        test('should accept empty string (falsy)', () => {
            expect(() => validateSize('')).not.toThrow();
        });

        test('should reject invalid size string', () => {
            expect(() => validateSize('xxl')).toThrow();
            expect(() => validateSize('xxl')).toThrow(/Size must be one of/);
        });

        test('should reject uppercase sizes', () => {
            expect(() => validateSize('XS')).toThrow();
            expect(() => validateSize('M')).toThrow();
        });

        test('should reject numeric sizes', () => {
            expect(() => validateSize('1')).toThrow();
            expect(() => validateSize('small')).toThrow();
        });

        test('error message should list valid options', () => {
            try {
                validateSize('invalid');
            } catch (error) {
                expect(error.message).toContain('xs');
                expect(error.message).toContain('s');
                expect(error.message).toContain('m');
                expect(error.message).toContain('l');
                expect(error.message).toContain('xl');
            }
        });
    });

    describe('clampUrgencyImportance', () => {
        test('should return value unchanged when within range', () => {
            expect(clampUrgencyImportance(1)).toBe(1);
            expect(clampUrgencyImportance(2)).toBe(2);
            expect(clampUrgencyImportance(3)).toBe(3);
            expect(clampUrgencyImportance(4)).toBe(4);
            expect(clampUrgencyImportance(5)).toBe(5);
        });

        test('should clamp values below 1 to 1', () => {
            expect(clampUrgencyImportance(0)).toBe(1);
            expect(clampUrgencyImportance(-1)).toBe(1);
            expect(clampUrgencyImportance(-100)).toBe(1);
        });

        test('should clamp values above 5 to 5', () => {
            expect(clampUrgencyImportance(6)).toBe(5);
            expect(clampUrgencyImportance(10)).toBe(5);
            expect(clampUrgencyImportance(100)).toBe(5);
        });

        test('should handle decimal values', () => {
            expect(clampUrgencyImportance(2.5)).toBe(2.5);
            expect(clampUrgencyImportance(0.5)).toBe(1);
            expect(clampUrgencyImportance(5.5)).toBe(5);
        });

        test('should handle edge cases at boundaries', () => {
            expect(clampUrgencyImportance(1.0)).toBe(1);
            expect(clampUrgencyImportance(5.0)).toBe(5);
        });
    });
});

describe('Validation edge cases', () => {
    describe('type coercion handling', () => {
        test('validateAssigneeCreate should handle non-string input gracefully', () => {
            // Numbers don't have .match() method - test behavior
            expect(() => validateAssigneeCreate(123)).toThrow();
        });
    });

    describe('case sensitivity', () => {
        test('assignees are case-sensitive', () => {
            expect(() => validateAssigneeCreate('Mario')).toThrow();
            expect(() => validateAssigneeCreate('MARIA')).toThrow();
            expect(() => validateAssigneeUpdate('Both')).toThrow();
        });

        test('sizes are case-sensitive', () => {
            expect(() => validateSize('XS')).toThrow();
            expect(() => validateSize('S')).toThrow();
            expect(() => validateSize('MEDIUM')).toThrow();
        });
    });

    describe('whitespace handling', () => {
        test('assignees with whitespace are invalid', () => {
            expect(() => validateAssigneeCreate(' mario')).toThrow();
            expect(() => validateAssigneeCreate('mario ')).toThrow();
            expect(() => validateAssigneeCreate(' mario ')).toThrow();
        });

        test('sizes with whitespace are invalid', () => {
            expect(() => validateSize(' xs')).toThrow();
            expect(() => validateSize('xs ')).toThrow();
        });
    });
});
