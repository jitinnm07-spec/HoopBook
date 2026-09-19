
import BottomNav from './BottomNav';
import {useLanguage} from '../context/LanguageContext';
export default function Shell({title,subtitle,children,nav=true}){
 const {lang,setLang,t}=useLanguage();
 return <div className="app-shell"><div className="top-bar"><div><div className="brand"><span className="dot"/>{title||'HoopBook'}</div>{subtitle&&<div className="sub">{subtitle}</div>}</div><label className="lang-picker"><span>🌐</span><select aria-label={t('language')} value={lang} onChange={e=>setLang(e.target.value)}><option value="en">{t('english')}</option><option value="zh">{t('mandarin')}</option><option value="ms">{t('malay')}</option></select></label></div><div className="screen">{children}</div>{nav&&<BottomNav/>}</div>
}
