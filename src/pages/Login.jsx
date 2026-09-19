import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    const res = await login(email, password);

    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="court-lines" />

        <h2>Welcome back</h2>
        <p>Log in to book training sessions and courts.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
          {error && (
            <div className="banner banner-error">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div className="field">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="field">
            <label htmlFor="password">Password</label>

            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  paddingRight: 70
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#14281E',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD */}
          <div
            style={{
              textAlign: 'right',
              marginTop: -6,
              marginBottom: 16
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                color: '#14281E',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Forgot password?
            </Link>
          </div>

          {/* LOGIN */}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Checking…' : 'Log in'}
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 13
          }}
        >
          New here?{' '}
          <Link
            to="/register"
            style={{
              color: '#14281E',
              fontWeight: 600
            }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}