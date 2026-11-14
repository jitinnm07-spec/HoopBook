import { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { db } from '../../utils/storage';
import { sanitizeText } from '../../utils/security';

const EMPTY = { name: '', address: '', type: 'Indoor' };

export default function AdminCourts() {
  const [courts, setCourts] = useState(db.courts());
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      await db.hydrateAdmin();
      setCourts(db.courts());
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function clean(f) {
    return { name: sanitizeText(f.name, 80), address: sanitizeText(f.address, 120), type: f.type };
  }

  // CREATE
  function addCourt(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter a court name.');
    run(async () => {
      await db.addCourt(clean(form));
      setForm(EMPTY);
    });
  }

  // UPDATE
  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({ name: c.name, address: c.address, type: c.type });
  }
  function saveEdit(id) {
    if (!editForm.name.trim()) return setError('Court name can’t be empty.');
    run(async () => {
      await db.updateCourt(id, clean(editForm));
      setEditingId(null);
    });
  }

  // DELETE
  function removeCourt(c) {
    const slotCount = db.slots().filter((s) => s.courtId === c.id).length;
    const warning = slotCount
      ? `Delete “${c.name}”? Its ${slotCount} slot${slotCount > 1 ? 's' : ''} will be affected too.`
      : `Delete “${c.name}”?`;
    if (!window.confirm(warning)) return;
    run(() => db.deleteCourt(c.id));
  }

  return (
    <AdminShell title="Courts">
      {error && <div className="banner banner-error">{error}</div>}
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Address</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            {courts.map((c) => {
              const editing = editingId === c.id;
              return (
                <tr key={c.id}>
                  {editing ? (
                    <>
                      <td><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                      <td><input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></td>
                      <td>
                        <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                          <option>Indoor</option><option>Outdoor</option>
                        </select>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => saveEdit(c.id)}>Save</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{c.name}</td><td>{c.address}</td><td>{c.type}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>Edit</button>
                          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => removeCourt(c)}>Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {courts.length === 0 && <tr><td colSpan={4} className="muted">No courts yet. Add one below.</td></tr>}
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
          <button className="btn btn-secondary" type="submit" disabled={busy}>Add court</button>
        </form>
      </div>
    </AdminShell>
  );
}
