import { useState } from 'react';
import AdminShell from "../../../components/AdminShell";
import { db } from "../../../utils/storage";

const STATUSES = ['pending', 'waitlisted', 'approved', 'rejected'];

export default function AdminBookings() {
  const [requests, setRequests] = useState(db.allRequests());
  const [fees, setFees] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'pending', fee: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      await db.hydrateAdmin();
      setRequests(db.allRequests().slice());
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  // UPDATE — quick decision on a pending request
  function decide(req, status) {
    const patch = { status };
    if (status === 'approved') patch.fee = Number(fees[req.id]) || 25;
    run(() => db.updateRequest(req.id, patch));
  }

  // UPDATE — edit status / fee on any request
  function startEdit(r) {
    setEditingId(r.id);
    setEditForm({ status: r.status, fee: r.fee ?? '' });
  }
  function saveEdit(r) {
    const patch = { status: editForm.status };
    if (editForm.fee !== '') {
      const fee = Number(editForm.fee);
      if (Number.isNaN(fee) || fee < 0) return setError('Enter a valid fee.');
      patch.fee = fee;
    }
    run(async () => {
      await db.updateRequest(r.id, patch);
      setEditingId(null);
    });
  }

  // DELETE
  function removeRequest(r) {
    if (!window.confirm(`Delete the booking for ${r.playerLabel}? This can’t be undone.`)) return;
    run(() => db.deleteRequest(r.id));
  }

  const sorted = requests.slice().sort((a, b) => b.createdAt - a.createdAt);

  return (
    <AdminShell title="Bookings">
      {error && <div className="banner banner-error">{error}</div>}
      <div className="card">
        <table>
          <thead>
            <tr><th>Player</th><th>Court</th><th>Slot</th><th>Status</th><th>Fee (SGD)</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const court = db.courts().find((c) => c.id === r.courtId);
              const slot = db.slot(r.slotId);
              const pending = r.status === 'pending' || r.status === 'waitlisted';
              const editing = editingId === r.id;
              return (
                <tr key={r.id}>
                  <td>{r.playerLabel}</td>
                  <td>{court?.name}</td>
                  <td>{slot?.date} {slot?.time}</td>
                  <td>
                    {editing ? (
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : <span className={`badge badge-${r.status}`}>{r.status}</span>}
                  </td>
                  <td>
                    {editing ? (
                      <input type="number" min="0" style={{ width: 70 }} value={editForm.fee}
                        onChange={(e) => setEditForm({ ...editForm, fee: e.target.value })} />
                    ) : pending ? (
                      <input
                        type="number" min="0" placeholder="25"
                        style={{ width: 64, padding: 6, borderRadius: 6, border: '1px solid var(--line)' }}
                        value={fees[r.id] ?? ''}
                        onChange={(e) => setFees({ ...fees, [r.id]: e.target.value })}
                      />
                    ) : (r.fee ?? '—')}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      {editing ? (
                        <>
                          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => saveEdit(r)}>Save</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {pending && (
                            <>
                              <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => decide(r, 'approved')}>Approve</button>
                              <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => decide(r, 'waitlisted')}>Waitlist</button>
                              <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => decide(r, 'rejected')}>Reject</button>
                            </>
                          )}
                          <button className="btn btn-outline btn-sm" onClick={() => startEdit(r)}>Edit</button>
                          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => removeRequest(r)}>Delete</button>
                        </>
                      )}
                    </div>
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
