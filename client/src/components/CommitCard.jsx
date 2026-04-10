import { useState } from 'react';

function confidenceBadgeClass(score) {
  if (score >= 70) return 'commit-card__badge commit-card__badge--high';
  if (score >= 40) return 'commit-card__badge commit-card__badge--mid';
  return 'commit-card__badge commit-card__badge--low';
}

function confidenceLabel(score) {
  if (score >= 70) return 'High confidence';
  if (score >= 40) return 'Moderate';
  return 'Low confidence';
}

export default function CommitCard({ commit, repoFullName }) {
  const [copied, setCopied] = useState(false);

  if (!commit) return null;

  const commitUrl = `https://github.com/${repoFullName}/commit/${commit.hash}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(commit.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="commit-card">
      <div className="commit-card__top">
        {/* Author */}
        <div className="commit-card__author-row">
          <div className="commit-card__avatar">
            {commit.author?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="commit-card__author">{commit.author}</p>
            <p className="commit-card__date">
              {new Date(commit.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Confidence badge */}
        {commit.confidence != null && (
          <span className={confidenceBadgeClass(commit.confidence)}>
            {confidenceLabel(commit.confidence)} · {commit.confidence}%
          </span>
        )}
      </div>

      {/* Commit message */}
      <p className="commit-card__message">{commit.message}</p>

      {/* Hash row */}
      <div className="commit-card__hash-row">
        <code className="commit-card__hash">
          {commit.short_hash || commit.hash?.substring(0, 7)}
        </code>
        <button onClick={handleCopy} className="commit-card__copy">
          {copied ? '✓ Copied' : 'Copy hash'}
        </button>
        <a
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="commit-card__view-link"
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
}
