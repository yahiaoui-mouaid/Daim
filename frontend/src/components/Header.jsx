import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Header.css';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Header() {
  const { accessToken, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `app-header__nav-link ${isActive ? 'app-header__nav-link--active' : ''}`.trim();

  return (
    <header className="app-header">
      <div className="app-header__inner mt-page">
        <NavLink to="/" className="app-header__brand" aria-label="Momentum home">
          <span className="app-header__mark" aria-hidden="true">
            <svg viewBox="0 0 36 36" width="34" height="34">
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                stroke="var(--mt-surface-3)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                stroke="var(--mt-accent)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="88"
                strokeDashoffset="26"
                transform="rotate(-90 18 18)"
              />
            </svg>
          </span>
          <span className="app-header__wordmark">Momentum</span>
        </NavLink>

        <div className="app-header__actions">
          {accessToken ? (
            <>
              <nav className="app-header__nav">
                <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
                <NavLink to="/habits" className={navLinkClass}>Habits</NavLink>
              </nav>

              <button
                type="button"
                className="icon-btn app-header__theme"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>

              <div className="app-header__dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="app-header__avatar"
                  onClick={() => setDropdownOpen((open) => !open)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-label="Account menu"
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="app-header__dropdown-menu">
                    <NavLink
                      to="/profile"
                      className="app-header__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </NavLink>
                    <button
                      type="button"
                      className="app-header__dropdown-item app-header__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="icon-btn app-header__theme"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <NavLink to="/login" className="btn btn-secondary btn--sm">
                Log in
              </NavLink>
              <NavLink to="/login" className="btn btn-primary btn--sm">
                Get started
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
