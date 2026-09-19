import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Shell from '../components/Shell';
import { useAuth } from '../context/AuthContext';
import { db, uid } from '../utils/storage';

export default function CourtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const court = db.courts().find((c) => c.id === id);
  const [slots, setSlots] = useState(db.slots().filter((s) => s.courtId === id));
  const [selected, setSelected] = useState(null);
  const [playerId, setPlayerId] = useState('self');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const children = db.childrenForParent(user.id);

  if (!court) {
    return (
      <Shell title="HoopBook"><p>Court not found.</p></Shell>
    );
  }

  async function submitRequest(e) {
    e.preventDefault();
    setError('');
    if (!selected) {
      setError('Pick a slot first.');
      return;
    }
    const slot = db.slot(selected.id);
    const isFull = slot.booked.length >= slot.capacity;
    const status = isFull ? 'waitlisted' : 'pending';

    const req = {
      id: uid('req'),
      userId: user.id,
      courtId: court.id,
      slotId: slot.id,
      playerLabel: playerId === 'self' ? user.name : children.find((c) => c.id === playerId)?.name || 'Player',
      status, // pending | waitlisted -> approved/rejected (coach)
      paymentStatus: 'unpaid',
      createdAt: Date.now(),
    };
    try {
      await db.addRequest(req);
      await db.hydrate();
      setSlots(db.slots().filter((s) => s.courtId === id));
    } catch (e) { setError(e.message); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Shell title="HoopBook" subtitle={court.name}>
        <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <div style={{ fontSize: 32 }}>✅</div>
          <h3>Request submitted</h3>
          <p>The coach will review your request. You'll see the outcome in My Bookings.</p>
          <Link to="/my-bookings" className="btn btn-secondary" style={{ marginTop: 10 }}>View my bookings</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="HoopBook" subtitle={court.name}>
      <p className="muted">{court.address} · {court.type}</p>
      <h4 style={{ marginTop: 16 }}>Available slots</h4>
      <div className="stack">
        {slots.map((s) => {
          const isFull = s.booked.length >= s.capacity;
          const active = selected?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="card"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                border: active ? '2px solid #14281E' : '1px solid var(--line)',
              }}
            >
              <div className="row">
                <strong>{s.date} · {s.time}</strong>
                <span className={`badge ${isFull ? 'badge-full' : 'badge-open'}`}>
                  {isFull ? 'Full (waitlist)' : `${s.capacity - s.booked.length} spots`}
                </span>
              </div>
              <p style={{ marginTop: 6 }}>{s.coach} · {s.ageGroup}</p>
            </button>
          );
        })}
      </div>

      {selected && (
        <form onSubmit={submitRequest} style={{ marginTop: 18 }}>
          <div className="field">
            <label>Who is this booking for?</label>
            <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              <option value="self">{user.name} (me)</option>
              {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <div className="banner banner-error">{error}</div>}
          <button className="btn btn-primary" type="submit">Submit request</button>
        </form>
      )}
    </Shell>
  );
}
