# WhoDidIt — Find the Commit That Broke Everything

> Paste a bug. Point at a repo. Claude finds the exact commit that caused it.

---

## What It Does

WhoDidIt is a developer tool that automates the most painful part of debugging: figuring out *which commit introduced a bug*. Instead of manually running `git bisect` or scrolling through history, you paste the error message and stack trace, select your GitHub repo, and let Claude do the investigation.

The AI uses a two-pass strategy:
1. **Pass 1** — Reads commit messages and metadata to narrow down 3 suspects
2. **Pass 2** — Deep-reads the full diffs of those 3 commits and pinpoints the exact line

Output includes:
- The culprit commit (hash, author, date, confidence score)
- The smoking gun (exact file and line that broke things)
- Plain-English explanation of why it caused the bug
- A code fix snippet
- The test case that would have caught it before shipping

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| Auth | GitHub OAuth 2.0 |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| GitHub Data | GitHub REST API via Octokit |
| Sessions | express-session (in-memory, no DB) |

---

## Project Structure

```
/WhodidIt
  /client                    ← React frontend (Vite)
    /src
      /components
        LandingPage.jsx      ← Hero page with GitHub login
        RepoSelector.jsx     ← Grid of user's repos to pick from
        BugInput.jsx         ← Error + stack trace form
        AnalysisResult.jsx   ← Full result with all 5 sections
        CommitCard.jsx       ← Reusable commit display card
        LoadingState.jsx     ← Animated loading during analysis
      /context
        AuthContext.jsx      ← Global auth state
      App.jsx                ← Step router (landing→repo→input→result)
      main.jsx               ← React entry point
    index.html
    vite.config.js
  /server                    ← Node.js backend
    auth.js                  ← GitHub OAuth token exchange + user fetch
    github.js                ← All Octokit API calls
    agent.js                 ← Two-pass Claude analysis logic
    index.js                 ← Express routes + session middleware
  .env                       ← Secrets (never commit this)
  package.json               ← Server dependencies
  PRD.md                     ← This implementation guide
  README.md                  ← You are here
```

---

## Prerequisites

- Node.js 18+
- A GitHub account
- An Anthropic API key (get one at console.anthropic.com)
- A GitHub OAuth App (instructions below)

---

## GitHub OAuth App Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: WhoDidIt (or anything)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**
6. Paste both into your `.env` file

---

## Environment Variables

Create a `.env` file in the project root:

```env
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
ANTHROPIC_API_KEY=your_anthropic_key
SESSION_SECRET=any_random_string_at_least_32_chars
CLIENT_URL=http://localhost:5173
PORT=3001
```

**Never commit `.env` to git.** It's in `.gitignore`.

---

## Installation & Running

### Backend

```bash
# From project root
npm install
node server/index.js
# Server runs at http://localhost:3001
```

### Frontend

```bash
cd client
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## API Reference

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/auth/github` | Redirects to GitHub OAuth |
| GET | `/auth/github/callback` | GitHub redirects back here with code |
| GET | `/api/me` | Returns current logged-in user or `{user: null}` |
| POST | `/api/logout` | Destroys session |

### Core

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/repos` | Lists user's GitHub repos (sorted by last updated) |
| POST | `/api/analyze` | Runs two-pass Claude analysis |

#### POST `/api/analyze` — Request Body

```json
{
  "owner": "torvalds",
  "repo": "linux",
  "error": "TypeError: Cannot read property 'map' of undefined",
  "stackTrace": "at processItems (utils.js:42)\n  at main (index.js:18)",
  "commitCount": 40
}
```

#### POST `/api/analyze` — Response

```json
{
  "commits_scanned": 40,
  "result": {
    "culprit_commit": {
      "hash": "a1b2c3d4e5f6...",
      "short_hash": "a1b2c3d",
      "message": "refactor: simplify data fetching in processItems",
      "author": "Jane Dev",
      "date": "2024-01-15T10:30:00Z",
      "confidence": 87
    },
    "smoking_gun": "utils.js line 38 — changed `data.items` to `data` but the caller still passes the full response object",
    "explanation": "The refactor assumed the caller would unwrap `.items` before passing data in, but App.jsx still passes the raw API response. This makes `data` an object with no `.map()` method.",
    "fix": "// Before (broken)\nfunction processItems(data) {\n  return data.map(...);\n}\n\n// After (fixed)\nfunction processItems(data) {\n  return (data.items || data).map(...);\n}",
    "could_have_caught_with": "test('processItems handles raw API response', () => {\n  const rawResponse = { items: [1, 2, 3], total: 3 };\n  expect(() => processItems(rawResponse)).not.toThrow();\n});"
  }
}
```

---

## How the AI Analysis Works

```
User provides: error message + stack trace
        ↓
Fetch last N commits (metadata only — no diffs yet)
        ↓
PASS 1 — Claude reads commit messages
  → "Which 3 of these 40 commits are most suspicious?"
  → Returns: ["hash1", "hash2", "hash3"]
        ↓
Fetch full diffs for only those 3 commits
  → Truncated to 2000 chars/file, max 10 files/commit
        ↓
PASS 2 — Claude reads actual code changes
  → "Find the exact line that caused this bug"
  → Returns: full analysis JSON
        ↓
Frontend renders result with 5 sections
```

This two-pass design keeps costs low and responses fast. Sending 40 full diffs at once would be slow and expensive — this approach uses ~10x less tokens.

---

## User Flow

```
Landing Page (not logged in)
  → "Login with GitHub" button
  → GitHub OAuth consent screen
  → Callback → session created
  → Repo Selector (grid of your repos)
  → Click a repo
  → Bug Input form
    → Paste error message (required)
    → Paste stack trace (optional but improves accuracy)
    → Set commit scan depth (20 / 40 / 60)
    → Click "Find the Culprit"
  → Loading state (animated, shows what's happening)
  → Analysis Result
    → Culprit card (hash + confidence badge)
    → Smoking gun (exact file/line)
    → Explanation (plain English)
    → Fix (code snippet)
    → Could have caught with (test case)
    → "Scan More Commits" button (reruns with 2x count)
```

---

## Confidence Score Guide

| Score | Color | Meaning |
|-------|-------|---------|
| 70–100 | Green | High confidence — commit almost certainly the cause |
| 40–69 | Amber | Moderate — strong suspect but verify manually |
| 1–39 | Red | Low — Claude needs more context (try adding stack trace or scanning more commits) |

---

## Limitations (MVP)

- Scans up to 80 commits (GitHub API cap per request is 100, but we stop at 80 for latency)
- Diff truncated at 2000 chars per file — very large diffs may lose context
- Binary file changes are skipped (no patch available)
- Rate limit: 5000 GitHub API requests/hour per authenticated user — more than enough for normal use
- No persistence — sessions are in-memory, server restart logs everyone out
- No support for private repos belonging to orgs the user doesn't own (GitHub OAuth scope `repo` covers user-owned private repos)

---

