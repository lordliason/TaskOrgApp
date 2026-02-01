// Vercel Serverless Function for AI Day Planning
// Uses OpenAI's gpt-4o-mini model to intelligently schedule tasks for the day

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Tasks array is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const systemPrompt = `You are an expert productivity coach and day planner. Your job is to create an optimal daily schedule based on a list of tasks.

Given a list of tasks with their properties, create an intelligent schedule that:
1. Prioritizes tasks by urgency and importance (urgent and important tasks first)
2. Groups tasks by location to minimize travel time
3. Balances workload throughout the day based on effort estimates
4. Considers task dependencies and logical ordering
5. Aims for a realistic and achievable daily schedule (don't overload)
6. Places high-effort tasks when people typically have more energy (morning/mid-day)
7. Saves low-effort quick tasks for later in the day or as breaks between big tasks

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

Respond with a JSON object containing:
{
  "scheduledTasks": [
    {
      "id": "task-id",
      "suggestedTime": "morning|afternoon|evening",
      "orderIndex": 0,
      "reasoning": "Brief reason for this placement"
    }
  ],
  "summary": "Brief overview of the day's plan (2-3 sentences)"
}

Only include tasks that realistically fit in a day (max 8-10 hours of work). Order tasks by priority.`;

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

  const userPrompt = `Here are the tasks to schedule:\n\n${JSON.stringify(tasksData, null, 2)}\n\nCreate an optimal daily schedule.`;

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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Failed to generate day plan'
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
    console.error('Day planning error:', error);
    return res.status(500).json({ error: 'Failed to generate day plan' });
  }
}
