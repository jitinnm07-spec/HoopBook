import AdminShell from '../../components/AdminShell';
import { db } from '../../utils/storage';

export default function AdminDashboard() {
  const requests = db.allRequests();
  const payments = db.allPayments();
  const stats = [
    { label: 'Pending requests', value: requests.filter((r) => r.status === 'pending').length },
    { label: 'Approved (unpaid)', value: requests.filter((r) => r.status === 'approved' && r.paymentStatus !== 'submitted' && r.paymentStatus !== 'verified').length },
    { label: 'Payments to verify', value: payments.filter((p) => p.status === 'submitted').length },
    { label: 'Total courts', value: db.courts().length },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 28, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{s.value}</div>
            <p style={{ marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h4>Recent requests</h4>
        <table>
          <thead><tr><th>Player</th><th>Court</th><th>Status</th></tr></thead>
          <tbody>
            {requests.slice(-6).reverse().map((r) => {
              const court = db.courts().find((c) => c.id === r.courtId);
              return (
                <tr key={r.id}>
                  <td>{r.playerLabel}</td>
                  <td>{court?.name}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                </tr>
              );
            })}
            {requests.length === 0 && <tr><td colSpan={3} className="muted">No requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
