import { useState } from 'react';
import CommitCard from './CommitCard';
import LoadingState from './LoadingState';

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="text-gray-500 hover:text-gray-300 text-xs transition-colors cursor-pointer"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

function Section({ title, icon, borderColor, children }) {
  return (
    <div className={`border-l-4 ${borderColor} bg-gray-900 rounded-xl p-5`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </p>
      {children}
    </div>
  );
}

export default function AnalysisResult({ result, loading, repo, onBack, onRestart, onScanMore }) {
  const [scanMoreLoading, setScanMoreLoading] = useState(false);

  if (loading) {
    return <LoadingState repo={repo} />;
  }

  // Request-level error
  if (result?.error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-gray-400 text-sm mb-6">{result.error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              ← Try Again
            </button>
            <button
              onClick={onRestart}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  const r = result?.result;

  if (!r) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <p className="text-gray-500">No result yet.</p>
      </div>
    );
  }

  const handleScanMore = async () => {
    if (scanMoreLoading) return;
    setScanMoreLoading(true);
    await onScanMore({ commitCount: (result.commits_scanned || 40) * 2 });
    setScanMoreLoading(false);
  };

  const inconclusive = !r.culprit_commit;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Sticky header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest">Result</p>
              <p className="text-white font-medium text-sm">{repo?.full_name}</p>
            </div>
          </div>
          <span className="text-gray-600 text-xs">
            {result.commits_scanned} commits scanned
          </span>
        </div>

        {/* Inconclusive state */}
        {inconclusive ? (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl mb-3">🤔</div>
            <h2 className="text-white font-bold text-lg mb-2">Analysis Inconclusive</h2>
            <p className="text-gray-400 text-sm">
              Claude couldn't pinpoint the culprit with enough confidence. Try adding a stack trace
              or scanning more commits.
            </p>
          </div>
        ) : (
          <>
            {/* Section 1 — Culprit commit */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <span>🎯</span> Culprit Commit
              </p>
              <CommitCard commit={r.culprit_commit} repoFullName={repo?.full_name} />
            </div>
          </>
        )}

        {/* Section 2 — Smoking gun */}
        {r.smoking_gun && (
          <div className="mb-4">
            <Section title="Smoking Gun" icon="🔫" borderColor="border-red-500">
              <p className="text-red-300 font-mono text-sm leading-relaxed">{r.smoking_gun}</p>
            </Section>
          </div>
        )}

        {/* Section 3 — Explanation */}
        {r.explanation && (
          <div className="mb-4">
            <Section title="Why This Broke It" icon="💡" borderColor="border-indigo-500">
              <p className="text-gray-200 text-sm leading-relaxed">{r.explanation}</p>
            </Section>
          </div>
        )}

        {/* Section 4 — Fix */}
        {r.fix && (
          <div className="mb-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <span>🔧</span> How to Fix It
                </p>
                <CopyButton text={r.fix} label="Copy fix" />
              </div>
              <pre className="bg-gray-950 rounded-lg p-4 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {r.fix}
              </pre>
            </div>
          </div>
        )}

        {/* Section 5 — Could have caught with */}
        {r.could_have_caught_with && (
          <div className="mb-8">
            <Section title="Test That Would Have Caught This" icon="🧪" borderColor="border-amber-500">
              <p className="text-gray-500 text-xs mb-3">
                Add this to your test suite to prevent regressions.
              </p>
              <div className="relative">
                <pre className="bg-gray-950 rounded-lg p-4 text-amber-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {r.could_have_caught_with}
                </pre>
                <div className="mt-2 flex justify-end">
                  <CopyButton text={r.could_have_caught_with} label="Copy test" />
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleScanMore}
            disabled={scanMoreLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {scanMoreLoading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning more...
              </>
            ) : (
              `Scan More Commits (${(result.commits_scanned || 40) * 2} commits)`
            )}
          </button>
          <button
            onClick={onBack}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Analyze Another Bug
          </button>
          <button
            onClick={onRestart}
            className="sm:w-auto bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
