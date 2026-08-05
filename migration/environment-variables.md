# Environment Variable Inventory

**No secret values appear in this file.** Values live only in the Render dashboard,
the Vercel dashboard, and the gitignored `backend/.env`.

Verified on 2026-08-05: no `.env` file is tracked by git. Only `web/.env.example`
is committed, and it contains a placeholder. `backend/.env` is ignored via
`backend/.gitignore`; `web/.env.local` via `web/.gitignore`.

## Render — service `goalpath` (srv-d9o61t5aeets73d5pfa0)

All 12 set on 2026-08-05.

| Variable | Purpose | Secret |
|----------|---------|--------|
| `MONGODB_URI` | Atlas SRV connection string. No database name in the path, so it resolves to the default `test` database — which is where the existing data actually lives. Do not "fix" this by appending a db name; it would silently point at an empty database. | **yes** |
| `NODE_ENV` | `production` | no |
| `JWT_ACCESS_SECRET` | Signs short-lived access tokens | **yes** |
| `JWT_REFRESH_SECRET` | Signs refresh tokens. Must differ from the access secret. | **yes** |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | no |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | no |
| `CORS_ORIGIN` | Comma-separated exact origins. Contains the Vercel production domain plus localhost ports for dev. | no |
| `BCRYPT_ROUNDS` | `12` — password hashing cost | no |
| `RATE_LIMIT_WINDOW_MS` | `60000` | no |
| `RATE_LIMIT_MAX_REQUESTS` | `100` per window per IP | no |
| `LOG_LEVEL` | `info` | no |
| `LOG_DIR` | `./logs` — logger degrades to console-only if unwritable | no |

`PORT` is **deliberately not set**. Render injects its own; overriding it makes the
service unreachable because Render port-scans for the listening port.

## Vercel — project `goalpath-web`

| Variable | Environments | Purpose |
|----------|--------------|---------|
| `VITE_API_URL` | Production, Preview | Points at the Render API, including the `/api` suffix. `web/src/services/api.js` appends paths directly to it. |
| `VITE_API_URL` | Development | Points at `localhost:3000/api` for local work |

The `/api` suffix matters. The client builds request paths as `${BASE_URL}/auth/signin`,
so omitting the suffix produces 404s on every call.

## MongoDB Atlas

No environment variables. Two settings that must hold for the backend to work:

- **Cluster must be resumed.** A paused free-tier M0 cluster stops resolving in DNS
  entirely (NXDOMAIN), which looks identical to a deleted cluster.
- **Network access must permit Render's outbound IPs.** Render free tier does not
  offer static outbound IPs, so the allow-list entry must be `0.0.0.0/0`.
  Confirmed working on 2026-08-05.
