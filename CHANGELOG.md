# What we added, and when

A plain record of every change to LOCKED IN (formerly GoalPath), newest first.

---

## August 2026

### 16 Aug — Habit category fix
- Fixed habit creation failing whenever no category was chosen
- Discovered this broke **every** habit creation from the mobile app, which never sends a category
- Made the request validator read its category list from the schema, so the two can't drift apart again
- Added 7 tests covering it

### 13 Aug — Security hardening
- Stopped password reset links being written to the server log
- Fixed rate limiting, which was keying on the proxy's IP and so throttling nobody
- Added a per-account lockout after 10 failed sign-ins
- Added security headers (`helmet`) to the API and a content-security policy to the web app
- Stored refresh tokens as hashes instead of in the clear
- Moved mobile tokens into the iOS Keychain / Android Keystore
- Made CORS and the startup config checks fail closed instead of silently open
- Cleared every dependency advisory on the backend and web (mongoose, express, react-router, axios, joi)
- Added a GitHub Actions security workflow and 12 authorisation tests — the first tests in the project

### 12 Aug — Signup fix
- Fixed new users being dropped back on the registration form after saving their recovery code

### 12 Aug — Rename
- Renamed the app from GoalPath to LOCKED IN across 44 files

### 12 Aug — Daily practice
- Added the daily practice page to the web client

### 12 Aug — Social features *(the big one — 65 files, 5,206 lines)*
- Added friends: search, requests, accept/decline
- Added shared goals with invitations and a per-member leaderboard
- Switched to username-only signup with no personal data, using one-time recovery codes
- Added weekly habit logging

### 10 Aug — Habits and suggestions
- Fixed habit creation on the web client
- Made the AI suggestion engine offer input rather than demand it

### 10 Aug — Profile
- Wired up the profile buttons — edit profile, change password, notification settings — which previously did nothing

### 9 Aug — Password reset
- Added the password reset flow end to end
- Made the reminder and notification settings actually save

### 8 Aug — Sleeping backend
- Fixed signup and login failing when the free-tier backend was asleep, telling the user it's waking up instead of showing a generic error

### 6 Aug — Mobile API
- Pointed the mobile app at the deployed backend instead of a local ngrok tunnel

### 5 Aug — Loading screen
- Fixed the web app hanging forever on the loading screen when no login was stored

### 5 Aug — Deployment records
- Started `migration/` as the written record of every infrastructure change

### 3 Aug — Hosting
- Prepared the web app for Vercel deployment
- Made backend startup failures visible in Render's logs instead of dying silently
- Improved text contrast across the web theme

---

## Still to do

- **Mobile has no category picker** on the habit screen, so habits saved there have no category
- **22 mobile dependency advisories** remain, all in the Expo build toolchain — needs a planned SDK 54 → 57 upgrade with device testing
- **Refresh tokens are hashed but not rotated**, and web tokens still live in `localStorage` — both need the web and mobile clients to ship together
