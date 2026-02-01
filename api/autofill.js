// Vercel Serverless Function for AI Task Autofill
// Uses OpenAI's gpt-4o-mini model to generate task details from a task name

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const systemPrompt = `You are a helpful assistant that generates task details based on a task name.
Given a task name, generate appropriate values for the following fields:

- effort: Estimated effort size. Must be one of: "xs" (5-10 min), "s" (10-30 min), "m" (30-60 min), "l" (1-2 hours), "xl" (2+ hours)
- urgent: Urgency level from 1-5. 1=Whenever, 2=This Week, 3=Today, 4=This Morning, 5=ASAP
- important: Importance level from 1-5. 1=Optional, 2=Nice to Have, 3=Keeps us on track, 4=Matters a lot, 5=Critical
- icon: A single emoji that best represents the task. Choose from these categories:
  - Shopping: 🛒, 🏪, 🏥
  - Home: 🏠, 🧹, 🧽, 🧼, 🛁, 🗑️, 🧺
  - Garden: 🌱, 🪴
  - Creative: 🎨, 🖌️, 📝, ✏️, 📖, 📚, 🎵, 🎹
  - Work: 💼, 📞, ✉️, 💻
  - Finance: 💰, 💳, 🏦
  - Transport: 🚗, 🚲, ✈️
  - Food: 🍽️, 🥘, ☕
  - Health: 💪, 🏃, 🧘
  - Family: 🐕, 🐱, 👨‍👩‍👧‍👦
  - Maintenance: 🔧, 🛠️, 💡, 🔌
  - Planning: 📅, ⏰, 🎯
  - Celebrations: 🎁, 🎉, 🎂
- first_step: A small, actionable first step to get started on this task (1-2 sentences)
- completion_criteria: What should be accomplished for this task to be considered complete (1-2 sentences)

Respond ONLY with a valid JSON object containing these fields. Do not include any explanation or markdown.`;

  const userPrompt = `Generate task details for: "${title.trim()}"`;

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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Failed to generate task details'
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the JSON response
    let taskDetails;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      taskDetails = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // Validate and sanitize the response
    const validEfforts = ['xs', 's', 'm', 'l', 'xl'];
    const validatedDetails = {
      effort: validEfforts.includes(taskDetails.effort) ? taskDetails.effort : 'm',
      urgent: Math.min(5, Math.max(1, parseInt(taskDetails.urgent) || 3)),
      important: Math.min(5, Math.max(1, parseInt(taskDetails.important) || 3)),
      icon: typeof taskDetails.icon === 'string' ? taskDetails.icon : null,
      first_step: typeof taskDetails.first_step === 'string' ? taskDetails.first_step.slice(0, 500) : '',
      completion_criteria: typeof taskDetails.completion_criteria === 'string' ? taskDetails.completion_criteria.slice(0, 500) : '',
    };

    return res.status(200).json(validatedDetails);
  } catch (error) {
    console.error('Autofill error:', error);
    return res.status(500).json({ error: 'Failed to generate task details' });
  }
}
