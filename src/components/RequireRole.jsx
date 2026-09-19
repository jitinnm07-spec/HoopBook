import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards a route: requires a logged-in user, and optionally a specific
 * role. This runs client-side only — in production the server must
 * re-check the role on every request too, since a client check can
 * always be bypassed by someone editing local JS.
 */
export default function RequireRole({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }
  return children;
}
