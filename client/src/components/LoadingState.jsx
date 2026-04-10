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
    <div className="loading-state">
      <div className="loading-state__inner">

        <div style={{ marginBottom: '2rem' }}>
          <div className="loading-state__spinner-wrap">
            <svg
              className="animate-spin"
              style={{ width: '1.75rem', height: '1.75rem', color: 'var(--violet-600)' }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                style={{ opacity: 0.25 }}
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <h2 className="loading-state__title">Investigating commits</h2>
          {repo && <p className="loading-state__repo">{repo.full_name}</p>}
        </div>

        <div className="loading-state__steps">
          {STEPS.map((step, i) => {
            const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending';
            return (
              <div key={i} className={`loading-step loading-step--${state}`}>
                <span className="loading-step__icon">{step.icon}</span>
                <span className={`loading-step__text loading-step__text--${state}`}>
                  {step.text}
                </span>
                {i < stepIndex && (
                  <svg
                    className="loading-step__check"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {i === stepIndex && <span className="loading-step__dot" />}
              </div>
            );
          })}
        </div>

        <p className="loading-state__hint">
          Two-pass analysis — this usually takes 15–30 seconds
        </p>
      </div>
    </div>
  );
}
