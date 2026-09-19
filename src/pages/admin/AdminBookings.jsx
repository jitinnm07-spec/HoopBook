import { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { db } from '../../utils/storage';

export default function AdminBookings() {
  const [requests, setRequests] = useState(db.allRequests());
  const [fees, setFees] = useState({});

  function refresh() {
    setRequests(db.allRequests().slice());
  }

  async function decide(req, status) {
    const patch = { status };
    if (status === 'approved') {
      patch.fee = Number(fees[req.id]) || 25;
    }
    await db.updateRequest(req.id, patch);
    await db.hydrateAdmin();
    refresh();
  }

  const sorted = requests.slice().sort((a, b) => b.createdAt - a.createdAt);

  return (
    <AdminShell title="Bookings">
      <div className="card">
        <table>
          <thead>
            <tr><th>Player</th><th>Court</th><th>Slot</th><th>Status</th><th>Fee (SGD)</th><th>Action</th></tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const court = db.courts().find((c) => c.id === r.courtId);
              const slot = db.slot(r.slotId);
              const pending = r.status === 'pending' || r.status === 'waitlisted';
              return (
                <tr key={r.id}>
                  <td>{r.playerLabel}</td>
                  <td>{court?.name}</td>
                  <td>{slot?.date} {slot?.time}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td>
                    {pending ? (
                      <input
                        type="number"
                        min="0"
                        style={{ width: 64, padding: 6, borderRadius: 6, border: '1px solid var(--line)' }}
                        placeholder="25"
                        value={fees[r.id] ?? ''}
                        onChange={(e) => setFees({ ...fees, [r.id]: e.target.value })}
                      />
                    ) : (r.fee ?? '—')}
                  </td>
                  <td>
                    {pending ? (
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => decide(r, 'approved')}>Approve</button>
                        <button className="btn btn-outline btn-sm" onClick={() => decide(r, 'waitlisted')}>Waitlist</button>
                        <button className="btn btn-danger btn-sm" onClick={() => decide(r, 'rejected')}>Reject</button>
                      </div>
                    ) : <span className="muted">Decided</span>}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && <tr><td colSpan={6} className="muted">No booking requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
