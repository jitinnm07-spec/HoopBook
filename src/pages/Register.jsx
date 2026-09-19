import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkPasswordStrength } from '../utils/security';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('parent'); // parent | customer(player)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const strength = form.password ? checkPasswordStrength(form.password) : null;

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await register({ ...form, role: role === 'parent' ? 'customer' : 'customer', accountType: role });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    const loginRes = await login(form.email, form.password);
    setBusy(false);
    if (loginRes.ok) navigate('/profile', { replace: true });
    else navigate('/login', { replace: true });
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="court-lines" />
        <h2>Create your account</h2>
        <p>Register as a parent booking for your child, or as a player.</p>

        <div className="tabbed-toggle" style={{ marginTop: 16 }}>
          <button type="button" className={role === 'parent' ? 'active' : ''} onClick={() => setRole('parent')}>Parent</button>
          <button type="button" className={role === 'player' ? 'active' : ''} onClick={() => setRole('player')}>Player</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="banner banner-error">{error}</div>}
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" value={form.email}
              onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="phone">Mobile number</label>
            <input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="8-digit mobile" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" value={form.password}
              onChange={(e) => update('password', e.target.value)} required />
            {strength && (
              <div className={strength.valid ? 'hint' : 'error'} style={strength.valid ? { color: '#2D6A4F' } : undefined}>
                {strength.message}
              </div>
            )}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          Already registered? <Link to="/login" style={{ color: '#14281E', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
