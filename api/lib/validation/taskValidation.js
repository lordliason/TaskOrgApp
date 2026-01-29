/**
 * Task validation: assignees, sizes, and related rules.
 */

// Import from api/lib/appConfig.js (go up one level from api/lib/validation/ to api/lib/)
const config = require('../appConfig');
const LEGACY_ASSIGNEES = config.tasks.legacyAssignees;
const isValidAssignee = config.tasks.isValidAssignee;
const VALID_SIZES = config.tasks.validSizes;

/**
 * Validate assignee for task creation (accepts user IDs, 'all', or legacy values).
 * @param {string} assignee
 * @throws {Error} when invalid
 */
function validateAssigneeCreate(assignee) {
    if (!isValidAssignee(assignee)) {
        throw new Error(`Assignee must be a valid user ID (UUID), 'all', or one of the legacy values: ${LEGACY_ASSIGNEES.join(', ')}`);
    }
}

/**
 * Validate assignee for task updates (same validation as create).
 * @param {string} assignee
 * @throws {Error} when invalid
 */
function validateAssigneeUpdate(assignee) {
    if (!isValidAssignee(assignee)) {
        throw new Error(`Assignee must be a valid user ID (UUID), 'all', or one of the legacy values: ${LEGACY_ASSIGNEES.join(', ')}`);
    }
}

/**
 * Validate task size.
 * @param {string} size
 * @throws {Error} when invalid
 */
function validateSize(size) {
    if (size && !VALID_SIZES.includes(size)) {
        throw new Error(`Size must be one of: ${VALID_SIZES.join(', ')}`);
    }
}

/**
 * Clamp value to 1-5 range.
 * @param {number} val
 * @returns {number}
 */
function clampUrgencyImportance(val) {
    return Math.max(1, Math.min(5, val));
}

module.exports = {
    LEGACY_ASSIGNEES,
    isValidAssignee,
    VALID_SIZES,
    validateAssigneeCreate,
    validateAssigneeUpdate,
    validateSize,
    clampUrgencyImportance
};