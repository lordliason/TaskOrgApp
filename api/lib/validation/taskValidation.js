/**
 * Task validation: assignees, sizes, and related rules.
 */

// Import from api/lib/appConfig.js (go up one level from api/lib/validation/ to api/lib/)
const config = require('../appConfig');
const isValidAssignee = config.tasks.isValidAssignee;
const VALID_SIZES = config.tasks.validSizes;

/**
 * Validate assignee for task creation.
 * Accepts only UUIDs for individual members or 'all' for shared tasks.
 * @param {string} assignee
 * @throws {Error} when invalid
 */
function validateAssigneeCreate(assignee) {
    if (!isValidAssignee(assignee)) {
        throw new Error("Assignee must be a valid user ID (UUID) or 'all' for shared tasks");
    }
}

/**
 * Validate assignee for task updates.
 * @param {string} assignee
 * @throws {Error} when invalid
 */
function validateAssigneeUpdate(assignee) {
    if (!isValidAssignee(assignee)) {
        throw new Error("Assignee must be a valid user ID (UUID) or 'all' for shared tasks");
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
    isValidAssignee,
    VALID_SIZES,
    validateAssigneeCreate,
    validateAssigneeUpdate,
    validateSize,
    clampUrgencyImportance
};