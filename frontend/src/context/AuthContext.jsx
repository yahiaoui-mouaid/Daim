import { createContext, useContext, useState, useEffect } from 'react';
import { setApiAccessToken } from "../api";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null); // memory only
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know auth state

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await fetch('/api/token/refresh/', {
          method: 'POST',
          credentials: 'include', // sends the httpOnly refresh cookie
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.access);
          setApiAccessToken(data.access);
          // if your refresh endpoint doesn't return user info,
          // you may want to fetch /api/users/me/ here too
        }
      } catch {
        // no valid session — stay logged out, this is expected on first visit
      } finally {
        setLoading(false);
      }
    };
    silentRefresh();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Invalid credentials');
      }

      const data = await res.json();
      setAccessToken(data.access);
      setApiAccessToken(data.access);
      setUser(data.user ?? null);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/token/logout/', {
      method: 'POST',
      credentials: 'include',
    });
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);