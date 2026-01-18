/**
 * Integration test for AI-powered daily planner autofill
 * 
 * This script tests the autofillDailyPlan function with real or mock data.
 * To run with real API: Set OPENAI_API_KEY in environment or config.js
 * 
 * Usage:
 *   node test-autofill-planner.js
 */

const { autofillDailyPlan } = require('./api/chat');
const fs = require('fs');
const path = require('path');

// Load API key
let apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    try {
        const configPath = path.join(__dirname, 'config.js');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const match = configContent.match(/OPENAI_API_KEY\s*=\s*['"]([^'"]+)['"]/);
        if (match && match[1]) {
            apiKey = match[1];
        }
    } catch (error) {
        console.error('Could not read config.js:', error.message);
    }
}

if (!apiKey || apiKey === 'null' || apiKey === 'undefined') {
    console.error('❌ OPENAI_API_KEY not found. Set it in environment variables or config.js');
    console.log('\nTo test without API key, the function will fail gracefully.');
    console.log('Set OPENAI_API_KEY to test with real AI scheduling.\n');
    process.exit(1);
}

// Sample test tasks
const testTasks = [
    {
        id: 'task1',
        name: 'Buy groceries',
        assignee: 'both',
        size: 'm',
        urgent: 4,
        important: 3,
        location: 'store',
        deadline: null,
        depends_on: null,
        completed: false,
        banked: false
    },
    {
        id: 'task2',
        name: 'Clean kitchen',
        assignee: 'mario',
        size: 's',
        urgent: 3,
        important: 4,
        location: 'home',
        deadline: null,
        depends_on: null,
        completed: false,
        banked: false
    },
    {
        id: 'task3',
        name: 'Review project proposal',
        assignee: 'maria',
        size: 'l',
        urgent: 5,
        important: 5,
        location: null,
        deadline: '2026-01-19',
        depends_on: null,
        completed: false,
        banked: false
    },
    {
        id: 'task4',
        name: 'Call dentist',
        assignee: 'mario',
        size: 'xs',
        urgent: 2,
        important: 3,
        location: null,
        deadline: null,
        depends_on: null,
        completed: false,
        banked: false
    },
    {
        id: 'task5',
        name: 'Cook dinner together',
        assignee: 'both',
        size: 'm',
        urgent: 3,
        important: 4,
        location: 'home',
        deadline: null,
        depends_on: null,
        completed: false,
        banked: false
    }
];

async function testAutofill() {
    console.log('🧪 Testing AI-Powered Daily Planner Autofill\n');
    console.log('Test Tasks:');
    testTasks.forEach((task, i) => {
        console.log(`  ${i + 1}. ${task.name} (${task.assignee}, ${task.size}, urgent:${task.urgent}, important:${task.important}${task.location ? `, location:${task.location}` : ''})`);
    });
    console.log('');

    // Test different times of day
    const testScenarios = [
        { hour: 9, minutes: 0, description: 'Morning (9:00 AM)' },
        { hour: 14, minutes: 30, description: 'Afternoon (2:30 PM)' },
        { hour: 19, minutes: 0, description: 'Evening (7:00 PM)' }
    ];

    for (const scenario of testScenarios) {
        console.log(`\n📅 Testing scenario: ${scenario.description}`);
        console.log('─'.repeat(50));

        try {
            const result = await autofillDailyPlan({
                tasks: testTasks,
                currentHour: scenario.hour,
                currentMinutes: scenario.minutes
            }, apiKey);

            if (result.success) {
                console.log('✅ Success! Plan generated:\n');
                
                console.log('Mario\'s Schedule:');
                console.log(`  Morning:  ${result.plan.mario.morning.length} tasks`);
                result.plan.mario.morning.forEach(taskId => {
                    const task = testTasks.find(t => t.id === taskId);
                    console.log(`    - ${task ? task.name : taskId}`);
                });
                console.log(`  Afternoon: ${result.plan.mario.afternoon.length} tasks`);
                result.plan.mario.afternoon.forEach(taskId => {
                    const task = testTasks.find(t => t.id === taskId);
                    console.log(`    - ${task ? task.name : taskId}`);
                });
                console.log(`  Evening:   ${result.plan.mario.evening.length} tasks`);
                result.plan.mario.evening.forEach(taskId => {
                    const task = testTasks.find(t => t.id === taskId);
                    console.log(`    - ${task ? task.name : taskId}`);
                });

                console.log('\nMaria\'s Schedule:');
                console.log(`  Morning:  ${result.plan.maria.morning.length} tasks`);
                result.plan.maria.morning.forEach(taskId => {
                    const task = testTasks.find(t => t.id === taskId);
                    console.log(`    - ${task ? task.name : taskId}`);
                });
                console.log(`  Afternoon: ${result.plan.maria.afternoon.length} tasks`);
                result.plan.maria.afternoon.forEach(taskId => {
                    const task = testTasks.find(t => t.id === taskId);
                    console.log(`    - ${task ? task.name : taskId}`);
                });
                console.log(`  Evening:   ${result.plan.maria.evening.length} tasks`);
                result.plan.maria.evening.forEach(taskId => {
                    const task = testTasks.find(t => t.id === taskId);
                    console.log(`    - ${task ? task.name : taskId}`);
                });

                if (result.reasoning) {
                    console.log(`\n💭 AI Reasoning: ${result.reasoning}`);
                }

                // Verify "both" tasks are scheduled together
                const bothTasks = testTasks.filter(t => t.assignee === 'both');
                bothTasks.forEach(bothTask => {
                    const inMarioMorning = result.plan.mario.morning.includes(bothTask.id);
                    const inMariaMorning = result.plan.maria.morning.includes(bothTask.id);
                    const inMarioAfternoon = result.plan.mario.afternoon.includes(bothTask.id);
                    const inMariaAfternoon = result.plan.maria.afternoon.includes(bothTask.id);
                    const inMarioEvening = result.plan.mario.evening.includes(bothTask.id);
                    const inMariaEvening = result.plan.maria.evening.includes(bothTask.id);

                    const scheduledTogether = 
                        (inMarioMorning && inMariaMorning) ||
                        (inMarioAfternoon && inMariaAfternoon) ||
                        (inMarioEvening && inMariaEvening);

                    if (scheduledTogether) {
                        console.log(`\n✅ "Both" task "${bothTask.name}" scheduled together ✓`);
                    } else {
                        console.log(`\n⚠️  "Both" task "${bothTask.name}" may not be scheduled together`);
                    }
                });

            } else {
                console.log(`❌ Failed: ${result.message}`);
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            if (error.stack) {
                console.error(error.stack);
            }
        }
    }

    // Test edge cases
    console.log('\n\n🔍 Testing Edge Cases');
    console.log('─'.repeat(50));

    // Test: No tasks
    console.log('\n1. Testing with no tasks...');
    try {
        const result = await autofillDailyPlan({
            tasks: [],
            currentHour: 9,
            currentMinutes: 0
        }, apiKey);
        console.log(`   Result: ${result.success ? '✅' : '❌'} ${result.message}`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }

    // Test: Too late
    console.log('\n2. Testing at 10:00 PM (too late)...');
    try {
        const result = await autofillDailyPlan({
            tasks: testTasks,
            currentHour: 22,
            currentMinutes: 0
        }, apiKey);
        console.log(`   Result: ${result.success ? '✅' : '❌'} ${result.message}`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }

    // Test: All tasks completed
    console.log('\n3. Testing with all tasks completed...');
    const completedTasks = testTasks.map(t => ({ ...t, completed: true }));
    try {
        const result = await autofillDailyPlan({
            tasks: completedTasks,
            currentHour: 9,
            currentMinutes: 0
        }, apiKey);
        console.log(`   Result: ${result.success ? '✅' : '❌'} ${result.message}`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n\n✨ Test completed!\n');
}

// Run the test
testAutofill().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
