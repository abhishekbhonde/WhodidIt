import { useState } from 'react';

function confidenceBadge(score) {
  if (score >= 70) return 'bg-green-900/50 text-green-300 border border-green-700/50';
  if (score >= 40) return 'bg-amber-900/50 text-amber-300 border border-amber-700/50';
  return 'bg-red-900/50 text-red-300 border border-red-700/50';
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Left: avatar + author */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {commit.author?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{commit.author}</p>
            <p className="text-gray-500 text-xs">
              {new Date(commit.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Right: confidence badge */}
        {commit.confidence != null && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${confidenceBadge(
              commit.confidence
            )}`}
          >
            {confidenceLabel(commit.confidence)} · {commit.confidence}%
          </span>
        )}
      </div>

      {/* Commit message */}
      <p className="text-white text-sm font-medium mb-4 leading-relaxed">{commit.message}</p>

      {/* Hash row */}
      <div className="flex items-center gap-2">
        <code className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded font-mono">
          {commit.short_hash || commit.hash?.substring(0, 7)}
        </code>
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-gray-300 transition-colors text-xs cursor-pointer"
        >
          {copied ? '✓ Copied' : 'Copy hash'}
        </button>
        <a
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
}
