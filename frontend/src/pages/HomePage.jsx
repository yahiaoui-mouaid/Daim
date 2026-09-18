// src/pages/HomePage.jsx
// Momentum landing — progress, consistency, compounding habits.

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ProgressRing from '../components/ProgressRing';
import MomentumAurora from '../components/MomentumAurora';
import { useReveal } from '../hooks/useReveal';
import '../styles/Home.css';

const FEATURES = [
  {
    n: '01',
    title: 'Show up daily',
    body: 'Log habits in one tap. Every check-in extends the chain — small reps, repeated.',
  },
  {
    n: '02',
    title: 'Watch it compound',
    body: 'Streaks, rings, and quiet charts turn ordinary days into visible, measurable progress.',
  },
  {
    n: '03',
    title: 'Keep the rhythm',
    body: 'Calm insights surface your patterns, so consistency becomes the default, not the exception.',
  },
];

export default function HomePage() {
  const { user, accessToken } = useAuth();
  const [featuresRef, featuresVisible] = useReveal();

  return (
    <>
      <MomentumAurora />
      <Header />

      <main className="home">
        <section className="home__hero mt-page">
          <div className="home__hero-content">
            <span className="eyebrow animate-fade-up" style={{ animationDelay: '40ms' }}>
              Build momentum, one day at a time
            </span>

            <h1 className="home__title animate-fade-up" style={{ animationDelay: '90ms' }}>
              Small habits.
              <span> Lasting momentum.</span>
            </h1>

            <p
              className="home__description animate-fade-up"
              style={{ animationDelay: '150ms' }}
            >
              A calm, focused dashboard for the habits that compound. Track your
              daily reps, watch streaks grow, and let quiet progress speak for
              itself — no noise, no shame, just the next check-in.
            </p>

            <div className="home__actions animate-fade-up" style={{ animationDelay: '210ms' }}>
              {accessToken ? (
                <>
                  <Link to="/dashboard" className="btn btn-primary">
                    Go to dashboard
                  </Link>
                  <Link to="/habits" className="btn btn-secondary">
                    My habits
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary">
                    Get started
                  </Link>
                  <Link to="/login" className="btn btn-ghost">
                    Log in
                  </Link>
                </>
              )}
            </div>

            {accessToken && (
              <p className="home__welcome animate-fade-in" style={{ animationDelay: '320ms' }}>
                Welcome back,{' '}
                <strong>{user?.username || user?.email || 'there'}</strong> — keep the
                chain going.
              </p>
            )}
          </div>

          {/* ---- Hero visual: momentum ring + live stats ---- */}
          <div
            className="home__visual animate-scale-in"
            style={{ animationDelay: '180ms' }}
            aria-hidden="true"
          >
            <div className="home__card">
              <div className="home__card-top">
                <div>
                  <span className="home__mini-label">TODAY&apos;S MOMENTUM</span>
                  <strong>On track</strong>
                </div>
                <span className="badge badge--accent">
                  <span className="home__pulse" /> Live
                </span>
              </div>

              <div className="home__ring-row">
                <ProgressRing value={87} size={132} stroke={11} label="Consistency">
                  <span className="home__ring-value">87%</span>
                  <span className="home__ring-label">Consistency</span>
                </ProgressRing>

                <div className="home__mini-stats">
                  <div className="home__mini-stat">
                    <span className="home__mini-value">12</span>
                    <span className="home__mini-label">Day streak</span>
                  </div>
                  <div className="home__mini-stat">
                    <span className="home__mini-value">6/7</span>
                    <span className="home__mini-label">This week</span>
                  </div>
                  <div className="home__mini-stat">
                    <span className="home__mini-value">4</span>
                    <span className="home__mini-label">Habits</span>
                  </div>
                </div>
              </div>

              <div className="home__bars" aria-hidden="true">
                {[55, 72, 48, 90, 66, 84, 100].map((h, i) => (
                  <span
                    key={i}
                    className="home__bar"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${420 + i * 80}ms`,
                    }}
                  />
                ))}
              </div>

              <p className="home__insight">
                Your most consistent window is 9:00–12:00. Protect it.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={featuresRef}
          className={`home__features mt-page reveal ${featuresVisible ? 'is-visible' : ''}`}
        >
          {FEATURES.map((f) => (
            <article key={f.n} className="home__feature">
              <span className="home__feature-n">{f.n}</span>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
