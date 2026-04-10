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
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Analyzing</p>
            <p className="text-white font-medium text-sm">{repo?.full_name}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">What's the bug?</h1>
        <p className="text-gray-400 text-sm mb-8">
          Paste the error message and stack trace. Claude will find the commit that caused it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Error Message <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={error}
              onChange={(e) => { setError(e.target.value); setValidationError(''); }}
              placeholder="TypeError: Cannot read properties of undefined (reading 'map')"
              className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none transition-colors"
            />
            {validationError && (
              <p className="text-red-400 text-xs mt-1">{validationError}</p>
            )}
          </div>

          {/* Stack trace */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stack Trace{' '}
              <span className="text-gray-500 font-normal">(optional — improves accuracy)</span>
            </label>
            <textarea
              rows={6}
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              placeholder={`at processItems (src/utils.js:42:18)\n  at handleResponse (src/api.js:18:5)\n  at async fetchData (src/data.js:91:5)`}
              className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm font-mono resize-none focus:outline-none transition-colors"
            />
          </div>

          {/* Commit scan depth */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Commits to scan</label>
              <span className="text-indigo-400 font-mono text-sm font-bold">{commitCount}</span>
            </div>
            <input
              type="range"
              min={20}
              max={60}
              step={20}
              value={commitCount}
              onChange={(e) => setCommitCount(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1 px-0.5">
              {COMMIT_COUNTS.map((v) => (
                <span
                  key={v}
                  className={commitCount === v ? 'text-indigo-400 font-medium' : ''}
                >
                  {v}
                </span>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-2">
              More commits = higher chance of finding the culprit, but slightly slower.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
