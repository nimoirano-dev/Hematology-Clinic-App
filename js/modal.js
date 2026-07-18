import { esc } from './utils.js';

// ---------- Modal helpers ----------
export function modal(title, body, actions){
  document.getElementById('modal').innerHTML = `
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-foot" id="modalFoot"></div>`;
  const foot = document.getElementById('modalFoot');
  actions.forEach(a=>{ const b=document.createElement('button'); b.className='btn '+a.class; b.textContent=a.label; b.onclick=a.fn; foot.appendChild(b); });
  document.getElementById('modalBg').classList.add('open');
}
export function closeModal(){ document.getElementById('modalBg').classList.remove('open'); }
window.closeModal = closeModal;
document.getElementById('modalBg').addEventListener('click', e=>{ if(e.target.id==='modalBg') closeModal(); });

export function confirmDialog(msg, onYes){
  modal('Confirmar', `<p>${esc(msg)}</p>`, [
    {label:'No', class:'btn-ghost', fn:closeModal},
    {label:'Sí', class:'btn-danger', fn:()=>{ closeModal(); onYes(); }}
  ]);
}
export function emptyState(icon, big, sub){
  const icons = {
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    inbox:'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
  };
  return `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icons[icon]||icons.calendar}</svg><div class="big">${esc(big)}</div><div class="small">${esc(sub)}</div></div>`;
}
