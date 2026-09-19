import { Link } from 'react-router-dom';
import Shell from '../components/Shell';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/storage';

export default function Home() {
  const { user } = useAuth();
  const announcements = db.announcements();
  const myRequests = db.requestsForUser(user.id);
  const pendingCount = myRequests.filter((r) => r.status === 'pending').length;
  const needsPayment = myRequests.filter((r) => r.status === 'approved' && r.paymentStatus !== 'paid').length;

  return (
    <Shell title="HoopBook" subtitle={`Hey ${user.name.split(' ')[0]} 👋`}>
      {!user.basketballExperience && (
        <div className="banner banner-info">
          Finish your <Link to="/profile" style={{ fontWeight: 700 }}>profile</Link> so coaches can place you in the right group.
        </div>
      )}
      {needsPayment > 0 && (
        <div className="banner banner-error">
          You have {needsPayment} approved slot{needsPayment > 1 ? 's' : ''} waiting on payment. <Link to="/my-bookings" style={{ fontWeight: 700 }}>Pay now</Link>
        </div>
      )}

      <div className="row" style={{ gap: 10, marginBottom: 16 }}>
        <Link to="/courts" className="card" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
          <div style={{ fontSize: 24 }}>🏀</div>
          <strong>Find training</strong>
          <p className="muted" style={{ marginTop: 2 }}>Browse slots</p>
        </Link>
        <Link to="/my-bookings" className="card" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
          <div style={{ fontSize: 24 }}>📅</div>
          <strong>My bookings</strong>
          <p className="muted" style={{ marginTop: 2 }}>{pendingCount} pending</p>
        </Link>
      </div>

      <h4>Announcements</h4>
      <div className="stack">
        {announcements.map((a) => (
          <div key={a.id} className="card">
            <strong>{a.title}</strong>
            <p style={{ marginTop: 6 }}>{a.body}</p>
            <span className="muted">{a.date}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}
