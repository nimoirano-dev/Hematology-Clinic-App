import { state } from './state.js';
import { renderAgenda } from './agenda.js';
import { renderPatients } from './patients.js';
import { renderWait } from './waitlist.js';
import { renderRequests } from './requests.js';
import { renderConfig } from './config.js';
import { renderStats } from './stats.js';

// ---------- Roles & nav ----------
const NAV = [
  { id:'agenda', label:'Agenda', roles:['admin','doctor'], icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { id:'solicitudes', label:'Solicitudes', roles:['admin'], icon:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
  { id:'pacientes', label:'Pacientes', roles:['admin','doctor'], icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { id:'espera', label:'Espera', roles:['admin'], icon:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { id:'stats', label:'Estadísticas', roles:['admin'], icon:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
  { id:'config', label:'Config', roles:['admin'], icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
];

export function buildNav(){
  const items = NAV.filter(n=>n.roles.includes(state.role));
  document.getElementById('navItems').innerHTML = items.map(n=>`
    <button class="nav-btn" data-sec="${n.id}" onclick="go('${n.id}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${n.icon}</svg>
      <span class="lbl-t">${n.label}</span>
      ${n.id==='solicitudes'?'<span class="badge" id="reqBadge" style="display:none">0</span>':''}
      ${n.id==='config'?'<span class="badge" id="accessBadge" style="display:none">0</span>':''}
    </button>`).join('');
  if(!items.find(n=>n.id===state.activeSection)) state.activeSection = items[0]?.id || 'agenda';
  go(state.activeSection);
}
window.buildNav = buildNav;

export function go(sec){
  state.activeSection = sec;
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-'+sec)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.sec===sec));
  if(sec==='agenda') renderAgenda();
  if(sec==='pacientes') renderPatients();
  if(sec==='espera') renderWait();
  if(sec==='solicitudes') renderRequests();
  if(sec==='config') renderConfig();
  if(sec==='stats') renderStats();
}
window.go = go;
