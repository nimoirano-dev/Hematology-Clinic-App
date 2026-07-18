// ---------- Utils puros (sin dependencias de estado ni DOM salvo toast) ----------
export function ymd(d){ const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; }
export function parseYmd(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
export function esc(s){ return (s??'').toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function initials(n){ return (n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase(); }
export function fmtDateLong(s){ const d=parseYmd(s); const days=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']; const mon=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']; return `${days[d.getDay()]} ${d.getDate()} ${mon[d.getMonth()]}`; }
export function todayYmd(){ return ymd(new Date()); }
export function onlyDigits(s){ return (s||'').replace(/\D/g,''); }
export function toast(msg, type=''){ const t=document.getElementById('toast'); t.textContent=msg; t.className=''; if(type)t.classList.add(type); t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2600); }
