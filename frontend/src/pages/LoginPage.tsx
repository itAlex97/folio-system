import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import Button from '../components/common/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!username || !password) {
      return;
    }

    const nextPath =
      ((location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname as string | undefined) ?? '/documents';

    try {
      setSubmitting(true);
      setError('');
      await login(username.trim(), password);
      navigate(nextPath, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in with provided credentials.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">Folio System</h1>
        <p className="login-subtitle">
          Sign in to continue to the engineering registry.
        </p>

        <div className="login-group">
          <label className="login-label" htmlFor="username">
            User
          </label>
          <input
            id="username"
            className="login-input"
            type="text"
            placeholder="agutierrez11"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="login-group">
          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="login-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="login-actions">
          <Button disabled={!username || !password || submitting}>
            {submitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>

        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
