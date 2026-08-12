const Anthropic = require('@anthropic-ai/sdk');

// The key is optional on purpose. Without it the whole feature degrades to the
// clients' built-in suggestion engine rather than breaking the app, so the
// route reports "unavailable" instead of erroring.
const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

exports.isAvailable = () => Boolean(client);

const SYSTEM = `You help people break personal goals into concrete steps inside a goal-tracking app.

Rules:
- Milestones are checkpoints on the way to the goal, in chronological order, each independently verifiable.
- Habits are small recurring actions that move the goal forward.
- Be specific to the goal given. Never return generic filler like "make progress" or "stay motivated".
- Where the goal implies a quantity, use real intermediate numbers.
- Titles are short — under 60 characters, no trailing punctuation.`;

const MILESTONE_SCHEMA = {
  type: 'object',
  properties: {
    milestones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['title', 'description'],
        additionalProperties: false
      }
    }
  },
  required: ['milestones'],
  additionalProperties: false
};

const HABIT_SCHEMA = {
  type: 'object',
  properties: {
    habits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          emoji: { type: 'string' },
          category: {
            type: 'string',
            enum: ['health', 'learning', 'mindfulness', 'productivity', 'fitness', 'social']
          }
        },
        required: ['title', 'frequency', 'emoji', 'category'],
        additionalProperties: false
      }
    }
  },
  required: ['habits'],
  additionalProperties: false
};

/**
 * The "1% better every day" shape: one action small enough to do daily, plus
 * weekly checkpoints whose targets climb. The daily action carries a number and
 * a unit so it can be logged and charted rather than just ticked.
 */
const DAILY_PRACTICE_SCHEMA = {
  type: 'object',
  properties: {
    practice: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        emoji: { type: 'string' },
        category: {
          type: 'string',
          enum: ['health', 'learning', 'mindfulness', 'productivity', 'fitness', 'social']
        },
        startValue: { type: 'number' },
        unit: { type: 'string' },
        why: { type: 'string' }
      },
      required: ['title', 'emoji', 'category', 'startValue', 'unit', 'why'],
      additionalProperties: false
    },
    weeklyMilestones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          week: { type: 'number' },
          title: { type: 'string' },
          targetValue: { type: 'number' }
        },
        required: ['week', 'title', 'targetValue'],
        additionalProperties: false
      }
    }
  },
  required: ['practice', 'weeklyMilestones'],
  additionalProperties: false
};

async function ask({ prompt, schema }) {
  const response = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 2048,
    // Suggestions are a short generative task on a latency-sensitive path, so
    // this trades reasoning depth for responsiveness.
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }]
  });

  // A safety decline returns 200 with an empty content array, so reading
  // content[0] unconditionally would throw on a perfectly normal response.
  if (response.stop_reason === 'refusal') {
    const err = new Error('The assistant declined to answer that');
    err.code = 'SUGGESTION_REFUSED';
    throw err;
  }

  const text = response.content.find((b) => b.type === 'text');
  if (!text) {
    const err = new Error('No suggestions returned');
    err.code = 'SUGGESTION_EMPTY';
    throw err;
  }

  return JSON.parse(text.text);
}

exports.suggestMilestones = async ({ title, category, description }) => {
  const data = await ask({
    schema: MILESTONE_SCHEMA,
    prompt: [
      `Goal: ${title}`,
      category ? `Category: ${category}` : null,
      description ? `Details: ${description}` : null,
      '',
      'Give 4 to 6 milestones for this goal.'
    ]
      .filter(Boolean)
      .join('\n')
  });

  return (data.milestones || []).slice(0, 6).map((m) => ({
    title: String(m.title || '').slice(0, 200),
    description: String(m.description || '').slice(0, 1000)
  }));
};

/**
 * One daily-trackable practice for a goal, with weekly targets that grow.
 *
 * The starting value is deliberately small: the point is a number the user can
 * hit on their worst day, because a practice that is skipped is not compounding.
 */
exports.suggestDailyPractice = async ({ title, category, description, weeks = 8 }) => {
  const data = await ask({
    schema: DAILY_PRACTICE_SCHEMA,
    prompt: [
      `Goal: ${title}`,
      category ? `Category: ${category}` : null,
      description ? `Details: ${description}` : null,
      '',
      'Design a "1% better every day" plan for this goal.',
      '',
      'Return exactly one daily practice: a single action small enough to do',
      'every day, measurable as a number with a unit (minutes, pages, reps,',
      'words). Its startValue must be small enough to manage on a bad day —',
      'err on the side of trivially easy, because a skipped day compounds',
      'nothing.',
      '',
      `Then give ${weeks} weekly milestones, week 1 through ${weeks}, where`,
      'targetValue is the daily amount for that week and climbs by roughly',
      '5-10% each week. Each title states the target plainly, e.g.',
      '"Week 3 — 12 minutes a day".'
    ]
      .filter(Boolean)
      .join('\n')
  });

  const p = data.practice || {};
  const startValue = Math.max(1, Math.round(Number(p.startValue) || 1));

  return {
    practice: {
      title: String(p.title || '').slice(0, 200),
      emoji: p.emoji || '⚡',
      category: p.category || category || 'productivity',
      frequency: 'daily',
      targetValue: startValue,
      unit: String(p.unit || '').slice(0, 30),
      why: String(p.why || '').slice(0, 500)
    },
    weeklyMilestones: (data.weeklyMilestones || [])
      .slice(0, 12)
      .map((m, i) => ({
        week: Number(m.week) || i + 1,
        title: String(m.title || '').slice(0, 200),
        targetValue: Math.max(1, Math.round(Number(m.targetValue) || startValue))
      }))
      // The model is asked for ordered weeks but nothing guarantees it, and the
      // client renders these as a sequence.
      .sort((a, b) => a.week - b.week)
  };
};

exports.suggestHabits = async ({ title, category }) => {
  const data = await ask({
    schema: HABIT_SCHEMA,
    prompt: [
      `Goal: ${title}`,
      category ? `Category: ${category}` : null,
      '',
      'Give 3 to 5 recurring habits that would move this goal forward.'
    ]
      .filter(Boolean)
      .join('\n')
  });

  return (data.habits || []).slice(0, 5).map((h) => ({
    title: String(h.title || '').slice(0, 200),
    frequency: h.frequency,
    emoji: h.emoji,
    category: h.category
  }));
};
