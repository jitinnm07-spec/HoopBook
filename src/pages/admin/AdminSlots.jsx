import { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { db, uid } from '../../utils/storage';
import { sanitizeText } from '../../utils/security';

export default function AdminSlots() {
  const courts = db.courts();
  const [slots, setSlots] = useState(db.slots());
  const [form, setForm] = useState({
    courtId: courts[0]?.id || '', date: '', time: '', coach: '', ageGroup: 'U12', capacity: 12,
  });

  async function addSlot(e) {
    e.preventDefault();
    if (!form.courtId || !form.date || !form.time) return;
    await db.addSlot({
      courtId: form.courtId,
      date: form.date,
      time: sanitizeText(form.time, 30),
      coach: sanitizeText(form.coach, 60),
      ageGroup: form.ageGroup,
      capacity: Number(form.capacity) || 10,
    });
    await db.hydrateAdmin();
    setSlots(db.slots());
  }

  async function closeSlot(id) {
    await db.updateSlot(id, { status: 'closed' });
    await db.hydrateAdmin();
    setSlots(db.slots());
  }

  return (
    <AdminShell title="Slots">
      <div className="card">
        <table>
          <thead><tr><th>Court</th><th>Date</th><th>Time</th><th>Coach</th><th>Booked / Cap</th><th>Status</th><th /></tr></thead>
          <tbody>
            {slots.map((s) => {
              const court = courts.find((c) => c.id === s.courtId);
              return (
                <tr key={s.id}>
                  <td>{court?.name}</td>
                  <td>{s.date}</td>
                  <td>{s.time}</td>
                  <td>{s.coach}</td>
                  <td>{s.booked.length}/{s.capacity}</td>
                  <td><span className={`badge ${s.status === 'open' ? 'badge-open' : 'badge-full'}`}>{s.status}</span></td>
                  <td>{s.status === 'open' && <button className="btn btn-outline btn-sm" onClick={() => closeSlot(s.id)}>Close</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ maxWidth: 460 }}>
        <h4>Add slot</h4>
        <form onSubmit={addSlot}>
          <div className="field"><label>Court</label>
            <select value={form.courtId} onChange={(e) => setForm({ ...form, courtId: e.target.value })}>
              {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="row" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}><label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="field" style={{ flex: 1 }}><label>Time</label>
              <input placeholder="09:00–10:30" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
          </div>
          <div className="field"><label>Coach</label>
            <input value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} /></div>
          <div className="row" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}><label>Age group</label>
              <select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                <option>U8</option><option>U12</option><option>U16</option><option>Adult</option>
              </select></div>
            <div className="field" style={{ flex: 1 }}><label>Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          </div>
          <button className="btn btn-secondary" type="submit">Add slot</button>
        </form>
      </div>
    </AdminShell>
  );
}
