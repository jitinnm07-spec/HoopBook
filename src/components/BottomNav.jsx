
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
const items=[['/','home','🏠',true],['/courts','courts','🏀'],['/my-bookings','bookings','📅'],['/profile','profile','👤']];
export default function BottomNav(){const {t}=useLanguage();return <nav className="bottom-nav">{items.map(([to,k,icon,end])=><NavLink key={to} to={to} end={end} className={({isActive})=>isActive?'active':''}><span className="icon">{icon}</span><span>{t(k)}</span></NavLink>)}</nav>}
