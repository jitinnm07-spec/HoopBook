import { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { db, uid } from '../../utils/storage';
import { sanitizeText } from '../../utils/security';

export default function AdminCourts() {
  const [courts, setCourts] = useState(db.courts());
  const [form, setForm] = useState({ name: '', address: '', type: 'Indoor' });

  async function addCourt(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await db.addCourt({ name: sanitizeText(form.name, 80), address: sanitizeText(form.address, 120), type: form.type });
    await db.hydrateAdmin();
    setCourts(db.courts());
    setForm({ name: '', address: '', type: 'Indoor' });
  }

  return (
    <AdminShell title="Courts">
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Address</th><th>Type</th></tr></thead>
          <tbody>
            {courts.map((c) => (
              <tr key={c.id}><td>{c.name}</td><td>{c.address}</td><td>{c.type}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ maxWidth: 420 }}>
        <h4>Add court</h4>
        <form onSubmit={addCourt}>
          <div className="field"><label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="field"><label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Indoor</option><option>Outdoor</option>
            </select></div>
          <button className="btn btn-secondary" type="submit">Add court</button>
        </form>
      </div>
    </AdminShell>
  );
}
