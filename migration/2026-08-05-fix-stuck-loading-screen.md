# 2026-08-05 — Fix: web app stuck on the loading screen

**Reported:** the homepage showed only `◉ LOADING…` and never rendered.

**Outcome:** fixed and verified in a real browser against production.

This was an **application bug, not a deployment problem**. It was present before
the deployment restore earlier the same day and was independent of it — the site
would have behaved this way on any host.

## Root cause

`web/src/store/slices/authSlice.js` starts with `initializing: true`. The only
things that set it back to `false` are the `loadUser`, `signin`, and `signup`
reducer cases.

But `web/src/App.jsx` dispatched `loadUser()` **only when a token already existed**:

```js
const token = localStorage.getItem('accessToken');
if (token) dispatch(loadUser());   // logged-out visitors dispatch nothing
```

A visitor with no stored token therefore dispatched nothing at all, `initializing`
stayed `true` forever, and `HomePage` returned its loading branch on every render:

```js
if (initializing) return (<div>◉ LOADING…</div>);
```

Every first-time visitor — that is, everyone who was not already signed in — saw a
permanent loading screen. `PrivateRoute` had the same dependency and would have
hung on `◉ INITIALIZING…` for the same reason.

## Fix

Always dispatch. `loadUser` already returns `rejectWithValue('No token')` when no
token is stored, short-circuiting **before** any network request, and
`loadUser.rejected` sets `initializing = false`. The guard in `App.jsx` was
duplicating a check the thunk already performed, while suppressing the state
transition that depended on it.

```js
useEffect(() => {
  dispatch(loadUser());
}, [dispatch]);
```

One file changed, `web/src/App.jsx`. No change to the slice, and no extra network
traffic for logged-out visitors.

## Verification

Reproduced first against production with headless Chrome — the live page yielded
`LOADING…` and nothing else. After the fix, in a scripted Chromium session against
the deployed site:

| Check | Result |
|-------|--------|
| Landing page shows `LOADING…` | no |
| Landing page renders `Get Started` / `Sign In` | yes |
| Sign-up through the real UI | redirected to `/dashboard` |
| Dashboard stuck on `INITIALIZING…` | no |
| **Reload while logged in** (exercises `loadUser` *with* a token) | stayed on `/dashboard` |
| Browser console errors | none |
| API URL baked into the new bundle | `https://goalpath.onrender.com/api` |

The test account created during verification was deleted afterward; the 6
pre-existing users were untouched.

## Note for future testing

The homepage bug is invisible to `curl` and to any check that only asserts
HTTP 200 — the server returns a perfectly good HTML shell, and the failure happens
in React after hydration. The earlier deployment verification passed for exactly
this reason. **Rendering bugs need a browser**, not a status code.

A local `vite preview` build also cannot exercise the signed-in flow, because
`web/.env.local` bakes `VITE_API_URL=http://localhost:3000/api` into the local
build. Verify authenticated behaviour against the deployed site, or run the
backend locally.
