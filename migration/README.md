# Migration & Deployment Records

This folder is the written record of every infrastructure change made to LOCKED IN
across its three platforms: **Render** (backend API), **Vercel** (web app), and
**MongoDB Atlas** (database).

Nothing in this folder contains secret values. Environment variables are recorded
by **name and purpose only** — the live values exist solely in the Render and Vercel
dashboards and in the gitignored `backend/.env`.

## Contents

| File | What it covers |
|------|----------------|
| [`2026-08-05-restore-deployment.md`](2026-08-05-restore-deployment.md) | The change record for restoring the broken deployment |
| [`2026-08-05-fix-stuck-loading-screen.md`](2026-08-05-fix-stuck-loading-screen.md) | Fix for the web app hanging on `◉ LOADING…` |
| [`environment-variables.md`](environment-variables.md) | Inventory of every env var on every platform |
| [`runbook.md`](runbook.md) | How to redeploy, diagnose, and recover |

## Current live architecture

```
Browser
   │
   ▼
https://goalpath-web.vercel.app        Vercel · project "goalpath-web"
   │   (Vite SPA, static build from web/)
   │   calls VITE_API_URL, baked in at BUILD time
   ▼
https://goalpath.onrender.com/api      Render · web service "goalpath"
   │   (Express, root dir backend/, branch main, auto-deploy on commit)
   │   CORS allow-list must contain the Vercel origin
   ▼
goalpath.ikkbjgn.mongodb.net           MongoDB Atlas · free M0 cluster
       database: test
       collections: users, goals, habits, milestones, habitlogs
```

## Platform identifiers

| Platform | Resource | ID |
|----------|----------|-----|
| Render | Web service `goalpath` | `srv-d9o61t5aeets73d5pfa0` |
| Render | Workspace | `tea-d9o5p3u1egvs7398e250` |
| Vercel | Project `goalpath-web` | `prj_mbZoroik9x1AX3OeG9C2dXWfpLT3` |
| Vercel | Org `lalon147s-projects` | `team_WMZdcOzGgZAfi74BnZTNSxIo` |
| Atlas | Cluster `goalpath` | `goalpath.ikkbjgn.mongodb.net` |

## Two things that are easy to get wrong

1. **`VITE_API_URL` is compile-time, not runtime.** Vite inlines it into the JS
   bundle during `vite build`. Changing it in the Vercel dashboard does nothing
   until you **redeploy**. There is no way to change the API URL of an existing
   build.

2. **`CORS_ORIGIN` on Render must list the exact Vercel origin.** It is compared
   as an exact string — scheme included, no trailing slash, no wildcard. If the
   web app's domain changes, the backend rejects every browser request with a
   CORS error that looks like the API is down when it is not.
