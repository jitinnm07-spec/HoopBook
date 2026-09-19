
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const CACHE_KEY = 'hoopbook_cache_v2';
const TOKEN_KEY = 'hoopbook_token';

function load() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || { users:[], children:[], courts:[], slots:[], requests:[], payments:[], announcements:[] }; }
  catch { return { users:[], children:[], courts:[], slots:[], requests:[], payments:[], announcements:[] }; }
}
function save(d) { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); }
function norm(x) {
  if (!x) return x;
  const id = String(x.id || x._id);
  const out = {...x, id};
  for (const key of ['userId','courtId','slotId','requestId','parentId']) {
    if (out[key] && typeof out[key] === 'object') out[key] = String(out[key]._id || out[key].id || out[key]);
  }
  if (Array.isArray(out.booked)) out.booked = out.booked.map(v => String(v && (v._id || v.id || v)));
  return out;
}
function normalizeList(a) { return (a||[]).map(norm); }
async function request(path, options={}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type':'application/json', ...(options.headers||{}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${API_BASE}${path}`, {...options,headers});
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export function setToken(t){ if(t) localStorage.setItem(TOKEN_KEY,t); else localStorage.removeItem(TOKEN_KEY); }
export function getToken(){ return localStorage.getItem(TOKEN_KEY); }

export async function hydrate() {
  const d = load();
  try {
    const [courts,slots,announcements] = await Promise.all([request('/courts'),request('/slots'),request('/announcements')]);
    d.courts=normalizeList(courts.courts); d.slots=normalizeList(slots.slots); d.announcements=normalizeList(announcements.announcements);
    if (getToken()) {
      const [children,bookings] = await Promise.all([request('/children'),request('/bookings')]);
      d.children=normalizeList(children.children); d.requests=normalizeList(bookings.requests); d.payments=normalizeList(bookings.payments);
    }
    save(d); return d;
  } catch { return d; }
}
export async function hydrateAdmin() {
  const d = await hydrate();
  if (!getToken()) return d;
  try {
    const [bookings,payments,courts,slots,overview] = await Promise.all([
      request('/admin/bookings'), request('/admin/payments'), request('/courts'), request('/slots'), request('/admin/overview')
    ]);
    d.requests=normalizeList(bookings.requests); d.payments=normalizeList(payments.payments); d.courts=normalizeList(courts.courts); d.slots=normalizeList(slots.slots); d.userCount=overview.userCount;
    save(d); return d;
  } catch { return d; }
}
export function uid(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;}

export const db = {
  get:()=>load(), set:(next)=>save(next),
  courts:()=>load().courts, slots:()=>load().slots,
  slot:(id)=>load().slots.find(x=>String(x._id||x.id)===String(id)),
  announcements:()=>load().announcements,
  childrenForParent:(parentId)=>load().children.filter(x=>String(x.parentId)===String(parentId)),
  requestsForUser:(userId)=>load().requests.filter(x=>String(x.userId)===String(userId)),
  allRequests:()=>load().requests, paymentsForUser:(userId)=>load().payments.filter(x=>String(x.userId)===String(userId)),
  allPayments:()=>load().payments,

  addChild:async(child)=>{const r=await request('/children',{method:'POST',body:JSON.stringify(child)});const d=load();d.children.push(r.child);save(d);return r.child;},
  updateUser:async(id,patch)=>{const r=await request('/profile',{method:'PATCH',body:JSON.stringify(patch)});const d=load();d.users=[...(d.users||[]).filter(x=>String(x.id)!==String(id)),r.user];save(d);return r.user;},
  addRequest:async(req)=>{
    const r=await request('/bookings',{method:'POST',body:JSON.stringify({slotId:req.slotId,playerLabel:req.playerLabel})});
    const d=load();
    const booking=norm(r.request);
    d.requests=[...(d.requests||[]).filter(x=>String(x.id||x._id)!==String(booking.id)),booking];
    const s=d.slots.find(x=>String(x._id||x.id)===String(req.slotId));
    if(s){ s.booked=Array.isArray(s.booked)?s.booked.map(v=>String(v)) : []; if(!s.booked.includes(booking.id)) s.booked.push(booking.id); }
    save(d);
    // Re-read from MongoDB so My Bookings always reflects the authoritative booking.
    try { await hydrate(); } catch {}
    return booking;
  },
  updateRequest:async(id,patch)=>{
    const r=await request(`/admin/bookings/${id}`,{method:'PATCH',body:JSON.stringify(patch)});
    const d=load();const i=d.requests.findIndex(x=>String(x._id||x.id)===String(id));if(i>=0)d.requests[i]=norm(r.request);else d.requests.push(norm(r.request));save(d);return r.request;
  },
  addPayment:async(p)=>{return p;},
  updatePayment:async(id,patch)=>{
    const r=await request(`/admin/payments/${id}`,{method:'PATCH',body:JSON.stringify(patch)});
    const d=load();const i=d.payments.findIndex(x=>String(x._id||x.id)===String(id));if(i>=0)d.payments[i]=norm(r.payment);save(d);return r.payment;
  },
  addCourt:async(c)=>{const r=await request('/admin/courts',{method:'POST',body:JSON.stringify(c)});const d=load();d.courts.push(norm(r.court));save(d);return r.court;},
  addSlot:async(s)=>{const r=await request('/admin/slots',{method:'POST',body:JSON.stringify(s)});const d=load();d.slots.push(norm(r.slot));save(d);return r.slot;},
  updateSlot:async(id,patch)=>{const r=await request(`/admin/slots/${id}`,{method:'PATCH',body:JSON.stringify(patch)});const d=load();const i=d.slots.findIndex(x=>String(x._id||x.id)===String(id));if(i>=0)d.slots[i]=norm(r.slot);save(d);return r.slot;},
  userCount:()=>load().userCount||0,
  hydrate, hydrateAdmin
};
