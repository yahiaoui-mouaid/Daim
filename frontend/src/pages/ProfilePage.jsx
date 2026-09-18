// src/pages/ProfilePage.jsx

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProtectedRoute from '../components/ProtectedRoute';
import MomentumAurora from '../components/MomentumAurora';
import { useAuth } from '../context/AuthContext';
import {
  deleteProfile,
  getCurrentUser,
  updateProfile,
} from '../services/profile';
import '../styles/Profile.css';

function ProfileContent() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    email: '',
    username: '',
    phone_number: '',
    date_of_birth: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCurrentUser();

      setProfile(data);
      setForm({
        email: data.email ?? '',
        username: data.username ?? '',
        phone_number: data.phone_number ?? '',
        date_of_birth: data.date_of_birth ?? '',
      });
    } catch (err) {
      setError(err.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!profile?.id && !user?.id) {
      setError('Your user ID could not be determined.');
      return;
    }

    const userId = profile?.id ?? user?.id;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfile(userId, {
        email: form.email,
        username: form.username,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth || null,
      });

      setProfile(updated);

      setForm({
        email: updated.email ?? '',
        username: updated.username ?? '',
        phone_number: updated.phone_number ?? '',
        date_of_birth: updated.date_of_birth ?? '',
      });

      setSuccess('Your profile has been updated successfully.');
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      setError(err.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!profile?.id && !user?.id) {
      setError('Your user ID could not be determined.');
      return;
    }

    const confirmed = window.confirm(
      'Delete your account permanently? This action cannot be undone.'
    );

    if (!confirmed) return;

    const userId = profile?.id ?? user?.id;

    setDeleting(true);
    setError(null);

    try {
      await deleteProfile(userId);

      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      setError(err.message || 'Could not delete your account.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <MomentumAurora />
        <Header />

        <main className="profile">
          <div className="profile__shell">
            <div className="profile__loading">
              <div className="spinner" />
              <p>Loading your profile…</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error && !profile) {
    return (
      <>
        <MomentumAurora />
        <Header />

        <main className="profile">
          <div className="profile__shell">
            <section className="state state--error">
              <p className="state__title">Couldn’t load your profile</p>
              <p>{error}</p>
              <button className="btn btn-secondary" onClick={loadProfile}>
                Try again
              </button>
            </section>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MomentumAurora />
      <Header />

      <main className="profile">
        <div className="profile__shell">
          <header className="profile__header animate-fade-up">
            <div>
              <span className="eyebrow">Account</span>

              <h1 className="profile__title">Your Profile</h1>

              <p className="profile__subtitle">
                Manage your personal information and account details.
              </p>
            </div>

            <div className="profile__avatar" aria-hidden="true">
              {(
                form.username?.charAt(0) ||
                form.email?.charAt(0) ||
                'U'
              ).toUpperCase()}
            </div>
          </header>

          {error && (
            <div className="profile__alert profile__alert--error" role="alert">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="profile__alert profile__alert--success" role="status">
              <span>{success}</span>
            </div>
          )}

          <section className="profile__card animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="profile__card-header">
              <div>
                <h2>Personal information</h2>

                <p>
                  Keep your account details up to date.
                </p>
              </div>
            </div>

            <form className="profile__form" onSubmit={handleSubmit}>
              <div className="profile__fields">
                <div className="profile__field profile__field--full">
                  <label htmlFor="email">
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="profile__field">
                  <label htmlFor="username">
                    Username
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    autoComplete="username"
                    placeholder="Your username"
                    required
                  />
                </div>

                <div className="profile__field">
                  <label htmlFor="phone_number">
                    Phone number
                  </label>

                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={form.phone_number}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder="+213 ..."
                  />
                </div>

                <div className="profile__field">
                  <label htmlFor="date_of_birth">
                    Date of birth
                  </label>

                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    autoComplete="bday"
                  />
                </div>
              </div>

              <div className="profile__form-footer">
                <p className="profile__hint">
                  Changes are saved securely to your account.
                </p>

                <button
                  className="profile__button profile__button--primary"
                  type="submit"
                  disabled={saving || deleting}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          <section
            className="profile__card profile__card--danger animate-fade-up"
            style={{ animationDelay: '150ms' }}
          >
            <div className="profile__card-header profile__card-header--danger">
              <div>
                <span className="profile__danger-label">
                  DANGER ZONE
                </span>

                <h2>Delete account</h2>

                <p>
                  Permanently remove your account and all associated data.
                </p>
              </div>
            </div>

            <div className="profile__danger-footer">
              <p>
                This action is permanent and cannot be undone.
              </p>

              <button
                className="profile__button profile__button--danger"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || saving}
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}