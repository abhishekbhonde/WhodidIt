export default function LandingPage({ onLogin }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-6">
          Powered by Claude AI
        </p>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Find the commit that<br />broke everything.
        </h1>
        <p className="text-gray-400 text-lg mb-10">
          Paste a bug. Point at a repo. Get the exact commit, line, and fix in seconds.
        </p>

        <button
          onClick={onLogin}
          className="inline-flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-base cursor-pointer"
        >
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Login with GitHub →
        </button>

        <div className="mt-12 grid grid-cols-1 gap-4 text-left">
          {[
            {
              icon: '🔍',
              text: 'Two-pass AI analysis — narrows 40 commits to 3, then deep-reads diffs',
            },
            {
              icon: '📊',
              text: 'Confidence scoring — know exactly how sure the AI is',
            },
            {
              icon: '🔧',
              text: 'Built-in fix — get the code change, not just the diagnosis',
            },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-3 bg-gray-900 rounded-lg px-4 py-3"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-gray-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
