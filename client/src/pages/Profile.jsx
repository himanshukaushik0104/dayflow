import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TimezoneSelect from 'react-timezone-select';
import { supabase } from '../lib/supabase.js';
import { apiGet, apiPut } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import Layout from '../components/Layout.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import AvatarUpload from '../components/AvatarUpload.jsx';
import Icon from '../components/Icon.jsx';
import './Profile.css';

function isGoogleUser(user) {
  if (!user) return false;
  const providers = user.app_metadata?.providers || [];
  if (Array.isArray(providers) && providers.includes('google')) return true;
  return user.app_metadata?.provider === 'google';
}

const tzStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    height: 36,
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
    borderWidth: '0.5px',
    borderRadius: 8,
    boxShadow: state.isFocused ? '0 0 0 3px var(--color-primary-fixed)' : 'none',
    ':hover': { borderColor: 'var(--color-border)' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 10px' }),
  input: (base) => ({ ...base, color: 'var(--color-text)', margin: 0, padding: 0 }),
  singleValue: (base) => ({ ...base, color: 'var(--color-text)' }),
  placeholder: (base) => ({ ...base, color: 'var(--color-text-muted)' }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--color-surface)',
    border: '0.5px solid var(--color-border)',
    boxShadow: 'var(--shadow-pop)',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'var(--color-primary-fixed)'
      : state.isFocused
        ? 'var(--color-surface-container-low)'
        : 'transparent',
    color: state.isSelected ? 'var(--color-on-primary-fixed-variant)' : 'var(--color-text)',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: 'var(--color-text-muted)' }),
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const oauthOnly = useMemo(() => isGoogleUser(user), [user]);

  useEffect(() => {
    let mounted = true;
    apiGet('/api/profile')
      .then((p) => {
        if (!mounted) return;
        setProfile(p);
        setDisplayName(p.display_name ?? '');
        setTimezone(p.timezone ?? 'UTC');
      })
      .catch((err) => toast.error(err.message || 'Could not load profile'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [toast]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiPut('/api/profile', {
        display_name: displayName.trim(),
        timezone,
      });
      setProfile((prev) => ({ ...prev, ...updated }));
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarUploaded = (avatar_url) => {
    setProfile((prev) => ({ ...prev, avatar_url }));
    toast.success('Avatar updated');
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) return toast.error('New password must be at least 6 characters.');
    if (newPwd !== confirmPwd) return toast.error('Passwords do not match.');
    setPwdSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPwd,
      });
      if (signInError) throw new Error('Current password is incorrect.');
      const { error: updateError } = await supabase.auth.updateUser({ password: newPwd });
      if (updateError) throw updateError;
      toast.success('Password changed');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      toast.error(err.message || 'Could not change password');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <Layout profile={profile}>
      <div className="profile">
        {loading ? (
          <div className="profile__placeholder">Loading…</div>
        ) : (
          <>
            <section className="profile-hero">
              <AvatarUpload
                url={profile?.avatar_url}
                name={profile?.display_name}
                onUploaded={onAvatarUploaded}
                onError={(message) => toast.error(message)}
              />
              <div className="profile-hero__text">
                <h1 className="profile-hero__name">
                  {profile?.display_name || 'Welcome'}
                </h1>
                <p className="profile-hero__email">{user?.email}</p>
              </div>
            </section>

            <div className="profile-grid">
              <section className="profile-section">
                <header className="profile-section__head">
                  <Icon name="account_circle" size={20} className="profile-section__icon" />
                  <h2 className="profile-section__title">Account</h2>
                </header>
                <div className="card profile-section__card profile-section__card--accent-secondary">
                  <form className="profile-section__form" onSubmit={onSave}>
                    <label className="field">
                      <span className="field-label">Display name</span>
                      <input
                        className="input"
                        type="text"
                        maxLength={80}
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">Email address</span>
                      <input
                        className="input"
                        type="email"
                        value={user?.email ?? ''}
                        readOnly
                      />
                      {oauthOnly && (
                        <span className="profile-hint">Managed by Google</span>
                      )}
                    </label>
                    <div className="profile-section__actions">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section className="profile-section">
                <header className="profile-section__head">
                  <Icon name="tune" size={20} className="profile-section__icon" />
                  <h2 className="profile-section__title">Preferences</h2>
                </header>
                <div className="card profile-section__card profile-section__card--accent-primary">
                  <div className="field">
                    <span className="field-label">Timezone</span>
                    <TimezoneSelect
                      value={timezone}
                      onChange={(opt) => setTimezone(opt.value)}
                      styles={tzStyles}
                    />
                  </div>
                  <div className="field">
                    <span className="field-label">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </section>

              {!oauthOnly && (
                <section className="profile-section profile-section--full">
                  <header className="profile-section__head">
                    <Icon name="security" size={20} className="profile-section__icon" />
                    <h2 className="profile-section__title">Security</h2>
                  </header>
                  <div className="card profile-section__card profile-section__card--accent-tertiary">
                    <form className="profile-section__form" onSubmit={onChangePassword}>
                      <div className="profile-section__grid-2">
                        <label className="field">
                          <span className="field-label">Current password</span>
                          <input
                            className="input"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">New password</span>
                          <input
                            className="input"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
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
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="profile-section__actions">
                        <button type="submit" className="btn btn-primary" disabled={pwdSaving}>
                          {pwdSaving ? 'Updating…' : 'Update password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </section>
              )}
            </div>

            <button type="button" className="profile-logout" onClick={handleLogout}>
              <Icon name="logout" size={18} />
              Log out
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
