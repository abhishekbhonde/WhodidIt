import { useState, useEffect } from 'react';

const STEPS = [
  { icon: '📦', text: 'Fetching commit history...' },
  { icon: '🔍', text: 'Narrowing suspects with Claude...' },
  { icon: '🧬', text: 'Deep-reading diffs...' },
  { icon: '🧠', text: 'Building analysis...' },
];

export default function LoadingState({ repo }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <svg
              className="animate-spin w-7 h-7 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-1">Investigating commits</h2>
          {repo && (
            <p className="text-gray-500 text-sm">{repo.full_name}</p>
          )}
        </div>

        <div className="space-y-2">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 ${
                i < stepIndex
                  ? 'bg-green-900/20 border border-green-800/30'
                  : i === stepIndex
                  ? 'bg-indigo-900/30 border border-indigo-700/40'
                  : 'bg-gray-900/30 border border-gray-800/30'
              }`}
            >
              <span className="text-base">{step.icon}</span>
              <span
                className={`text-sm ${
                  i < stepIndex
                    ? 'text-green-400'
                    : i === stepIndex
                    ? 'text-indigo-300 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {step.text}
              </span>
              {i < stepIndex && (
                <svg
                  className="ml-auto w-4 h-4 text-green-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {i === stepIndex && (
                <span className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shrink-0" />
              )}
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs mt-6">
          Two-pass analysis — this usually takes 15–30 seconds
        </p>
      </div>
    </div>
  );
}
