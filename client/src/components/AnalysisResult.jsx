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
    <button onClick={handle} className="copy-btn">
      {copied ? '✓ Copied' : label}
    </button>
  );
}

function Section({ title, icon, colorClass, children }) {
  return (
    <div className={`section-card ${colorClass}`}>
      <p className="section-card__header">
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

  if (result?.error) {
    return (
      <div className="result-error">
        <div className="result-error__inner">
          <span className="result-error__icon">⚠️</span>
          <h2 className="result-error__title">Analysis Failed</h2>
          <p className="result-error__msg">{result.error}</p>
          <div className="result-error__actions">
            <button onClick={onBack} className="btn btn--stone">
              ← Try Again
            </button>
            <button onClick={onRestart} className="btn btn--stone">
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
      <div className="result-error">
        <p style={{ color: 'var(--stone-400)' }}>No result yet.</p>
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
    <div className="analysis-result">
      <div className="analysis-result__inner">

        {/* Header */}
        <div className="analysis-result__header">
          <div className="analysis-result__back-group">
            <button onClick={onBack} className="analysis-result__back">
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="analysis-result__header-label">Result</p>
              <p className="analysis-result__header-repo">{repo?.full_name}</p>
            </div>
          </div>
          <span className="analysis-result__scanned">
            {result.commits_scanned} commits scanned
          </span>
        </div>

        {/* Inconclusive state */}
        {inconclusive ? (
          <div className="result-inconclusive">
            <span className="result-inconclusive__icon">🤔</span>
            <h2 className="result-inconclusive__title">Analysis Inconclusive</h2>
            <p className="result-inconclusive__text">
              Claude couldn't pinpoint the culprit with enough confidence. Try adding a stack trace
              or scanning more commits.
            </p>
          </div>
        ) : (
          <div className="result-section">
            <p className="section-label"><span>🎯</span> Culprit Commit</p>
            <CommitCard commit={r.culprit_commit} repoFullName={repo?.full_name} />
          </div>
        )}

        {/* Smoking gun */}
        {r.smoking_gun && (
          <div className="result-section">
            <Section title="Smoking Gun" icon="🔫" colorClass="section-card--red">
              <pre className="code-block code-block--red">{r.smoking_gun}</pre>
            </Section>
          </div>
        )}

        {/* Explanation */}
        {r.explanation && (
          <div className="result-section">
            <Section title="Why This Broke It" icon="💡" colorClass="section-card--violet">
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--stone-700)' }}>
                {r.explanation}
              </p>
            </Section>
          </div>
        )}

        {/* Fix */}
        {r.fix && (
          <div className="result-section">
            <div className="section-card" style={{ borderLeft: '4px solid var(--stone-200)' }}>
              <div className="section-card__header-row">
                <p className="section-card__header">
                  <span>🔧</span> How to Fix It
                </p>
                <CopyButton text={r.fix} label="Copy fix" />
              </div>
              <pre className="code-block code-block--green">{r.fix}</pre>
            </div>
          </div>
        )}

        {/* Could have caught with */}
        {r.could_have_caught_with && (
          <div className="result-section" style={{ marginBottom: '2rem' }}>
            <Section title="Test That Would Have Caught This" icon="🧪" colorClass="section-card--amber">
              <p className="section-card__hint">
                Add this to your test suite to prevent regressions.
              </p>
              <pre className="code-block code-block--amber">{r.could_have_caught_with}</pre>
              <div className="section-card__copy-wrap">
                <CopyButton text={r.could_have_caught_with} label="Copy test" />
              </div>
            </Section>
          </div>
        )}

        {/* Footer actions */}
        <div className="result-footer">
          <button
            onClick={handleScanMore}
            disabled={scanMoreLoading}
            className="btn btn--violet"
          >
            {scanMoreLoading ? (
              <>
                <svg className="animate-spin" style={{ width: '0.875rem', height: '0.875rem' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning more...
              </>
            ) : (
              `Scan More Commits (${(result.commits_scanned || 40) * 2} commits)`
            )}
          </button>
          <button onClick={onBack} className="btn btn--stone">
            Analyze Another Bug
          </button>
          <button onClick={onRestart} className="btn btn--stone-muted" style={{ flex: 'none', padding: '0.625rem 1rem' }}>
            Start Over
          </button>
        </div>

      </div>
    </div>
  );
}
