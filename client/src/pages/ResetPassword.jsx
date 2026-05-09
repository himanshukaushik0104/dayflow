import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../hooks/useAuth.jsx';
import Layout from '../components/Layout.jsx';
import AuthHero from '../components/AuthHero.jsx';
import './Auth.css';

// Landed here from the password-reset email link. Supabase has set up a
// recovery session via detectSessionInUrl. We just need a new password.
export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // If the user navigates here without a session, the link probably
  // expired or wasn't clicked. Send them back to /forgot-password.
  useEffect(() => {
    if (!loading && !session) {
      const t = setTimeout(() => navigate('/forgot-password', { replace: true }), 50);
      return () => clearTimeout(t);
    }
  }, [loading, session, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  };

  return (
    <Layout withFooter withBottomNav={false}>
      <div className="auth-main">
        <div className="auth-card">
          <AuthHero
            title="One last step."
            body="Pick a fresh password and you'll be back in DayFlow in seconds."
          />
          <div className="auth-form-pane">
            <h1 className="auth-title">Set a new password</h1>
            <p className="auth-subtitle">Choose something memorable but secure.</p>

            {done ? (
              <div className="auth-form">
                <div className="auth-subtitle">Password updated. You can now sign in.</div>
                <Link to="/login" className="btn btn-primary btn-block">Sign in</Link>
              </div>
            ) : (
              <form className="auth-form" onSubmit={onSubmit}>
                <label className="field">
                  <span className="field-label">New password</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Confirm new password</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
                {error && <div className="error-text">{error}</div>}
                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
