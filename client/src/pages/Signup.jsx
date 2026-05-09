import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { apiPost } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import Layout from '../components/Layout.jsx';
import AuthHero from '../components/AuthHero.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import './Auth.css';

export default function Signup() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/app', { replace: true });
  }, [loading, session, navigate]);

  if (loading) return null;
  if (session) return <Navigate to="/app" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    if (data.session) {
      apiPost('/api/auth/log', { event: 'signup' }).catch(() => {});
      navigate('/app', { replace: true });
    } else {
      setInfo('Check your email to confirm your account, then sign in.');
      setBusy(false);
    }
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
          <AuthHero
            title="Begin with intention."
            body="Build a calmer rhythm for your day. Track routines, capture quick tasks, and celebrate small wins."
          />
          <div className="auth-form-pane">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">A calmer way to run your day.</p>

            <form className="auth-form" onSubmit={onSubmit}>
              <label className="field">
                <span className="field-label">Display name</span>
                <input
                  className="input"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>

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

              <label className="field">
                <span className="field-label">Password</span>
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {error && <div className="error-text">{error}</div>}
              {info && <div className="auth-subtitle">{info}</div>}

              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="auth-divider">Or continue with</div>

            <GoogleButton onClick={onGoogle} disabled={busy} label="Sign up with Google" />

            <p className="auth-foot">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
