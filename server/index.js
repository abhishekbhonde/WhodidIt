const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { getAccessToken, getGitHubUser } = require('./auth');
const { getUserRepos, getRecentCommits } = require('./github');
const { findCulpritCommit } = require('./agent');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// GitHub OAuth — redirect to GitHub
app.get('/auth/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
  res.redirect(url);
});

// GitHub OAuth — callback
app.get('/auth/github/callback', async (req, res) => {
  try {
    const token = await getAccessToken(req.query.code);
    const user = await getGitHubUser(token);
    req.session.token = token;
    req.session.user = user;
    res.redirect(`${process.env.CLIENT_URL}?auth=success`);
  } catch (e) {
    console.error('OAuth callback error:', e.message);
    res.redirect(`${process.env.CLIENT_URL}?auth=error`);
  }
});

// Get current user
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// Get user repos
app.get('/api/repos', async (req, res) => {
  if (!req.session.token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const repos = await getUserRepos(req.session.token);
    res.json({ repos });
  } catch (e) {
    console.error('Repos error:', e.message);
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  if (!req.session.token) return res.status(401).json({ error: 'Not authenticated' });

  const { owner, repo, error, stackTrace, commitCount = 40 } = req.body;
  if (!owner || !repo || !error) {
    return res.status(400).json({ error: 'owner, repo, and error are required' });
  }

  try {
    const commits = await getRecentCommits(req.session.token, owner, repo, commitCount);
    const result = await findCulpritCommit({
      error,
      stackTrace,
      commits,
      token: req.session.token,
      owner,
      repo,
    });
    res.json({ result, commits_scanned: commits.length });
  } catch (e) {
    console.error('Analysis error:', e.message);
    res.status(500).json({ error: 'Analysis failed', details: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
