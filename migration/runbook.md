# Operational Runbook

## Diagnose in order — 30 seconds

Work down this list. The first failing check is the cause; there is no need to
look further.

```bash
# 1. Does the database cluster exist in DNS?
dig +short SRV _mongodb._tcp.goalpath.ikkbjgn.mongodb.net
#    empty output  -> cluster is PAUSED or deleted. Resume it in the Atlas UI.
#                     This is the single most likely cause of a total outage.

# 2. Is the backend up and connected?
curl -s https://goalpath.onrender.com/api/health
#    expect: {"status":"Server is running", ... "database":"Connected"}
#    "database":"Disconnected" (503) -> backend is alive, Atlas is not reachable
#    no response at all               -> Render service is down or cold-starting
#                                        (free tier: allow 60s on first hit)

# 3. Is the web app up?
curl -s -o /dev/null -w "%{http_code}\n" https://goalpath-web.vercel.app/

# 4. Does the page actually RENDER? A 200 does not mean the app works —
#    React failures happen after the HTML shell is served.
google-chrome --headless --no-sandbox --disable-gpu \
  --virtual-time-budget=10000 --dump-dom https://goalpath-web.vercel.app/ \
  | grep -o 'LOADING…\|Get Started'
#    "Get Started" -> rendering fine.  "LOADING…" only -> app is stuck.

# 5. Does the browser origin pass CORS?
curl -s -i -X OPTIONS https://goalpath.onrender.com/api/auth/signup \
  -H "Origin: https://goalpath-web.vercel.app" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
#    no header -> CORS_ORIGIN on Render is missing this origin
```

## Symptom → cause

| Symptom | Cause | Fix |
|---------|-------|-----|
| Every Render deploy fails at startup | Atlas unreachable; `server.js` exits 1 | Resume the cluster, then redeploy |
| Health says `Disconnected`, 503 | Atlas paused, or IP not allow-listed | Resume cluster; ensure allow-list has `0.0.0.0/0` |
| Web app loads but every call fails in the browser, yet `curl` works | CORS origin not allow-listed | Add the origin to `CORS_ORIGIN` on Render |
| Web app calls the *wrong* API URL | Stale bundle — `VITE_API_URL` is inlined at build time | **Redeploy**; changing the env var alone does nothing |
| 404 on every API call | `VITE_API_URL` missing the `/api` suffix | Correct it, then redeploy |
| First request after idle takes ~60s | Render free-tier cold start | Expected behaviour |
| Page renders only `◉ LOADING…` or `◉ INITIALIZING…` | Redux `auth.initializing` never cleared | See [`2026-08-05-fix-stuck-loading-screen.md`](2026-08-05-fix-stuck-loading-screen.md). Nothing to do with hosting — `curl` returns 200 while the page is broken |

## Redeploying

**Backend (Render)** — auto-deploys on every push to `main`.
Work lands on `develop`, then merges to `main`:

```bash
git checkout main && git merge develop && git push origin main
```

To redeploy without a code change, use the Render dashboard, or change any
environment variable (that alone triggers a deploy).

**Web (Vercel)** — from the `web/` directory:

```bash
cd web && vercel --prod --yes
```

Always redeploy the web app after changing `VITE_API_URL`.

## Rotating secrets

The JWT secrets and the Atlas password currently live in both `backend/.env`
(local, gitignored) and the Render dashboard. To rotate:

1. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Update the variable in the Render dashboard — this triggers a redeploy on its own.
3. Update `backend/.env` locally to match.

Rotating `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` invalidates every issued
token, signing all users out. That is the intended behaviour if a secret leaks.

## What needs a human

Atlas cluster operations — resuming, resizing, recreating, changing the network
allow-list — cannot be automated from this repo. They need either the Atlas web UI
or an Organization API key that only the account owner can mint.
