import AdminShell from '../../components/AdminShell';
import { db } from '../../utils/storage';

export default function AdminReports() {
  const requests = db.allRequests();
  const payments = db.allPayments();
  const verified = payments.filter((p) => p.status === 'verified');
  const revenue = verified.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const byCourt = {};
  requests.forEach((r) => {
    const court = db.courts().find((c) => c.id === r.courtId);
    const key = court?.name || 'Unknown';
    byCourt[key] = (byCourt[key] || 0) + 1;
  });

  return (
    <AdminShell title="Reports">
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 160px' }}>
          <div style={{ fontSize: 28, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>SGD {revenue.toFixed(2)}</div>
          <p style={{ marginTop: 4 }}>Verified revenue</p>
        </div>
        <div className="card" style={{ flex: '1 1 160px' }}>
          <div style={{ fontSize: 28, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{requests.length}</div>
          <p style={{ marginTop: 4 }}>Total requests</p>
        </div>
        <div className="card" style={{ flex: '1 1 160px' }}>
          <div style={{ fontSize: 28, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{db.userCount()}</div>
          <p style={{ marginTop: 4 }}>Registered users</p>
        </div>
      </div>
      <div className="card">
        <h4>Requests by court</h4>
        <table>
          <thead><tr><th>Court</th><th>Requests</th></tr></thead>
          <tbody>
            {Object.entries(byCourt).map(([name, count]) => (
              <tr key={name}><td>{name}</td><td>{count}</td></tr>
            ))}
            {Object.keys(byCourt).length === 0 && <tr><td colSpan={2} className="muted">No data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
