import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Shell from '../components/Shell';
import { db } from '../utils/storage';

export default function Courts() {
  const [query, setQuery] = useState('');
  const courts = db.courts();
  const slots = db.slots();

  const filtered = useMemo(
    () => courts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [courts, query]
  );

  function openSlotsCount(courtId) {
    return slots.filter((s) => s.courtId === courtId && s.status === 'open' && s.booked.length < s.capacity).length;
  }

  return (
    <Shell title="HoopBook" subtitle="Search courts & training">
      <div className="field">
        <input placeholder="Search by court name…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="stack">
        {filtered.map((c) => (
          <Link key={c.id} to={`/courts/${c.id}`} className="card" style={{ textDecoration: 'none', display: 'block' }}>
            <div className="row">
              <strong>{c.name}</strong>
              <span className="badge badge-open">{openSlotsCount(c.id)} open</span>
            </div>
            <p style={{ marginTop: 6 }}>{c.address} · {c.type}</p>
          </Link>
        ))}
        {filtered.length === 0 && <p className="muted">No courts match "{query}".</p>}
      </div>
    </Shell>
  );
}
