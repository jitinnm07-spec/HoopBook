import { useState } from 'react';
import AdminShell from "../../../components/AdminShell";
import { db } from "../../../utils/storage";
import { sanitizeText } from '../../../utils/security';

const STATUSES = ['submitted', 'verified', 'rejected'];

export default function AdminPayments() {
  const [payments, setPayments] = useState(db.allPayments());
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ amount: '', transactionRef: '', status: 'submitted' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      await db.hydrateAdmin();
      setPayments(db.allPayments().slice());
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  // UPDATE — verify / reject
  function decide(p, status) {
    run(() => db.updatePayment(p.id, { status }));
  }

  // UPDATE — edit amount, reference, status
  function startEdit(p) {
    setEditingId(p.id);
    setEditForm({ amount: p.amount, transactionRef: p.transactionRef, status: p.status });
  }
  function saveEdit(p) {
    const amount = Number(editForm.amount);
    if (Number.isNaN(amount) || amount < 0) return setError('Enter a valid amount.');
    if (!editForm.transactionRef.trim()) return setError('Reference can’t be empty.');
    run(async () => {
      await db.updatePayment(p.id, {
        amount,
        transactionRef: sanitizeText(editForm.transactionRef, 40),
        status: editForm.status,
      });
      setEditingId(null);
    });
  }

  // DELETE
  function removePayment(p) {
    if (!window.confirm(`Delete payment ${p.transactionRef}? This can’t be undone.`)) return;
    run(() => db.deletePayment(p.id));
  }

  const sorted = payments.slice().sort((a, b) => b.submittedAt - a.submittedAt);

  return (
    <AdminShell title="Payments">
      {error && <div className="banner banner-error">{error}</div>}
      <div className="card">
        <table>
          <thead><tr><th>Player</th><th>Amount</th><th>Reference</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {sorted.map((p) => {
              const req = db.allRequests().find((r) => r.id === p.requestId);
              const editing = editingId === p.id;
              return (
                <tr key={p.id}>
                  <td>{req?.playerLabel}</td>
                  <td>
                    {editing
                      ? <input type="number" min="0" style={{ width: 70 }} value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                      : `SGD ${p.amount}`}
                  </td>
                  <td>
                    {editing
                      ? <input value={editForm.transactionRef}
                          onChange={(e) => setEditForm({ ...editForm, transactionRef: e.target.value })} />
                      : p.transactionRef}
                  </td>
                  <td>
                    {editing ? (
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`badge badge-${p.status === 'verified' ? 'paid' : p.status === 'rejected' ? 'rejected' : 'pending'}`}>{p.status}</span>
                    )}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      {editing ? (
                        <>
                          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => saveEdit(p)}>Save</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {p.status === 'submitted' && (
                            <>
                              <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => decide(p, 'verified')}>Verify</button>
                              <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => decide(p, 'rejected')}>Reject</button>
                            </>
                          )}
                          <button className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>Edit</button>
                          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => removePayment(p)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && <tr><td colSpan={5} className="muted">No payment submissions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
