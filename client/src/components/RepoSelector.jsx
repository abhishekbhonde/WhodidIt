import { useState, useEffect } from 'react';

const LANGUAGE_COLORS = {
  JavaScript: '#FBBF24',
  TypeScript: '#60A5FA',
  Python:     '#4ADE80',
  Go:         '#22D3EE',
  Rust:       '#FB923C',
  Java:       '#F87171',
  Ruby:       '#F472B6',
  PHP:        '#C084FC',
  'C++':      '#FB7185',
  C:          '#A8A29E',
  Swift:      '#FCA5A5',
  Kotlin:     '#A78BFA',
  Shell:      '#86EFAC',
  HTML:       '#F97316',
  CSS:        '#38BDF8',
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
    <div className="skeleton-card">
      <div className="skeleton-line skeleton-line--lg" />
      <div className="skeleton-line skeleton-line--md" />
      <div className="skeleton-line skeleton-line--sm" />
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
    <div className="repo-selector">
      <div className="repo-selector__inner">

        {/* Header */}
        <div className="repo-selector__header">
          <div className="repo-selector__user">
            <div className="repo-selector__avatar">
              {user?.login?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="repo-selector__username">{user?.login}</p>
              <p className="repo-selector__user-sub">Select a repository to analyze</p>
            </div>
          </div>
          <button onClick={onLogout} className="repo-selector__logout">
            Logout
          </button>
        </div>

        <h1 className="repo-selector__title">Your Repositories</h1>

        {/* Search */}
        <div className="repo-selector__search-wrap">
          <svg
            className="repo-selector__search-icon"
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
            className="repo-selector__search"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="repo-selector__error">{error}</div>
        )}

        {/* Grid */}
        <div className="repo-selector__grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="repo-selector__empty">
                {search ? 'No repositories match your search.' : 'No repositories found.'}
              </div>
            )
            : filtered.map((repo) => (
              <button
                key={repo.id}
                onClick={() => onSelect(repo)}
                className="repo-card"
              >
                <div className="repo-card__name-row">
                  <span className="repo-card__name">{repo.name}</span>
                  {repo.private && (
                    <span className="repo-card__private">Private</span>
                  )}
                </div>
                <p className="repo-card__full-name">{repo.full_name}</p>
                <div className="repo-card__meta">
                  <div className="repo-card__lang">
                    {repo.language && (
                      <>
                        <span
                          className="repo-card__lang-dot"
                          style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#A8A29E' }}
                        />
                        <span className="repo-card__lang-name">{repo.language}</span>
                      </>
                    )}
                  </div>
                  <span className="repo-card__time">{timeAgo(repo.updated_at)}</span>
                </div>
              </button>
            ))}
        </div>

      </div>
    </div>
  );
}
