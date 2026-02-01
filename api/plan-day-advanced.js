// Vercel Serverless Function for Advanced AI Day Planning
// Uses OpenAI's gpt-4o-mini model with user context for personalized scheduling

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tasks, userContext } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Tasks array is required' });
  }

  if (!userContext) {
    return res.status(400).json({ error: 'User context is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const systemPrompt = `You are an expert productivity coach and day planner. Your job is to create a highly personalized daily schedule based on tasks and the user's current state.

Given a list of tasks and user context, create an intelligent schedule that:
1. Respects the user's energy level and adjusts workload accordingly
2. Prioritizes tasks by urgency and importance
3. Considers the user's available time and doesn't overload
4. Groups tasks by location if the user is mobile
5. Adapts to the user's focus preference (deep work vs. variety)
6. Takes mood and stress into account for task selection
7. Balances challenging and easy tasks based on mental state
8. Leaves buffer time for breaks based on energy level

Effort sizes mean:
- xs: 5-10 minutes
- s: 10-30 minutes
- m: 30-60 minutes
- l: 1-2 hours
- xl: 2+ hours

Urgency levels (1-5):
1=Whenever, 2=This Week, 3=Today, 4=This Morning, 5=ASAP

Importance levels (1-5):
1=Optional, 2=Nice to Have, 3=Keeps us on track, 4=Matters a lot, 5=Critical

User Context Parameters:
- energyLevel: low (tired, minimal capacity), medium (normal), high (energized, maximum capacity)
- availableHours: 2-10 hours available for tasks
- mobility: stationary (at one location), mobile (can travel)
- focusPreference: deep-work (long focused sessions), variety (mix of tasks), quick-wins (short tasks)
- mood: stressed (need easier tasks), neutral (normal), motivated (can tackle hard tasks)
- startTime: morning, afternoon, evening (when they're starting their day)

Respond with a JSON object containing:
{
  "scheduledTasks": [
    {
      "id": "task-id",
      "suggestedTime": "morning|afternoon|evening",
      "orderIndex": 0,
      "reasoning": "Brief personalized reason for this placement based on user context"
    }
  ],
  "summary": "Personalized overview of the day's plan (2-3 sentences)",
  "encouragement": "Brief encouraging message tailored to their current state (1 sentence)"
}

Only include tasks that realistically fit given their available hours and energy. Order tasks optimally for their current state.`;

  // Prepare tasks data for AI
  const tasksData = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    effort: task.effort,
    urgent: task.urgent,
    important: task.important,
    location: task.location || 'none',
    first_step: task.first_step || '',
  }));

  const userPrompt = `User Context:
- Energy Level: ${userContext.energyLevel}
- Available Hours: ${userContext.availableHours}
- Mobility: ${userContext.mobility}
- Focus Preference: ${userContext.focusPreference}
- Mood: ${userContext.mood}
- Starting Time: ${userContext.startTime}

Tasks to schedule:
${JSON.stringify(tasksData, null, 2)}

Create an optimal personalized daily schedule based on the user's current state.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Failed to generate personalized day plan'
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the JSON response
    let planDetails;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      planDetails = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // Validate the response
    if (!planDetails.scheduledTasks || !Array.isArray(planDetails.scheduledTasks)) {
      return res.status(500).json({ error: 'Invalid plan structure' });
    }

    return res.status(200).json(planDetails);
  } catch (error) {
    console.error('Advanced day planning error:', error);
    return res.status(500).json({ error: 'Failed to generate personalized day plan' });
  }
}
