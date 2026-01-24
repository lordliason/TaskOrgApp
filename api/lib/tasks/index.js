/**
 * Task operations: re-export CRUD, decomposition, and planner.
 */

const { createTask, splitTask, updateTask, getTasks } = require('./crud');
const { decomposeTask, refineDecomposition, finalizeDecomposition } = require('./decompose');
const { autofillDailyPlan } = require('./planner');

module.exports = {
    createTask,
    splitTask,
    updateTask,
    getTasks,
    decomposeTask,
    refineDecomposition,
    finalizeDecomposition,
    autofillDailyPlan
};
