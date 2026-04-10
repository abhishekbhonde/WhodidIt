import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import RepoSelector from './components/RepoSelector';
import BugInput from './components/BugInput';
import AnalysisResult from './components/AnalysisResult';

export default function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('landing'); // landing | repo | input | result
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastInputs, setLastInputs] = useState(null);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setUser(user);
          setStep('repo');
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
  };

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    setStep('input');
  };

  const handleAnalyze = async ({ error, stackTrace, commitCount }) => {
    setLastInputs({ error, stackTrace, commitCount });
    setLoading(true);
    setResult(null);
    setStep('result');
    const [owner, repo] = selectedRepo.full_name.split('/');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, error, stackTrace, commitCount }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: 'Request failed. Is the server running?' });
    }
    setLoading(false);
  };

  const handleScanMore = ({ commitCount }) => {
    if (!lastInputs) return;
    handleAnalyze({
      error: lastInputs.error,
      stackTrace: lastInputs.stackTrace,
      commitCount,
    });
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setStep('landing');
    setSelectedRepo(null);
    setResult(null);
    setLastInputs(null);
  };

  return (
    <div className="app">
      {step === 'landing' && <LandingPage onLogin={handleLogin} />}
      {step === 'repo' && (
        <RepoSelector user={user} onSelect={handleRepoSelect} onLogout={handleLogout} />
      )}
      {step === 'input' && (
        <BugInput repo={selectedRepo} onAnalyze={handleAnalyze} onBack={() => setStep('repo')} />
      )}
      {step === 'result' && (
        <AnalysisResult
          result={result}
          loading={loading}
          repo={selectedRepo}
          onBack={() => setStep('input')}
          onRestart={() => setStep('repo')}
          onScanMore={handleScanMore}
        />
      )}
    </div>
  );
}
