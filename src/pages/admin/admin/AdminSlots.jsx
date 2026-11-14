import { useState } from 'react';
import AdminShell from "../../../components/AdminShell";
import { db } from "../../../utils/storage";
import { sanitizeText } from '../../../utils/security';

const AGE_GROUPS = ['U8', 'U12', 'U16', 'Adult'];

export default function AdminSlots() {
  const courts = db.courts();
  const [slots, setSlots] = useState(db.slots());
  const [form, setForm] = useState({
    courtId: courts[0]?.id || '', date: '', time: '', coach: '', ageGroup: 'U12', capacity: 12,
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      await db.hydrateAdmin();
      setSlots(db.slots());
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  // CREATE
  function addSlot(e) {
    e.preventDefault();
    if (!form.courtId || !form.date || !form.time) return setError('Choose a court, date and time.');
    run(() =>
      db.addSlot({
        courtId: form.courtId,
        date: form.date,
        time: sanitizeText(form.time, 30),
        coach: sanitizeText(form.coach, 60),
        ageGroup: form.ageGroup,
        capacity: Number(form.capacity) || 10,
      })
    );
  }

  // UPDATE
  function startEdit(s) {
    setEditingId(s.id);
    setEditForm({
      courtId: s.courtId, date: s.date, time: s.time, coach: s.coach,
      ageGroup: s.ageGroup, capacity: s.capacity, status: s.status,
    });
  }
  function saveEdit(s) {
    const capacity = Number(editForm.capacity);
    if (!editForm.date || !editForm.time) return setError('Date and time are required.');
    if (!capacity || capacity < s.booked.length) {
      return setError(`Capacity can’t be below the ${s.booked.length} players already booked.`);
    }
    run(async () => {
      await db.updateSlot(s.id, {
        courtId: editForm.courtId,
        date: editForm.date,
        time: sanitizeText(editForm.time, 30),
        coach: sanitizeText(editForm.coach, 60),
        ageGroup: editForm.ageGroup,
        capacity,
        status: editForm.status,
      });
      setEditingId(null);
    });
  }
  function setStatus(id, status) {
    run(() => db.updateSlot(id, { status }));
  }

  // DELETE
  function removeSlot(s) {
    const msg = s.booked.length
      ? `This slot has ${s.booked.length} booking${s.booked.length > 1 ? 's' : ''}. Delete it anyway?`
      : 'Delete this slot?';
    if (!window.confirm(msg)) return;
    run(() => db.deleteSlot(s.id));
  }

  return (
    <AdminShell title="Slots">
      {error && <div className="banner banner-error">{error}</div>}
      <div className="card">
        <table>
          <thead><tr><th>Court</th><th>Date</th><th>Time</th><th>Coach</th><th>Age</th><th>Booked / Cap</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {slots.map((s) => {
              const court = courts.find((c) => c.id === s.courtId);
              const editing = editingId === s.id;
              if (editing) {
                return (
                  <tr key={s.id}>
                    <td>
                      <select value={editForm.courtId} onChange={(e) => setEditForm({ ...editForm, courtId: e.target.value })}>
                        {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></td>
                    <td><input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} /></td>
                    <td><input value={editForm.coach} onChange={(e) => setEditForm({ ...editForm, coach: e.target.value })} /></td>
                    <td>
                      <select value={editForm.ageGroup} onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}>
                        {AGE_GROUPS.map((g) => <option key={g}>{g}</option>)}
                      </select>
                    </td>
                    <td>
                      {s.booked.length}/
                      <input type="number" min="1" style={{ width: 60 }} value={editForm.capacity}
                        onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} />
                    </td>
                    <td>
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="open">open</option><option value="closed">closed</option>
                      </select>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => saveEdit(s)}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={s.id}>
                  <td>{court?.name}</td>
                  <td>{s.date}</td>
                  <td>{s.time}</td>
                  <td>{s.coach}</td>
                  <td>{s.ageGroup}</td>
                  <td>{s.booked.length}/{s.capacity}</td>
                  <td><span className={`badge ${s.status === 'open' ? 'badge-open' : 'badge-full'}`}>{s.status}</span></td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(s)}>Edit</button>
                      {s.status === 'open'
                        ? <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => setStatus(s.id, 'closed')}>Close</button>
                        : <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => setStatus(s.id, 'open')}>Reopen</button>}
                      <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => removeSlot(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {slots.length === 0 && <tr><td colSpan={8} className="muted">No slots yet. Add one below.</td></tr>}
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
                {AGE_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select></div>
            <div className="field" style={{ flex: 1 }}><label>Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          </div>
          <button className="btn btn-secondary" type="submit" disabled={busy}>Add slot</button>
        </form>
      </div>
    </AdminShell>
  );
}
