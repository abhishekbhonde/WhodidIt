import { useState, useEffect } from 'react';

const LANGUAGE_COLORS = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-400',
  Python: 'bg-green-400',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-400',
  Java: 'bg-red-400',
  Ruby: 'bg-pink-400',
  PHP: 'bg-purple-400',
  'C++': 'bg-rose-400',
  C: 'bg-gray-400',
  Swift: 'bg-orange-300',
  Kotlin: 'bg-violet-400',
  Shell: 'bg-green-300',
  HTML: 'bg-orange-500',
  CSS: 'bg-blue-300',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-800 rounded w-1/4" />
    </div>
  );
}

export default function RepoSelector({ user, onSelect, onLogout }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/repos', { credentials: 'include' })
      .then((r) => r.json())
      .then(({ repos, error }) => {
        if (error) setError(error);
        else setRepos(repos || []);
      })
      .catch(() => setError('Failed to load repositories.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.login?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user?.login}</p>
              <p className="text-gray-500 text-xs">Select a repository to analyze</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">Your Repositories</h1>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="col-span-2 text-center py-12 text-gray-500">
                {search ? 'No repositories match your search.' : 'No repositories found.'}
              </div>
            )
            : filtered.map((repo) => (
              <button
                key={repo.id}
                onClick={() => onSelect(repo)}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-xl p-4 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors truncate">
                    {repo.name}
                  </span>
                  {repo.private && (
                    <span className="shrink-0 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                      Private
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mb-3 truncate">{repo.full_name}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {repo.language && (
                      <>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            LANGUAGE_COLORS[repo.language] || 'bg-gray-500'
                          }`}
                        />
                        <span className="text-gray-400 text-xs">{repo.language}</span>
                      </>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs">{timeAgo(repo.updated_at)}</span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
