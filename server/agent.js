const Groq = require('groq-sdk');
const { getCommitDiff } = require('./github');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function findCulpritCommit({ error, stackTrace, commits, token, owner, repo }) {

  // Pass 1 — narrow down suspects from commit messages + metadata
  const pass1Response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `You are a senior debugger. A developer has this bug:

ERROR: ${error}
STACK TRACE: ${stackTrace || 'Not provided'}

Here are the recent commits (message and metadata only):
${commits.map((c, i) => `${i + 1}. [${c.short_hash}] ${c.date} — ${c.author}: ${c.message}`).join('\n')}

Based on the error and commit messages, which 3 commits are most likely to have introduced this bug?
Return ONLY valid JSON — no markdown, no explanation outside JSON:
{
  "suspects": ["<hash1>", "<hash2>", "<hash3>"],
  "reasoning": "<one sentence why these are suspicious>"
}`,
      },
    ],
  });

  let suspects = [];
  try {
    const text = pass1Response.choices[0].message.content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    suspects = parsed.suspects || [];
  } catch (e) {
    suspects = commits.slice(0, 3).map((c) => c.hash);
  }

  // Pass 2 — deep read diffs of top suspects
  const diffs = await Promise.all(
    suspects.slice(0, 3).map((hash) =>
      getCommitDiff(token, owner, repo, hash).catch(() => null)
    )
  );

  const validDiffs = diffs.filter(Boolean);

  const pass2Response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `You are a senior debugger. A developer has this bug:

ERROR: ${error}
STACK TRACE: ${stackTrace || 'Not provided'}

Here are the full diffs of the most suspicious commits:

${validDiffs
  .map(
    (d) => `
COMMIT: ${d.hash.substring(0, 7)} — "${d.message}" by ${d.author} on ${d.date}
FILES CHANGED:
${d.files
  .map(
    (f) => `
  File: ${f.filename} (${f.additions} additions, ${f.deletions} deletions)
  Patch:
  ${f.patch || 'Binary or no diff available'}
`
  )
  .join('\n')}
`
  )
  .join('\n---\n')}

Find the exact commit and line that caused this bug.
Return ONLY valid JSON — no markdown, no explanation outside JSON:
{
  "culprit_commit": {
    "hash": "<full hash>",
    "short_hash": "<7 char hash>",
    "message": "<commit message>",
    "author": "<author name>",
    "date": "<date>",
    "confidence": <integer 1-100>
  },
  "smoking_gun": "<the exact file and line change that caused the bug>",
  "explanation": "<plain English: why this specific change caused this specific error>",
  "fix": "<code snippet showing exactly what to change to fix it>",
  "could_have_caught_with": "<the exact test case that would have caught this before shipping>"
}
If you cannot determine the culprit with confidence above 40, set confidence below 40 and explain in smoking_gun what additional information would help.`,
      },
    ],
  });

  try {
    const text = pass2Response.choices[0].message.content.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return {
      culprit_commit: null,
      smoking_gun: 'Could not parse agent response.',
      explanation: 'Analysis failed. Try providing a more detailed stack trace.',
      fix: null,
      could_have_caught_with: null,
    };
  }
}

module.exports = { findCulpritCommit };
