/**
 * AI-powered daily plan autofill.
 */

// Import from api/lib/appConfig.js (go up one level from api/lib/tasks/ to api/lib/)
const config = require('../appConfig');
const SIZE_MINUTES = config.tasks.sizeMinutes;
const SIZE_LABELS = config.tasks.sizeLabels;
const OUTSIDE_KEYWORDS = ['store', 'shop', 'depot', 'car', 'dmv', 'plates', 'pick up', 'pickup', 'return', 'buy', 'get', 'grocery', 'groceries', 'mall', 'bank', 'post office', 'pharmacy', 'doctor', 'dentist', 'appointment', 'errand', 'drive', 'drop off', 'dropoff'];
const HOME_KEYWORDS = ['home', 'house', 'clean', 'laundry', 'cook', 'paper', 'form', 'document', 'file', 'call', 'email', 'computer', 'online', 'video', 'work from', 'remote', 'desk'];

const BLOCK_TIMES = { morning: { start: 8, end: 12 }, afternoon: { start: 12, end: 17 }, evening: { start: 17, end: 21 } };

function getTaskLocationType(task) {
    const nameLower = (task.name || '').toLowerCase();
    const locationLower = (task.location || '').toLowerCase();
    const combined = nameLower + ' ' + locationLower;
    const isOutside = OUTSIDE_KEYWORDS.some(kw => combined.includes(kw));
    const isHome = HOME_KEYWORDS.some(kw => combined.includes(kw));
    if (isOutside && !isHome) return 'OUTSIDE ERRAND';
    if (isHome && !isOutside) return 'HOME TASK';
    if (isOutside && isHome) return 'OUTSIDE ERRAND';
    return 'UNSPECIFIED';
}

/**
 * Get display name for assignee
 * @param {object} task - Task object with assignee or assignee_id
 * @param {object[]} [members] - Optional array of member objects with user_id and display_name
 * @returns {string} Display name for the assignee
 */
function getAssigneeDisplay(task, members = []) {
    const assigneeId = task.assignee_id || task.assignee;
    
    if (assigneeId === 'all' || assigneeId === 'both') {
        return 'all team members together';
    }
    
    // Look up member by user_id
    if (members && members.length > 0) {
        const member = members.find(m => m.user_id === assigneeId);
        if (member) {
            return `${member.display_name} only`;
        }
    }
    
    // Fallback to the assignee value itself
    return `${assigneeId} only`;
}

/**
 * Autofill daily plan using OpenAI based on pending tasks and current time.
 * @param {{ tasks: object[], currentHour: number, currentMinutes: number, members?: object[] }} params
 * @param {string} apiKey - OpenAI API key
 * @param {string} [model='gpt-3.5-turbo']
 * @returns {Promise<{ success: boolean, plan?: object, reasoning?: string, message: string }>}
 */
async function autofillDailyPlan(params, apiKey, model = 'gpt-3.5-turbo') {
    const { tasks, currentHour, currentMinutes, members = [] } = params;

    let availableBlocks = [];
    if (currentHour < 12) availableBlocks = ['morning', 'afternoon', 'evening'];
    else if (currentHour < 17) availableBlocks = ['afternoon', 'evening'];
    else if (currentHour < 21) availableBlocks = ['evening'];
    else availableBlocks = [];

    if (availableBlocks.length === 0) {
        return { success: false, message: "It's quite late! Consider planning for tomorrow instead.", plan: null };
    }

    const availableTasks = tasks.filter(t => !t.completed && !t.banked);
    if (availableTasks.length === 0) {
        return { success: false, message: "No pending tasks to schedule. Great job staying on top of things!", plan: null };
    }

    const remainingMinutes = {};
    availableBlocks.forEach(block => {
        const blockInfo = BLOCK_TIMES[block];
        if (currentHour < blockInfo.start) {
            remainingMinutes[block] = (blockInfo.end - blockInfo.start) * 60;
        } else if (currentHour < blockInfo.end) {
            remainingMinutes[block] = (blockInfo.end - currentHour) * 60 - currentMinutes;
        } else {
            remainingMinutes[block] = 0;
        }
    });

    // Build member list for prompt
    const memberNames = members.length > 0 
        ? members.map(m => m.display_name || m.email).join(', ')
        : 'team members';
    
    // Create a member ID to name lookup
    const memberLookup = {};
    members.forEach(m => {
        memberLookup[m.user_id] = m.display_name || m.email || 'Unknown';
    });

    const taskDescriptions = availableTasks.map(t => {
        const estimatedTime = SIZE_MINUTES[t.size] || 45;
        const deadlineInfo = t.deadline ? `, deadline: ${t.deadline}` : '';
        const locationInfo = t.location ? `, location: ${t.location}` : '';
        const dependsInfo = t.depends_on ? `, depends on another task` : '';
        const locationType = getTaskLocationType(t);
        const assigneeDisplay = getAssigneeDisplay(t, members);
        return `- ID: ${t.id}
  Name: "${t.name}"
  Assignee: ${t.assignee_id || t.assignee} (${assigneeDisplay})
  Size: ${SIZE_LABELS[t.size] || t.size} (${estimatedTime} min)
  Urgency: ${t.urgent || 3}/5, Importance: ${t.important || 3}/5
  Priority Score: ${((t.urgent || 3) * 2 + (t.important || 3))}${deadlineInfo}${locationInfo}${dependsInfo}
  Task Type: ${locationType}`;
    }).join('\n\n');

    // Build JSON structure example based on actual members
    const jsonExample = {};
    members.forEach(m => {
        jsonExample[m.user_id] = {
            morning: ['task_id_example'],
            afternoon: [],
            evening: []
        };
    });

    const prompt = `You are a smart daily planner assistant for a team (${memberNames}). Your job is to intelligently fill their daily plan for the remaining time today.

CURRENT TIME: ${currentHour}:${currentMinutes.toString().padStart(2, '0')}

TEAM MEMBERS:
${members.map(m => `- ${m.display_name || m.email} (ID: ${m.user_id})`).join('\n')}

AVAILABLE TIME BLOCKS:
${availableBlocks.map(block => `- ${block.charAt(0).toUpperCase() + block.slice(1)}: ~${remainingMinutes[block]} minutes remaining`).join('\n')}

PENDING TASKS:
${taskDescriptions}

SCHEDULING RULES (in priority order):
1. CURRENT TIME AWARENESS: Only schedule tasks in blocks that haven't passed. Current hour is ${currentHour}.
2. PRIORITY FIRST: Higher urgency + importance tasks should be scheduled earlier in the day.
3. DEADLINE AWARENESS: Tasks with imminent deadlines (today/tomorrow) get top priority.
4. LOCATION CLUSTERING (CRITICAL): 
   - Group ALL outside errands together in the SAME time block (stores, shopping, car tasks, DMV, picking things up, returning items, depot runs)
   - Group ALL home tasks together in a SEPARATE time block (paperwork, cleaning, computer work, calls)
   - NEVER mix home tasks with outside errands in the same time block
   - If a task mentions a store, depot, car, plates, DMV, shopping, or pickup → it's an OUTSIDE errand
   - If a task is paperwork, computer work, cleaning inside, or doesn't require leaving → it's a HOME task
   - Schedule outside errands consecutively so the person can do them in one trip
5. "ALL" TASKS TOGETHER: Tasks assigned to "all" should ideally be scheduled at the same time block for ALL team members so they can work together.
6. SIZE FITTING: Don't overfill blocks - respect the time estimates and available minutes.
7. BALANCED WORKLOAD: Try to balance task count and total time between all team members.
8. DEPENDENCIES: If a task depends on another, schedule the dependency first.

RESPONSE FORMAT - Return ONLY valid JSON with member user IDs as keys:
${JSON.stringify(jsonExample, null, 2).replace(/task_id_example/g, 'actual_task_id')}
Add a "reasoning" key with a brief explanation.

IMPORTANT:
- Use member user IDs (UUIDs) as keys, NOT names
- Only include blocks that are available (${availableBlocks.join(', ')})
- Use actual task IDs from the list above
- For "all" assignee tasks, add the SAME task ID to ALL team members' schedules in the SAME time block
- Don't schedule more tasks than will fit in the available time
- It's okay to leave some tasks unscheduled if there isn't enough time
- CRITICAL: Group all "OUTSIDE ERRAND" tasks together in one time block, and all "HOME TASK" tasks together in a different block
- Return ONLY the JSON, no markdown code blocks or extra text`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a scheduling assistant. Always respond with valid JSON only, no markdown formatting.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
        throw new Error('No response from AI');
    }

    let plan;
    try {
        let cleanResponse = aiResponse.trim();
        if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
        }
        plan = JSON.parse(cleanResponse);
    } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse);
        throw new Error('Failed to parse AI scheduling response');
    }

    // Validate plan structure - should have keys for each member
    const memberIds = members.map(m => m.user_id);
    const emptyBlocks = { morning: [], afternoon: [], evening: [] };
    
    // Build plan object with all member IDs
    const validatedPlan = {};
    memberIds.forEach(memberId => {
        if (plan[memberId]) {
            validatedPlan[memberId] = { ...emptyBlocks, ...plan[memberId] };
        } else {
            validatedPlan[memberId] = { ...emptyBlocks };
        }
    });

    // Filter to valid task IDs only
    const validTaskIds = new Set(availableTasks.map(t => t.id));
    memberIds.forEach(memberId => {
        ['morning', 'afternoon', 'evening'].forEach(block => {
            if (Array.isArray(validatedPlan[memberId][block])) {
                validatedPlan[memberId][block] = validatedPlan[memberId][block].filter(id => validTaskIds.has(id));
            } else {
                validatedPlan[memberId][block] = [];
            }
        });
    });

    return {
        success: true,
        plan: validatedPlan,
        reasoning: plan.reasoning || 'Plan generated based on priority, location clustering, and time constraints.',
        message: `Daily plan created! ${plan.reasoning || ''}`
    };
}

module.exports = { autofillDailyPlan };
