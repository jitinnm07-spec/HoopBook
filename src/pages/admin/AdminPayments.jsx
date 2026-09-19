import { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { db } from '../../utils/storage';

export default function AdminPayments() {
  const [payments, setPayments] = useState(db.allPayments());

  function refresh() {
    setPayments(db.allPayments().slice());
  }

  async function decide(p, status) {
    await db.updatePayment(p.id, { status });
    await db.hydrateAdmin();
    refresh();
  }

  const sorted = payments.slice().sort((a, b) => b.submittedAt - a.submittedAt);

  return (
    <AdminShell title="Payments">
      <div className="card">
        <table>
          <thead><tr><th>Player</th><th>Amount</th><th>Reference</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {sorted.map((p) => {
              const req = db.allRequests().find((r) => r.id === p.requestId);
              return (
                <tr key={p.id}>
                  <td>{req?.playerLabel}</td>
                  <td>SGD {p.amount}</td>
                  <td>{p.transactionRef}</td>
                  <td><span className={`badge badge-${p.status === 'verified' ? 'paid' : p.status === 'rejected' ? 'rejected' : 'pending'}`}>{p.status}</span></td>
                  <td>
                    {p.status === 'submitted' ? (
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => decide(p, 'verified')}>Verify</button>
                        <button className="btn btn-danger btn-sm" onClick={() => decide(p, 'rejected')}>Reject</button>
                      </div>
                    ) : <span className="muted">Done</span>}
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
