# GitBlame AI — Product Requirements Document

> Step-by-step implementation guide. Follow phases in order. Each phase has a clear done-state before moving on.

---

## Product Vision

**One-line pitch:** "Git blame, but Claude does it for you."

**Problem:** When a bug hits production, developers spend 30–60 minutes manually bisecting commits, reading diffs, and forming hypotheses. This is mechanical work a senior engineer does by pattern-matching — exactly what an LLM is good at.

**Solution:** A focused web tool that takes a bug report and returns the exact commit, line, and fix within 30 seconds.

**Target user:** A developer who just got paged or received a bug report and wants to skip straight to root cause.

---

## Success Metrics (MVP)

- Time from "paste error" to "see culprit commit": < 30 seconds
- Confidence score > 70 on clearly-introduced bugs: target 80% of cases
- Zero auth friction: GitHub OAuth in one click, no separate account needed
- Works on repos up to 80 commits deep without user configuration

---

## Phases Overview

| Phase | What Gets Built | Done When |
|-------|----------------|-----------|
| 0 | Project scaffold + env | `node server/index.js` runs without error |
| 1 | GitHub OAuth | Can log in, see user object in session |
| 2 | GitHub API layer | `/api/repos` returns real repo list |
| 3 | Claude agent | `/api/analyze` returns valid analysis JSON |
| 4 | Frontend shell | React app loads, routing between steps works |
| 5 | Landing + Auth UI | Login button → GitHub → back to app |
| 6 | Repo selector UI | Can browse and click a repo |
| 7 | Bug input UI | Can fill form and trigger analysis |
| 8 | Analysis result UI | All 5 result sections render correctly |
| 9 | Polish + edge cases | Loading states, errors, empty states handled |

---

## Phase 0 — Project Scaffold

**Goal:** Runnable skeleton with no functionality yet.

### Steps

1. Create directory structure:
   ```
   /WhodidIt
     /server
     /client
   ```

2. Initialize server `package.json` in root:
   ```bash
   npm init -y
   ```

3. Install server dependencies:
   ```bash
   npm install express express-session cors @octokit/rest @anthropic-ai/sdk axios dotenv
   ```

4. Create `/server/index.js` with just a health check:
   ```js
   require('dotenv').config();
   const express = require('express');
   const app = express();
   app.get('/health', (req, res) => res.json({ ok: true }));
   app.listen(3001, () => console.log('Server on 3001'));
   ```

5. Create `.env` with placeholder values (see README for full list)

6. Add `.gitignore`:
   ```
   node_modules/
   .env
   client/node_modules/
   client/dist/
   ```

7. Initialize Vite React app:
   ```bash
   cd client
   npm create vite@latest . -- --template react
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

8. Configure Tailwind in `client/src/index.css` and `tailwind.config.js`

### Done State
- `node server/index.js` → `GET /health` returns `{"ok":true}`
- `cd client && npm run dev` → Vite default page loads at localhost:5173

---

## Phase 1 — GitHub OAuth

**Goal:** User can log in with GitHub and the server holds a valid access token in session.

### Files to Create
- `server/auth.js`
- Add OAuth routes to `server/index.js`

### Steps

1. Create `server/auth.js` with `getAccessToken(code)` and `getGitHubUser(token)` (see spec above)

2. Add to `server/index.js`:
   ```js
   const session = require('express-session');
   const cors = require('cors');
   
   app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
   app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
   
   app.get('/auth/github', (req, res) => {
     res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`);
   });
   
   app.get('/auth/github/callback', async (req, res) => {
     const token = await getAccessToken(req.query.code);
     const user = await getGitHubUser(token);
     req.session.token = token;
     req.session.user = user;
     res.redirect(`${process.env.CLIENT_URL}?auth=success`);
   });
   
   app.get('/api/me', (req, res) => res.json({ user: req.session.user || null }));
   app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ ok: true }); });
   ```

3. Create GitHub OAuth App (see README setup section) — copy Client ID and Secret to `.env`

### Verification
- Visit `http://localhost:3001/auth/github` in browser
- Authorize app on GitHub
- Lands back at `http://localhost:5173?auth=success`
- `GET http://localhost:3001/api/me` returns your GitHub user object

### Done State
- Session contains `token` and `user` after OAuth flow
- `/api/me` returns `{ user: { login: "yourname", ... } }` when logged in

---

## Phase 2 — GitHub API Layer

**Goal:** Fetch repos and commits from GitHub using the stored OAuth token.

### Files to Create
- `server/github.js`

### Steps

1. Create `server/github.js` with three functions (see spec above):
   - `getUserRepos(token)` — returns 30 most recently updated repos
   - `getRecentCommits(token, owner, repo, count)` — returns N commits with metadata
   - `getCommitDiff(token, owner, repo, sha)` — returns one commit with file patches

2. Add route to `server/index.js`:
   ```js
   app.get('/api/repos', async (req, res) => {
     if (!req.session.token) return res.status(401).json({ error: 'Not authenticated' });
     const repos = await getUserRepos(req.session.token);
     res.json({ repos });
   });
   ```

### Verification (use Postman or curl after logging in via browser)
```bash
# After logging in via browser to set session cookie:
curl http://localhost:3001/api/repos -b "connect.sid=YOUR_SESSION_COOKIE"
```
Should return array of repos with `full_name`, `language`, `updated_at`.

### Data Shape to Verify

Repos:
```json
[{ "id": 123, "name": "my-repo", "full_name": "user/my-repo", "private": false, "language": "TypeScript", "updated_at": "..." }]
```

Commits (test with any public repo sha):
```json
[{ "hash": "abc123...", "short_hash": "abc123", "message": "fix: ...", "author": "...", "date": "..." }]
```

### Done State
- `/api/repos` returns real repo list for logged-in user
- `getCommitDiff` returns file patches (test manually in Node REPL)

---

## Phase 3 — Claude Agent (Core Logic)

**Goal:** The two-pass analysis returns a valid, useful JSON result for a real bug.

### Files to Create
- `server/agent.js`

### Steps

1. Create `server/agent.js` with `findCulpritCommit()` (see spec above)

2. Add `/api/analyze` route to `server/index.js` (see spec above)

3. Test the full pipeline end-to-end with Postman:

### Test Payload for Postman
```json
POST http://localhost:3001/api/analyze
Content-Type: application/json
Cookie: connect.sid=YOUR_SESSION_COOKIE

{
  "owner": "YOUR_GITHUB_USERNAME",
  "repo": "YOUR_REPO_NAME",
  "error": "TypeError: Cannot read properties of undefined (reading 'map')",
  "stackTrace": "at processItems (src/utils.js:42:18)\n  at handleResponse (src/api.js:18:5)",
  "commitCount": 20
}
```

### Expected Response Shape
```json
{
  "commits_scanned": 20,
  "result": {
    "culprit_commit": {
      "hash": "...",
      "short_hash": "...",
      "message": "...",
      "author": "...",
      "date": "...",
      "confidence": 75
    },
    "smoking_gun": "...",
    "explanation": "...",
    "fix": "...",
    "could_have_caught_with": "..."
  }
}
```

### Error Handling to Implement
- If Pass 1 JSON parse fails → fall back to first 3 commits
- If `getCommitDiff` throws (deleted commit, access denied) → skip with `.catch(() => null)`
- If Pass 2 JSON parse fails → return a graceful error object (not a 500)

### Done State
- `/api/analyze` returns valid JSON with all 5 result fields
- Confidence score is a number, not a string
- Works on a repo you own with at least 5 commits

---

## Phase 4 — Frontend Shell

**Goal:** React app loads, step-based routing works, components are stubbed.

### Steps

1. Create stub components (just return `<div>ComponentName</div>`) for:
   - `LandingPage.jsx`
   - `RepoSelector.jsx`
   - `BugInput.jsx`
   - `AnalysisResult.jsx`
   - `CommitCard.jsx`
   - `LoadingState.jsx`

2. Create `App.jsx` with step router (see spec above)

3. Configure `vite.config.js` for proxy (optional — avoids CORS issues in dev):
   ```js
   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         '/api': 'http://localhost:3001',
         '/auth': 'http://localhost:3001',
       }
     }
   });
   ```
   Note: If using proxy, change all fetch URLs from `http://localhost:3001/api/...` to `/api/...`

4. Add `main.jsx` entry point

### Done State
- `npm run dev` → app loads at localhost:5173
- Changing `step` state manually shows different stub components
- `useEffect` in `App.jsx` calls `/api/me` on load (check Network tab)

---

## Phase 5 — Landing Page + Auth UI

**Goal:** Polished landing page with GitHub login that actually works.

### `LandingPage.jsx` Requirements

**Layout:** Centered, full-height, dark background (`bg-gray-950`)

**Content (top to bottom):**
- Small eyebrow text: "Powered by Claude AI"
- Large headline: "Find the commit that broke everything."
- Subheadline: "Paste a bug. Point at a repo. Get the exact commit, line, and fix in seconds."
- Primary CTA button: "Login with GitHub →" (calls `onLogin` prop)
- Below button: three feature bullets with icons:
  - "Two-pass AI analysis — narrows 40 commits to 3, then deep-reads diffs"
  - "Confidence scoring — know how sure the AI is"
  - "Built-in fix — get the code change, not just the diagnosis"

**Style notes:**
- Use `bg-gray-950` for page, `bg-gray-900` for cards
- GitHub button: `bg-gray-800 hover:bg-gray-700` with GitHub icon (SVG inline or lucide-react)
- Headline: large, bold, white. Subheadline: `text-gray-400`

### Auth Flow
- `onLogin` → `window.location.href = 'http://localhost:3001/auth/github'`
- On return, `?auth=success` in URL → `useEffect` in `App.jsx` detects this and re-fetches `/api/me`
- Update `App.jsx` useEffect to handle the `?auth=success` query param:
  ```js
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.json())
      .then(({ user }) => {
        if (user) { setUser(user); setStep('repo'); }
      });
  }, []);
  ```

### Done State
- Landing page looks polished
- Clicking "Login with GitHub" completes the full OAuth flow
- After login, user is on the Repo Selector step (not back on landing)

---

## Phase 6 — Repo Selector UI

**Goal:** User sees their repos in a grid and can click one to proceed.

### `RepoSelector.jsx` Requirements

**Header:** "Hi, {user.login}" + logout button (top right)

**Subheader:** "Select a repository to analyze"

**Repo Grid:** 2-column grid (responsive, 1 col on mobile)

Each repo card shows:
- Repo name (bold)
- Language badge (colored dot — e.g. yellow for JS, blue for TypeScript)
- Private/public badge
- Last updated (relative time — "3 days ago")
- Hover state: `bg-gray-800` → `bg-gray-700`

**Loading state:** Show 6 skeleton cards while fetching

**Empty state:** "No repositories found."

### Data Fetching
```js
useEffect(() => {
  fetch('/api/repos', { credentials: 'include' })
    .then(r => r.json())
    .then(({ repos }) => setRepos(repos));
}, []);
```

### Done State
- Repos load from real GitHub API
- Clicking a repo calls `onSelect(repo)` and moves to BugInput step
- Logout button works (calls `POST /api/logout`, resets to landing step)

---

## Phase 7 — Bug Input UI

**Goal:** Clean form to enter the bug details before running analysis.

### `BugInput.jsx` Requirements

**Header:** Back arrow + "Analyzing: {repo.full_name}"

**Form fields:**

1. **Error message** (required)
   - Label: "Error Message"
   - Textarea, 3 rows
   - Placeholder: "TypeError: Cannot read properties of undefined (reading 'map')"
   - Red asterisk on label

2. **Stack trace** (optional)
   - Label: "Stack Trace (optional — improves accuracy)"
   - Textarea, 5 rows
   - Placeholder: "at processItems (src/utils.js:42:18)..."
   - Monospace font (`font-mono`)

3. **Commit scan depth**
   - Label: "Commits to scan: {value}"
   - Slider: min=20, max=60, step=20
   - Below slider: three labels "20", "40", "60" aligned to positions
   - Default: 40

**Submit button:**
- Text: "Find the Culprit"
- Full width, large
- Disabled + spinner when loading
- Color: `bg-red-600 hover:bg-red-500`

**Validation:** Error message must not be empty — show inline error if user submits empty.

### Done State
- Form submits with correct `{ error, stackTrace, commitCount }` shape
- Calls `onAnalyze()` which triggers backend request
- Back button returns to repo selector

---

## Phase 8 — Analysis Result UI

**Goal:** The main payoff — render all 5 result sections clearly and beautifully.

### `LoadingState.jsx`

Show while `loading === true`:
- Animated spinner or pulsing dots
- Two-line status text that cycles:
  1. "Reading commit history..."
  2. "Narrowing suspects..."
  3. "Deep-reading diffs..."
  4. "Building analysis..."
- Dark background, centered

### `AnalysisResult.jsx` — 5 Sections

**Section 1 — Culprit Commit Card**

Large card with:
- Top row: commit hash (`font-mono text-sm bg-gray-800 px-2 py-1 rounded`) + copy button
- Confidence badge: color based on score (green ≥70 / amber 40–69 / red <40)
  - Example: `bg-green-900 text-green-300 rounded-full px-3 py-1 text-sm`
- Author initial avatar: `w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold`
- Author name + date
- Commit message (full, not truncated)
- Link to commit on GitHub (opens new tab)

Handle `culprit_commit === null` gracefully with an "Analysis inconclusive" state.

**Section 2 — Smoking Gun**

Card with red left border (`border-l-4 border-red-500`):
- Label: "Smoking Gun"
- Content in `font-mono text-sm`
- Red/pink text color

**Section 3 — Explanation**

White-ish card (`bg-gray-800`):
- Label: "Why This Broke It"
- Plain paragraph text, `text-gray-200`, readable line-height

**Section 4 — Fix**

Dark code block:
- Label: "How to Fix It"
- `bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400`
- Pre-wrap to preserve whitespace
- Copy button top-right

Handle `fix === null` with "No specific fix identified — see explanation above."

**Section 5 — Could Have Caught With**

Card with amber left border (`border-l-4 border-amber-500`):
- Label: "Test That Would Have Caught This"
- Subtitle: "Add this to your test suite to prevent regressions"
- Code block in `font-mono text-sm text-amber-300`

**Footer actions:**
- "Scan More Commits" button — calls `onAnalyze` again with `commitCount * 2`
- "Analyze Another Bug" button — calls `onBack`
- "Start Over" button — returns to repo selector

### CommitCard.jsx (Reusable)

Smaller version of the culprit card, used in the "other suspects" section if you want to show all 3 suspects. Optional for MVP.

### Done State
- All 5 sections render with real data from `/api/analyze`
- Confidence badge is correct color
- Copy buttons work
- GitHub link opens correct commit
- "Scan More Commits" reruns with double the commit count

---

## Phase 9 — Polish & Edge Cases

**Goal:** Handle everything that can go wrong gracefully.

### Error States to Handle

| Scenario | UI Response |
|----------|-------------|
| Not authenticated (401) | Redirect to landing page |
| Analysis API fails (500) | Show error card with "Try again" button |
| Empty repo (no commits) | "This repo has no commits to analyze" |
| All diffs are binary | "Could not read diffs — all changed files are binary" |
| GitHub API rate limit hit | "GitHub API rate limit reached. Try again in an hour." |
| `culprit_commit` is null | "Analysis inconclusive" with explanation still shown |
| `fix` is null | Hide fix section gracefully |

### UX Improvements

- **Sticky header** on analysis result with repo name + "New Analysis" button
- **Keyboard shortcut:** Cmd+Enter to submit the bug input form
- **Auto-scroll** to result sections as they appear (if you add streaming later)
- **URL state:** Consider adding `?repo=owner/name` to URL so users can share links to the repo selection step
- **Responsive:** Test at 375px (iPhone), 768px (iPad), 1280px (desktop)

### Performance

- Add `loading` skeleton to repo grid (prevents layout shift)
- Debounce the "Scan More Commits" button to prevent double-clicks
- Show commit count in loading state: "Scanning 40 commits..."

### Done State
- No uncaught JavaScript errors in console
- All error states show user-friendly messages
- App works on mobile viewport
- Null/undefined fields in API response don't crash the UI

---

## Testing Checklist (Manual)

Before considering the MVP complete, verify each of these:

### Auth
- [ ] Landing page loads when not logged in
- [ ] "Login with GitHub" redirects to GitHub
- [ ] After OAuth, lands on repo selector (not landing page)
- [ ] `/api/me` returns user when logged in
- [ ] Logout clears session and returns to landing page
- [ ] Refreshing the page while logged in stays on repo selector

### Repos
- [ ] Repo list loads within 2 seconds
- [ ] Private repos are marked
- [ ] Clicking a repo advances to bug input
- [ ] Language badge shows correct language

### Analysis
- [ ] Empty error field shows validation error, doesn't submit
- [ ] Analysis with just an error message (no stack trace) works
- [ ] Analysis with stack trace improves output
- [ ] Commit count slider changes the value
- [ ] Loading state shows during analysis
- [ ] All 5 sections render when result comes back
- [ ] Confidence badge is correct color
- [ ] Copy hash button copies to clipboard
- [ ] GitHub commit link opens correct URL in new tab
- [ ] "Scan More Commits" reruns with 2x commit count
- [ ] "Analyze Another Bug" goes back to bug input
- [ ] "Start Over" goes back to repo selector

### Error Handling
- [ ] If backend is down, show error (don't hang forever)
- [ ] If analysis returns null culprit, don't crash

---

## Implementation Order Summary

```
Phase 0: Scaffold (30 min)
Phase 1: GitHub OAuth (45 min)
Phase 2: GitHub API layer (30 min)
Phase 3: Claude agent — THIS IS THE CORE (1 hour)
  → Postman test here before writing any frontend
Phase 4: React shell (20 min)
Phase 5: Landing + auth UI (45 min)
Phase 6: Repo selector (30 min)
Phase 7: Bug input form (30 min)
Phase 8: Analysis result — THIS IS THE PAYOFF (1.5 hours)
Phase 9: Polish (1 hour)
```

Total: ~7 hours of focused work for a production-quality MVP.

---

## Key Decisions & Rationale

**Why two-pass AI instead of one?**
Sending 40 full diffs to Claude at once: ~200K tokens, slow, expensive. Two-pass: Pass 1 is ~2K tokens, Pass 2 is ~20K tokens. 10x cheaper, 3x faster.

**Why express-session instead of JWT?**
No database needed. Sessions are in-memory. Simple, zero-config. The tradeoff (sessions lost on server restart) is acceptable for an MVP.

**Why Octokit instead of raw fetch?**
Octokit handles pagination, rate limit headers, and TypeScript types. For an MVP the abstraction is worth it.

**Why not stream Claude's response?**
The result is structured JSON — streaming a JSON object is complex to parse incrementally. Polling for a complete response is simpler and the two-pass approach already feels fast enough.

**Why scope=repo in OAuth?**
To read private repos. If you only need public repos, use `scope=public_repo` — but most developers want to analyze private repos too.
