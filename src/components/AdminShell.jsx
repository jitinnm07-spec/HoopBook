import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/courts', label: 'Courts' },
  { to: '/admin/slots', label: 'Slots' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function AdminShell({ title, children }) {
  const { user, logout } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 18 }}>
          🏀 HoopBook <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 12 }}>admin</span>
        </div>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 12.5, opacity: 0.8, marginBottom: 8 }}>{user.name}</div>
          <button className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <h2>{title}</h2>
        {children}
      </main>
    </div>
  );
}
