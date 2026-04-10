import { useState } from 'react';

const COMMIT_COUNTS = [20, 40, 60];

export default function BugInput({ repo, onAnalyze, onBack }) {
  const [error, setError] = useState('');
  const [stackTrace, setStackTrace] = useState('');
  const [commitCount, setCommitCount] = useState(40);
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!error.trim()) {
      setValidationError('Error message is required.');
      return;
    }
    setValidationError('');
    setLoading(true);
    await onAnalyze({ error: error.trim(), stackTrace: stackTrace.trim(), commitCount });
    setLoading(false);
  };

  return (
    <div className="bug-input">
      <div className="bug-input__inner">

        {/* Header */}
        <div className="bug-input__header">
          <button onClick={onBack} className="bug-input__back">
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="bug-input__header-label">Analyzing</p>
            <p className="bug-input__header-repo">{repo?.full_name}</p>
          </div>
        </div>

        <h1 className="bug-input__title">What's the bug?</h1>
        <p className="bug-input__subtitle">
          Paste the error message and stack trace. Claude will find the commit that caused it.
        </p>

        <form onSubmit={handleSubmit} className="bug-input__form">

          {/* Error message */}
          <div>
            <label className="bug-input__label">
              Error Message <span className="bug-input__required">*</span>
            </label>
            <textarea
              rows={3}
              value={error}
              onChange={(e) => { setError(e.target.value); setValidationError(''); }}
              placeholder="TypeError: Cannot read properties of undefined (reading 'map')"
              className="bug-input__textarea"
            />
            {validationError && (
              <p className="bug-input__validation">{validationError}</p>
            )}
          </div>

          {/* Stack trace */}
          <div>
            <label className="bug-input__label">
              Stack Trace{' '}
              <span className="bug-input__optional">(optional — improves accuracy)</span>
            </label>
            <textarea
              rows={6}
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              placeholder={`at processItems (src/utils.js:42:18)\n  at handleResponse (src/api.js:18:5)\n  at async fetchData (src/data.js:91:5)`}
              className="bug-input__textarea bug-input__textarea--mono"
            />
          </div>

          {/* Commit scan depth */}
          <div>
            <div className="bug-input__range-header">
              <label className="bug-input__range-label">Commits to scan</label>
              <span className="bug-input__range-value">{commitCount}</span>
            </div>
            <input
              type="range"
              min={20}
              max={60}
              step={20}
              value={commitCount}
              onChange={(e) => setCommitCount(Number(e.target.value))}
              className="bug-input__range"
            />
            <div className="bug-input__range-ticks">
              {COMMIT_COUNTS.map((v) => (
                <span
                  key={v}
                  className={commitCount === v ? 'bug-input__range-tick--active' : ''}
                >
                  {v}
                </span>
              ))}
            </div>
            <p className="bug-input__range-hint">
              More commits = higher chance of finding the culprit, but slightly slower.
            </p>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-analyze">
            {loading ? (
              <>
                <svg className="animate-spin" style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              'Find the Culprit →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
