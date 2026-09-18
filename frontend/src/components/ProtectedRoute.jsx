// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          color: 'var(--mt-ink-3)',
          fontSize: '0.9rem',
        }}
      >
        <div className="spinner" />
        Getting you in…
      </div>
    );
  }

  return accessToken ? children : <Navigate to="/login" replace />;
}
