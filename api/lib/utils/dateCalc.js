/**
 * Date calculation utilities for task decomposition and deadline handling.
 */

/**
 * Calculate a subtask deadline based on parent deadline and subtask index.
 * @param {number} subtaskIndex - Zero-based index of the subtask
 * @param {string|null} parentDeadline - Parent task deadline (YYYY-MM-DD)
 * @returns {string|null} Subtask deadline as YYYY-MM-DD or null
 */
function calculateDeadline(subtaskIndex, parentDeadline) {
    if (!parentDeadline) return null;

    const parentDate = new Date(parentDeadline);
    const daysToSubtract = (subtaskIndex + 1) * 3;
    const subtaskDate = new Date(parentDate);
    subtaskDate.setDate(parentDate.getDate() - daysToSubtract);

    return subtaskDate.toISOString().split('T')[0];
}

/**
 * Parse natural language deadline response into YYYY-MM-DD.
 * @param {string} response - User's deadline description
 * @returns {string} Date as YYYY-MM-DD
 */
function parseDeadline(response) {
    const today = new Date();

    if (response.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    if (response.includes('next week')) {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
    }

    if (response.includes('end of month')) {
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return endOfMonth.toISOString().split('T')[0];
    }

    const dateMatch = response.match(/(\d{1,2})[\/-](\d{1,2})/);
    if (dateMatch) {
        const month = parseInt(dateMatch[1]) - 1;
        const day = parseInt(dateMatch[2]);
        const year = today.getFullYear();
        const date = new Date(year, month, day);
        return date.toISOString().split('T')[0];
    }

    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 14);
    return defaultDate.toISOString().split('T')[0];
}

module.exports = { calculateDeadline, parseDeadline };
