/**
 * Local suggestion engine.
 *
 * Runs entirely in the client so suggestions appear as the user types, with no
 * network round trip. It recognises common goal shapes by keyword and pulls
 * quantities out of the title ("read 12 books" -> 3 / 6 / 9 books). Anything it
 * does not recognise falls back to generic phase milestones, and the caller can
 * escalate to `fetchAIdeas` for a real model.
 *
 * Kept in sync with web/src/services/suggestions.js — same rules, same output.
 */

import { suggestionsAPI } from './api';

const GOAL_CATEGORIES = ['learning', 'health', 'career', 'personal', 'financial'];
const HABIT_CATEGORIES = ['health', 'learning', 'mindfulness', 'productivity', 'fitness', 'social'];

// Ordered: the first archetype whose pattern matches wins, so put the specific
// ones (marathon) before the general ones (run).
const ARCHETYPES = [
  {
    id: 'marathon',
    pattern: /\bmarathon\b/i,
    goal: { category: 'health', emoji: '🏃', type: 'long-term' },
    habit: { category: 'fitness', emoji: '🏃', frequency: 'weekly' },
    titles: ['Run a marathon', 'Run a half marathon'],
    milestones: (t) => {
      const half = /\bhalf\b/i.test(t);
      return half
        ? [
            { title: 'Run 5K without stopping', description: 'Build the base' },
            { title: 'Complete a 10K run', description: 'Halfway to race distance' },
            { title: 'Finish a 16K long run', description: 'Longest training run' },
            { title: 'Race day: half marathon', description: '21.1 km' },
          ]
        : [
            { title: 'Run a comfortable 10K', description: 'Build the aerobic base' },
            { title: 'Complete a half marathon', description: '21.1 km — halfway there' },
            { title: 'Finish a 32K long run', description: 'The peak training week' },
            { title: 'Taper, then race day', description: '42.2 km' },
          ];
    },
    habits: [
      { title: 'Easy run', frequency: 'weekly', emoji: '🏃', category: 'fitness' },
      { title: 'Long run', frequency: 'weekly', emoji: '🏃', category: 'fitness' },
      { title: 'Stretch and mobility', frequency: 'daily', emoji: '🧘', category: 'health' },
    ],
  },
  {
    id: 'running',
    pattern: /\b(run|running|jog|5k|10k|couch to)\b/i,
    goal: { category: 'health', emoji: '🏃', type: 'short-term' },
    habit: { category: 'fitness', emoji: '🏃', frequency: 'daily' },
    titles: ['Run a 5K', 'Run a 10K', 'Run three times a week'],
    milestones: () => [
      { title: 'Run for 10 minutes without stopping', description: '' },
      { title: 'Complete a 3K run', description: '' },
      { title: 'Complete a 5K run', description: '' },
      { title: 'Beat your 5K personal best', description: '' },
    ],
    habits: [
      { title: 'Morning run', frequency: 'daily', emoji: '🏃', category: 'fitness' },
      { title: 'Rest day walk', frequency: 'weekly', emoji: '🚶', category: 'health' },
    ],
  },
  {
    id: 'reading',
    pattern: /\b(read|reading|book|books)\b/i,
    goal: { category: 'learning', emoji: '📚', type: 'long-term' },
    habit: { category: 'learning', emoji: '📚', frequency: 'daily' },
    titles: ['Read 12 books this year', 'Read 20 pages a day', 'Finish my reading list'],
    milestones: (t) => quantityMilestones(t, 'book', 'books') || [
      { title: 'Finish your first book', description: '' },
      { title: 'Reach the quarter mark', description: '' },
      { title: 'Reach the halfway mark', description: '' },
      { title: 'Finish the list', description: '' },
    ],
    habits: [
      { title: 'Read 20 pages', frequency: 'daily', emoji: '📚', category: 'learning' },
      { title: 'Write a book note', frequency: 'weekly', emoji: '✍️', category: 'learning' },
    ],
  },
  {
    id: 'weight',
    pattern: /\b(lose|weight|kg|lbs|pounds|fat)\b/i,
    goal: { category: 'health', emoji: '💪', type: 'long-term' },
    habit: { category: 'health', emoji: '💪', frequency: 'daily' },
    titles: ['Lose 10 kg', 'Get to a healthy weight'],
    milestones: (t) => quantityMilestones(t, 'kg', 'kg') || [
      { title: 'Lose the first 25%', description: '' },
      { title: 'Reach the halfway point', description: '' },
      { title: 'Lose 75% of the target', description: '' },
      { title: 'Hit your goal weight', description: '' },
    ],
    habits: [
      { title: 'Log meals', frequency: 'daily', emoji: '🥗', category: 'health' },
      { title: 'Walk 8,000 steps', frequency: 'daily', emoji: '🚶', category: 'fitness' },
      { title: 'Weigh in', frequency: 'weekly', emoji: '⚖️', category: 'health' },
    ],
  },
  {
    id: 'savings',
    pattern: /\b(save|saving|savings|money|fund|debt|invest)\b/i,
    goal: { category: 'financial', emoji: '💰', type: 'long-term' },
    habit: { category: 'productivity', emoji: '💰', frequency: 'monthly' },
    titles: ['Save an emergency fund', 'Save $5000', 'Pay off my debt'],
    milestones: (t) => quantityMilestones(t, '', '') || [
      { title: 'Save the first 25%', description: '' },
      { title: 'Reach the halfway point', description: '' },
      { title: 'Save 75% of the target', description: '' },
      { title: 'Hit the full amount', description: '' },
    ],
    habits: [
      { title: 'Transfer to savings', frequency: 'monthly', emoji: '💰', category: 'productivity' },
      { title: 'Review spending', frequency: 'weekly', emoji: '📊', category: 'productivity' },
    ],
  },
  {
    id: 'language',
    pattern: /\b(learn|study|speak)\b.*\b(spanish|french|german|japanese|arabic|chinese|bengali|language)\b/i,
    goal: { category: 'learning', emoji: '🗣️', type: 'long-term' },
    habit: { category: 'learning', emoji: '🗣️', frequency: 'daily' },
    titles: ['Learn conversational Spanish', 'Study Japanese daily'],
    milestones: () => [
      { title: 'Learn the first 200 words', description: 'Core everyday vocabulary' },
      { title: 'Hold a 5-minute conversation', description: '' },
      { title: 'Read a short article unaided', description: '' },
      { title: 'Hold a 30-minute conversation', description: '' },
    ],
    habits: [
      { title: 'Vocabulary practice', frequency: 'daily', emoji: '🗣️', category: 'learning' },
      { title: 'Speaking practice', frequency: 'weekly', emoji: '🎙️', category: 'social' },
    ],
  },
  {
    id: 'coding',
    pattern: /\b(code|coding|program|developer|app|website|python|javascript|portfolio)\b/i,
    goal: { category: 'career', emoji: '💻', type: 'long-term' },
    habit: { category: 'productivity', emoji: '💻', frequency: 'daily' },
    titles: ['Build a portfolio project', 'Learn Python', 'Ship my first app'],
    milestones: () => [
      { title: 'Finish the fundamentals', description: '' },
      { title: 'Build a small working project', description: '' },
      { title: 'Build the main project', description: '' },
      { title: 'Ship it and share it', description: '' },
    ],
    habits: [
      { title: 'Code for 1 hour', frequency: 'daily', emoji: '💻', category: 'productivity' },
      { title: 'Review what you built', frequency: 'weekly', emoji: '🧠', category: 'learning' },
    ],
  },
  {
    id: 'fitness',
    pattern: /\b(gym|workout|lift|strength|muscle|fit|exercise|push[- ]?up)\b/i,
    goal: { category: 'health', emoji: '💪', type: 'long-term' },
    habit: { category: 'fitness', emoji: '💪', frequency: 'weekly' },
    titles: ['Get consistent at the gym', 'Do 50 push-ups in a row'],
    milestones: (t) => quantityMilestones(t, 'rep', 'reps') || [
      { title: 'Train consistently for 2 weeks', description: '' },
      { title: 'Train consistently for 1 month', description: '' },
      { title: 'Hit your first strength milestone', description: '' },
      { title: 'Reach the target', description: '' },
    ],
    habits: [
      { title: 'Strength session', frequency: 'weekly', emoji: '💪', category: 'fitness' },
      { title: 'Stretch', frequency: 'daily', emoji: '🧘', category: 'health' },
    ],
  },
  {
    id: 'mindfulness',
    pattern: /\b(meditate|meditation|mindful|journal|sleep|stress|calm)\b/i,
    goal: { category: 'personal', emoji: '🧘', type: 'short-term' },
    habit: { category: 'mindfulness', emoji: '🧘', frequency: 'daily' },
    titles: ['Meditate every day', 'Build a journalling habit', 'Sleep 8 hours'],
    milestones: () => [
      { title: 'Seven days in a row', description: '' },
      { title: 'Three weeks in a row', description: '' },
      { title: 'Two months in a row', description: '' },
      { title: 'Make it automatic', description: '' },
    ],
    habits: [
      { title: 'Morning meditation', frequency: 'daily', emoji: '🧘', category: 'mindfulness' },
      { title: 'Evening journal', frequency: 'daily', emoji: '✍️', category: 'mindfulness' },
    ],
  },
  {
    id: 'study',
    pattern: /\b(degree|exam|course|certificat|study|graduate|thesis|semester)\b/i,
    goal: { category: 'learning', emoji: '🎓', type: 'long-term' },
    habit: { category: 'learning', emoji: '🎓', frequency: 'daily' },
    titles: ['Pass my final exams', 'Finish my certification'],
    milestones: () => [
      { title: 'Finish the first quarter of the material', description: '' },
      { title: 'Reach the halfway point', description: '' },
      { title: 'Finish the material', description: '' },
      { title: 'Revise and sit the exam', description: '' },
    ],
    habits: [
      { title: 'Study session', frequency: 'daily', emoji: '📖', category: 'learning' },
      { title: 'Practice questions', frequency: 'weekly', emoji: '📝', category: 'learning' },
    ],
  },
];

/** Pulls a target number out of a title and splits it into quarter steps. */
function quantityMilestones(title, unitSingular, unitPlural) {
  const m = /(\d[\d,]*(?:\.\d+)?)/.exec(title || '');
  if (!m) return null;

  const total = Number(m[1].replace(/,/g, ''));
  // Below 4 there aren't four distinct steps to make, and a huge number is
  // usually a year ("read in 2026") rather than a target.
  if (!Number.isFinite(total) || total < 4 || total > 100000) return null;

  const unit = (n) => {
    if (!unitPlural) return String(n);
    return `${n} ${n === 1 ? unitSingular : unitPlural}`;
  };
  const step = (fraction, label) => {
    const value = Math.round(total * fraction);
    return { title: `Reach ${unit(value)}`, description: label };
  };

  return [
    step(0.25, 'A quarter of the way'),
    step(0.5, 'Halfway there'),
    step(0.75, 'Three quarters'),
    { title: `Reach ${unit(total)}`, description: 'The finish line' },
  ];
}

function matchArchetype(title) {
  if (!title || title.trim().length < 3) return null;
  return ARCHETYPES.find((a) => a.pattern.test(title)) || null;
}

/** Emoji / category / type guesses for a goal, from its title alone. */
export function inferGoalFields(title) {
  const a = matchArchetype(title);
  if (!a) return null;
  return { ...a.goal, archetype: a.id };
}

/** Emoji / category / frequency guesses for a habit, from its title alone. */
export function inferHabitFields(title) {
  const a = matchArchetype(title);
  if (!a) return null;
  return { ...a.habit, archetype: a.id };
}

/**
 * Title completions for the given partial input. Matches archetype titles on a
 * word-prefix basis so "mar" offers "Run a marathon", not just titles starting
 * with those letters.
 */
export function suggestTitles(query, kind = 'goal') {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const pool = [];
  ARCHETYPES.forEach((a) => {
    (kind === 'habit' ? a.habits.map((h) => h.title) : a.titles).forEach((t) => {
      if (!pool.includes(t)) pool.push(t);
    });
  });

  const scored = pool
    .map((t) => {
      const lower = t.toLowerCase();
      if (lower === q) return null;
      if (lower.startsWith(q)) return { t, score: 0 };
      if (lower.split(/\s+/).some((w) => w.startsWith(q))) return { t, score: 1 };
      if (lower.includes(q)) return { t, score: 2 };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, 4).map((s) => s.t);
}

/** Milestone suggestions for a goal title. Always returns something usable. */
export function suggestMilestones(title) {
  const a = matchArchetype(title);
  if (a) return a.milestones(title);

  const generic = quantityMilestones(title, '', '');
  if (generic) return generic;

  if (!title || title.trim().length < 3) return [];
  return [
    { title: 'Break the goal into a first concrete step', description: 'Week one' },
    { title: 'Reach the quarter mark', description: '' },
    { title: 'Reach the halfway point', description: '' },
    { title: 'Final push to the finish', description: '' },
  ];
}

/** Habits that support a given goal title. */
export function suggestHabits(title) {
  const a = matchArchetype(title);
  return a ? a.habits : [];
}

/**
 * Escalates to the model for goals the rules above don't recognise.
 *
 * Never throws: the caller already has local suggestions on screen, so a
 * failure here degrades to "no extra ideas" rather than an error state. The
 * `reason` distinguishes "this server has no API key" (hide the button) from a
 * transient failure (worth offering a retry).
 */
export async function fetchAIIdeas({ kind, title, category, description }) {
  try {
    const { data } = await suggestionsAPI.generate({
      kind,
      title,
      category: category || undefined,
      description: description || undefined,
    });
    const items = kind === 'habits' ? data.data.habits : data.data.milestones;
    return { ok: true, items: items || [] };
  } catch (err) {
    const code = err.response?.data?.error?.code;
    if (code === 'SUGGESTIONS_UNAVAILABLE') {
      return { ok: false, reason: 'unavailable', items: [] };
    }
    if (code === 'RATE_LIMITED') {
      return { ok: false, reason: 'rate-limited', items: [] };
    }
    return { ok: false, reason: 'failed', items: [] };
  }
}

export { GOAL_CATEGORIES, HABIT_CATEGORIES };
