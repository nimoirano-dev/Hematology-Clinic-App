import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state } from './state.js';
import { esc, initials, toast } from './utils.js';
import { confirmDialog } from './modal.js';

// ---------- Config ----------
export function renderConfig(){ fillConfig(); renderStaff(); renderAccessRequests(); }
export function fillConfig(){
  document.getElementById('cfgName').value=state.config.name||'';
  document.getElementById('cfgSpecialty').value=state.config.specialty||'';
  document.getElementById('cfgDoctor').value=state.config.doctorName||'';
  document.getElementById('cfgAddr').value=state.config.address||'';
  document.getElementById('cfgPhone').value=state.config.phone||'';
}
window.saveConfig = async ()=>{
  try{
    await setDoc(doc(db,'config','consultorio'), {
      name:document.getElementById('cfgName').value.trim(),
      specialty:document.getElementById('cfgSpecialty').value.trim(),
      doctorName:document.getElementById('cfgDoctor').value.trim(),
      address:document.getElementById('cfgAddr').value.trim(),
      phone:document.getElementById('cfgPhone').value.trim()
    }, {merge:true});
    toast('Configuración guardada','ok');
  }catch(e){ toast('Error: '+e.code,'err'); }
};
function renderStaff(){
  const el = document.getElementById('staffList');
  if(!state.staff.length){ el.innerHTML='<div class="small muted">Sin registros en <code>staff</code> todavía.</div>'; return; }
  el.innerHTML = state.staff.map(s=>`<div class="list-item" style="padding:10px 0"><div class="li-main"><div class="li-name small">${esc(s.email||s.id)}</div><div class="li-sub">uid: ${esc(s.id)}</div></div><span class="role-chip">${esc(s.role||'admin')}</span></div>`).join('');
}

// ---------- Solicitudes de acceso al personal ----------
export function updateAccessBadge(){
  const b = document.getElementById('accessBadge'); if(!b) return;
  if(state.accessRequests.length){ b.style.display='inline-flex'; b.textContent=state.accessRequests.length; }
  else b.style.display='none';
}
function renderAccessRequests(){
  const el = document.getElementById('accessReqList'); if(!el) return;
  if(!state.accessRequests.length){ el.innerHTML = '<div class="small muted">Sin solicitudes de acceso pendientes.</div>'; return; }
  el.innerHTML = state.accessRequests.map(r=>`<div class="list-item" style="flex-wrap:wrap">
    <div class="avatar">${initials(r.nombre)}</div>
    <div class="li-main">
      <div class="li-name">${esc(r.nombre)}</div>
      <div class="li-sub">${esc(r.email)}${r.motivo?' · '+esc(r.motivo):''}</div>
    </div>
    <div class="li-acts">
      <select id="arole_${r.id}" style="width:auto">
        <option value="admin">admin</option>
        <option value="doctor">doctor</option>
      </select>
      <button class="btn btn-sm btn-primary" onclick="approveAccessRequest('${r.id}')">Aprobar</button>
      <button class="btn btn-sm btn-ghost" onclick="rejectAccessRequest('${r.id}')">Rechazar</button>
    </div>
  </div>`).join('');
}
window.approveAccessRequest = async id=>{
  const r = state.accessRequests.find(x=>x.id===id); if(!r) return;
  const role = document.getElementById('arole_'+id)?.value || 'admin';
  try{
    await setDoc(doc(db,'staff',id), { email:r.email, role }, {merge:true});
    await updateDoc(doc(db,'accessRequests',id), { estado:'aprobado' });
    toast('Acceso aprobado','ok');
  }catch(e){ toast('Error: '+e.code,'err'); }
};
window.rejectAccessRequest = id=>{
  confirmDialog('¿Rechazar esta solicitud de acceso?', async ()=>{
    try{ await updateDoc(doc(db,'accessRequests',id), { estado:'rechazado' }); toast('Solicitud rechazada','ok'); }
    catch(e){ toast('Error: '+e.code,'err'); }
  });
};
