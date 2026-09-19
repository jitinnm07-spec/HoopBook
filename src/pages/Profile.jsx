import { useState } from 'react';
import Shell from '../components/Shell';
import { useAuth } from '../context/AuthContext';
import { db, uid } from '../utils/storage';
import { sanitizeText } from '../utils/security';
import { useLanguage } from '../context/LanguageContext';

const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Competitive / Rep team'];
const AGE_GROUPS = ['U8', 'U12', 'U16', 'Adult'];

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { lang, setLang } = useLanguage();
  const [experience, setExperience] = useState(user?.basketballExperience || '');
  const [ageGroup, setAgeGroup] = useState(user?.ageGroup || '');
  const [saved, setSaved] = useState(false);

  const [children, setChildren] = useState(() => db.childrenForParent(user.id));
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGroup, setChildGroup] = useState('U12');

  async function saveProfile(e) {
    e.preventDefault();
    await db.updateUser(user.id, { basketballExperience: experience, ageGroup, language: lang });
    refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addChild(e) {
    e.preventDefault();
    if (!childName.trim()) return;
    const child = {
      id: uid('child'),
      parentId: user.id,
      name: sanitizeText(childName, 60),
      age: childAge ? Number(childAge) : null,
      ageGroup: childGroup,
    };
    await db.addChild(child);
    setChildren(db.childrenForParent(user.id));
    setChildName('');
    setChildAge('');
  }

  return (
    <Shell title="HoopBook" subtitle="Your profile">
      <div className="card">
        <h3>{user.name}</h3>
        <p className="muted">{user.email} · {user.phone}</p>
      </div>

      <div className="card"><h4>Language preference</h4><p>Choose the interface language.</p><div className="field"><select value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="zh">Mandarin / 中文</option><option value="ms">Malay / Bahasa Melayu</option></select></div></div>

      <div className="card">
        <h4>Basketball experience</h4>
        <p>Used to match you to the right training slots.</p>
        <form onSubmit={saveProfile}>
          <div className="field">
            <label>Experience level</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="">Select…</option>
              {EXPERIENCE.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Age group</label>
            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              <option value="">Select…</option>
              {AGE_GROUPS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          {saved && <div className="banner banner-success">Profile saved.</div>}
          <button className="btn btn-secondary" type="submit">Save profile</button>
        </form>
      </div>

      <div className="card">
        <h4>Children</h4>
        <p>Add a child to book training sessions on their behalf.</p>
        {children.length > 0 && (
          <div className="stack" style={{ marginBottom: 12 }}>
            {children.map((c) => (
              <div key={c.id} className="row" style={{ background: '#F7F4EC', padding: '8px 10px', borderRadius: 8 }}>
                <span>{c.name} {c.age ? `· age ${c.age}` : ''}</span>
                <span className="badge badge-open">{c.ageGroup}</span>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addChild}>
          <div className="field">
            <label>Child's name</label>
            <input value={childName} onChange={(e) => setChildName(e.target.value)} />
          </div>
          <div className="row" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Age</label>
              <input type="number" min="4" max="18" value={childAge} onChange={(e) => setChildAge(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Age group</label>
              <select value={childGroup} onChange={(e) => setChildGroup(e.target.value)}>
                {AGE_GROUPS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-outline" type="submit">Add child</button>
        </form>
      </div>

      <button className="btn btn-danger" onClick={logout} style={{ marginTop: 4 }}>Log out</button>
    </Shell>
  );
}
