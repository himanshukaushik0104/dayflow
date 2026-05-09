import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { apiPost } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import Layout from '../components/Layout.jsx';
import AuthHero from '../components/AuthHero.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import './Auth.css';

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate(redirectTo, { replace: true });
  }, [loading, session, navigate, redirectTo]);

  if (loading) return null;
  if (session) return <Navigate to={redirectTo} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }
    apiPost('/api/auth/log', { event: 'login' }).catch(() => {});
    navigate(redirectTo, { replace: true });
  };

  const onGoogle = async () => {
    setError(null);
    setBusy(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  };

  return (
    <Layout withFooter withBottomNav={false}>
      <div className="auth-main">
        <div className="auth-card">
          <AuthHero />
          <div className="auth-form-pane">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to continue your journey.</p>

            <form className="auth-form" onSubmit={onSubmit}>
              <label className="field">
                <span className="field-label">Email address</span>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <div className="field">
                <div className="auth-row-spread">
                  <span className="field-label">Password</span>
                  <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                </div>
                <input
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <div className="error-text">{error}</div>}

              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="auth-divider">Or continue with</div>

            <GoogleButton onClick={onGoogle} disabled={busy} />

            <p className="auth-foot">
              New to DayFlow? <Link to="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
