import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Shell from '../components/Shell';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/storage';

const STATUS_LABEL = {
  pending: 'Awaiting coach review',
  waitlisted: 'Waitlisted',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function MyBookings() {
  const { user } = useAuth();
  const [requests, setRequests] = useState(() => db.requestsForUser(user.id).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await db.hydrate();
        if (alive) setRequests((data.requests || []).filter(r => String(r.userId) === String(user.id)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      } catch (e) {
        if (alive) setRequests(db.requestsForUser(user.id));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user.id]);

  return (
    <Shell title="HoopBook" subtitle="My bookings">
      {loading && <div className="card"><p>Loading your bookings…</p></div>}
      {!loading && requests.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No bookings yet.</p>
          <Link to="/courts" className="btn btn-primary">Find training</Link>
        </div>
      )}
      <div className="stack">
        {requests.map((r) => {
          const slot = db.slot(r.slotId);
          const court = db.courts().find((c) => String(c.id || c._id) === String(r.courtId));
          const payment = db.paymentsForUser(user.id).find((p) => p.requestId === r.id);
          return (
            <div key={r.id} className="card">
              <div className="row">
                <strong>{court?.name}</strong>
                <span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              <p style={{ marginTop: 6 }}>{slot?.date} · {slot?.time} · {r.playerLabel}</p>

              {r.status === 'approved' && (
                <>
                  {(!payment || payment.status === 'rejected') && (
                    <Link to={`/pay/${r.id}`} className="btn btn-primary" style={{ marginTop: 8 }}>
                      {payment?.status === 'rejected' ? 'Resubmit payment' : 'Pay now'}
                    </Link>
                  )}
                  {payment?.status === 'submitted' && (
                    <div className="banner banner-info" style={{ marginTop: 8, marginBottom: 0 }}>
                      Payment submitted — waiting on admin verification.
                    </div>
                  )}
                  {payment?.status === 'verified' && (
                    <div className="banner banner-success" style={{ marginTop: 8, marginBottom: 0 }}>
                      Paid · Fee ${payment.amount}. See you on court!
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
