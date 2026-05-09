import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import Layout from '../components/Layout.jsx';
import AuthHero from '../components/AuthHero.jsx';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      // After clicking the email link the user lands here with a recovery
      // session attached, ready to set a new password.
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
      setBusy(false);
      return;
    }
    setSent(true);
    setBusy(false);
  };

  return (
    <Layout withFooter withBottomNav={false}>
      <div className="auth-main">
        <div className="auth-card">
          <AuthHero
            title="No problem, we've got you."
            body="Reset your password and get back to your rhythm. Check your inbox for a secure link."
          />
          <div className="auth-form-pane">
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
              Enter the email tied to your DayFlow account and we'll send you a reset link.
            </p>

            {sent ? (
              <div className="auth-form">
                <div className="auth-subtitle">
                  If an account exists for <strong>{email}</strong>, a reset link is on its way.
                </div>
                <Link to="/login" className="btn btn-secondary btn-block">Back to sign in</Link>
              </div>
            ) : (
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
                {error && <div className="error-text">{error}</div>}
                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            <p className="auth-foot">
              Remembered it? <Link to="/login">Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
