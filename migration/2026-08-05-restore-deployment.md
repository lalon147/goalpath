# 2026-08-05 — Restore the broken deployment

**Outcome:** backend, web app, and database are live and verified end-to-end.

Before this change the Render service had **five consecutive failed deploys** and
the web app could not reach any API.

## Root cause

A single failure explained everything: the MongoDB Atlas cluster
`goalpath.ikkbjgn.mongodb.net` was **paused**. A paused free-tier M0 cluster is
removed from DNS, so `dig` returned NXDOMAIN — indistinguishable from a deleted
cluster. `backend/src/server.js` calls `process.exit(1)` when the Mongo connection
fails, so the service died during startup on every deploy and Render marked each
one `update_failed`.

The cluster was resumed from the Atlas UI (the one step that required a human —
Atlas cluster lifecycle cannot be driven without an Organization API key).

Confirmation that DNS came back:

```
$ dig +short SRV _mongodb._tcp.goalpath.ikkbjgn.mongodb.net
0 0 27017 ac-px7efx6-shard-00-00.ikkbjgn.mongodb.net.
0 0 27017 ac-px7efx6-shard-00-01.ikkbjgn.mongodb.net.
0 0 27017 ac-px7efx6-shard-00-02.ikkbjgn.mongodb.net.
```

Existing data was intact — 5 collections, 6 user records preserved.

## Changes made

### Render
- Set all 12 environment variables (see [`environment-variables.md`](environment-variables.md)).
  `CORS_ORIGIN` now includes `https://goalpath-web.vercel.app`, which it previously
  did not — without it the browser would have blocked every API call even after the
  database came back.
- Deploy `dep-d9pgk0ht0dsc73dkn24g` reached status **live** at 2026-08-05T10:02:18Z.

### Vercel
- Replaced `VITE_API_URL` in all three environments. The existing values were
  encrypted and unreadable via the CLI, so rather than guess at what they pointed
  to, they were deleted and re-added with known-correct values.
- Redeployed to production (`dpl_DpQkxJ5ZFGi9kr6tWkCZTRurwy7h`). **The redeploy was
  mandatory, not cosmetic** — Vite inlines `VITE_API_URL` at build time, so the
  previously deployed bundle would have kept calling the old URL forever.
- Deleted two abandoned projects from earlier failed attempts, `goalpath` and
  `goalpath-t67s`, with the owner's approval. `goalpath-web` is now the only
  LOCKED IN project.

### MongoDB Atlas
- No schema or data changes. Cluster resumed; connectivity from Render confirmed.

### Code
- None. No application source file was modified. The failure was entirely
  configuration and platform state.

## Verification performed

| Check | Result |
|-------|--------|
| `GET /api/health` | 200, `"database":"Connected"` |
| CORS preflight from the Vercel origin | 204 with `access-control-allow-origin` |
| CORS preflight from an unlisted origin | no allow-origin header returned |
| `POST /api/auth/signup` | 201, user created in Atlas |
| `POST /api/auth/signin` | 200, access + refresh tokens returned |
| `POST /api/goals` (authenticated) | 201, goal persisted |
| `GET /api/goals` | read-back confirmed the write |
| `GET /api/users/profile` | 200 |
| `GET /api/analytics/dashboard` | 200, reflected the created goal |
| `https://goalpath-web.vercel.app/` | 200 |
| SPA deep link `/dashboard` | 200 (rewrite rule working) |
| API URL baked into the shipped JS bundle | `https://goalpath.onrender.com/api` |
| Every `api.*()` call in `web/src` | all map to real backend routes |

All test records created during verification were deleted afterward. The 6
pre-existing user records were not touched.

## Difficulties, and how each was resolved

| Problem | Resolution |
|---------|-----------|
| Atlas cluster unreachable, NXDOMAIN | Cluster was paused, not deleted. Owner resumed it. |
| 5 failed Render deploys with no obvious cause | All were the same startup crash from the dead database, not 5 separate faults. |
| Vercel env values masked as `[SENSITIVE]` | Deleted and re-added rather than guessing at unreadable values. |
| Env change alone would not fix the web app | Recognised Vite's build-time inlining and forced a production redeploy. |
| `vercel project rm --yes` rejected the flag | The flag does not exist on this command; piped the confirmation to stdin instead. |

Four apparent API failures during testing turned out to be faults in the test
commands, not the application. Recorded here so they are not mistaken for bugs later:

- Signup rejected `@goalpath.test` — Joi validates the TLD against the IANA list
  and `.test` is not on it. A real TLD works.
- `POST /goals` returned a validation error — the payload omitted the required
  `type` field (`short-term` | `long-term`).
- `GET /users/me` returned 404 — the route is `/users/profile`.
- `GET /analytics/overview` returned 404 — the route is `/analytics/dashboard`,
  which is what the web app actually calls.

## Known limitations

- **Free-tier M0 clusters can pause again** after a period of inactivity, and the
  entire stack fails the same way when they do. `runbook.md` documents the
  30-second diagnosis.
- **Render free tier cold-starts.** After ~15 minutes idle the first request can
  take 30–60 seconds. This is expected, not a fault.
- **Atlas is not scriptable from here.** Without an Organization API key, cluster
  operations need a human in the Atlas UI.
