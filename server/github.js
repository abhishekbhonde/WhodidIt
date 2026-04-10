const { Octokit } = require('@octokit/rest');

function getClient(token) {
  return new Octokit({ auth: token });
}

async function getUserRepos(token) {
  const octokit = getClient(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 30,
    type: 'all',
  });
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    private: r.private,
    language: r.language,
    updated_at: r.updated_at,
  }));
}

async function getRecentCommits(token, owner, repo, count = 40) {
  const octokit = getClient(token);
  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: count,
  });
  return data.map((c) => ({
    hash: c.sha,
    short_hash: c.sha.substring(0, 7),
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
    url: c.html_url,
  }));
}

async function getCommitDiff(token, owner, repo, sha) {
  const octokit = getClient(token);
  const { data } = await octokit.repos.getCommit({ owner, repo, ref: sha });
  const files = (data.files || []).slice(0, 10).map((f) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch ? f.patch.substring(0, 2000) : null,
  }));
  return {
    hash: data.sha,
    message: data.commit.message,
    author: data.commit.author.name,
    date: data.commit.author.date,
    files,
  };
}

module.exports = { getUserRepos, getRecentCommits, getCommitDiff };
