/**
 * Task validation: assignees, sizes, and related rules.
 */

// Import from api/lib/appConfig.js (go up one level from api/lib/validation/ to api/lib/)
const config = require('../appConfig');
const VALID_ASSIGNEES_CREATE = config.tasks.validAssigneesCreate;
const VALID_ASSIGNEES_UPDATE = config.tasks.validAssigneesUpdate;
const VALID_SIZES = config.tasks.validSizes;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate assignee for task creation (accepts user IDs, 'all', or legacy values).
 * @param {string} assignee
 * @throws {Error} when invalid
 */
function validateAssigneeCreate(assignee) {
    if (!VALID_ASSIGNEES_CREATE.includes(assignee) && !assignee.match(UUID_REGEX)) {
        throw new Error(`Assignee must be a valid user ID, 'all', or one of: ${VALID_ASSIGNEES_CREATE.join(', ')}`);
    }
}

/**
 * Validate assignee for task updates.
 * @param {string} assignee
 * @throws {Error} when invalid
 */
function validateAssigneeUpdate(assignee) {
    if (!VALID_ASSIGNEES_UPDATE.includes(assignee)) {
        throw new Error(`Assignee must be one of: ${VALID_ASSIGNEES_UPDATE.join(', ')}`);
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
    VALID_ASSIGNEES_CREATE,
    VALID_ASSIGNEES_UPDATE,
    VALID_SIZES,
    validateAssigneeCreate,
    validateAssigneeUpdate,
    validateSize,
    clampUrgencyImportance
};