
import {createContext,useContext,useEffect,useState} from 'react';
const DICT={
 en:{home:'Home',courts:'Courts',bookings:'Bookings',profile:'Profile',language:'Language',english:'English',mandarin:'Mandarin',malay:'Malay',logout:'Log out'},
 zh:{home:'首页',courts:'球场',bookings:'预订',profile:'个人资料',language:'语言',english:'英语',mandarin:'普通话',malay:'马来语',logout:'退出登录'},
 ms:{home:'Utama',courts:'Gelanggang',bookings:'Tempahan',profile:'Profil',language:'Bahasa',english:'Inggeris',mandarin:'Mandarin',malay:'Melayu',logout:'Log keluar'}
};
const C=createContext(null);
export function LanguageProvider({children}){const [lang,setLang]=useState(()=>localStorage.getItem('hoopbook_language')||'en');useEffect(()=>localStorage.setItem('hoopbook_language',lang),[lang]);const t=(k)=>DICT[lang]?.[k]||DICT.en[k]||k;return <C.Provider value={{lang,setLang,t}}>{children}</C.Provider>}
export const useLanguage=()=>useContext(C);
