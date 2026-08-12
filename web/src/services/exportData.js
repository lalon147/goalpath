import { goalsAPI, habitsAPI } from './api';

const PAGE_SIZE = 100; // the backend caps limit at 100, so larger asks are silently clamped

// Walks every page rather than trusting the first one: a user with more than
// PAGE_SIZE goals would otherwise get a partial export labelled as complete.
async function fetchAllGoals() {
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await goalsAPI.getAll({ limit: PAGE_SIZE, page });
    all.push(...(data.data.goals || []));
    totalPages = data.data.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

/**
 * Builds the full export payload straight from the API rather than from the
 * redux cache, which only holds whatever pages the user happened to open.
 */
export async function buildExport(user) {
  const [goals, habitsRes] = await Promise.all([
    fetchAllGoals(),
    habitsAPI.getAll(),
  ]);

  const habits = habitsRes.data.data || [];

  return {
    exportedAt: new Date().toISOString(),
    format: 'goalpath.export.v1',
    account: user
      ? {
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
          timezone: user.timezone,
          memberSince: user.createdAt,
          preferences: user.preferences,
        }
      : null,
    counts: { goals: goals.length, habits: habits.length },
    goals,
    habits,
  };
}

export const exportFilename = () =>
  `goalpath-export-${new Date().toISOString().slice(0, 10)}.json`;

/** Fetches everything, then hands the browser a JSON file to save. */
export async function downloadExport(user) {
  const payload = await buildExport(user);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = exportFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoking immediately can cancel the download in some browsers, so this
  // waits a tick before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return payload.counts;
}
