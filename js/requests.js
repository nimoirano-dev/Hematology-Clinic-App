import { collection, doc, addDoc, updateDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state } from './state.js';
import { esc, initials, onlyDigits, toast } from './utils.js';
import { confirmDialog, emptyState } from './modal.js';

// Nombre de pila a partir de "Apellido, Nombre" o "Nombre Apellido" (duplicado liviano
// del helper de agenda.js para no crear una dependencia cruzada por una función de 3 líneas).
function firstName(full){
  if(!full) return '';
  const s = full.includes(',') ? full.split(',')[1] : full;
  return s.trim().split(/\s+/)[0] || '';
}

// ---------- Requests (solicitudes de pacientes) ----------
export function updateReqBadge(){
  const b = document.getElementById('reqBadge'); if(!b) return;
  if(state.requests.length){ b.style.display='inline-flex'; b.textContent=state.requests.length; }
  else b.style.display='none';
}
export function renderRequests(){
  const el = document.getElementById('reqList');
  if(!state.requests.length){ el.innerHTML = emptyState('inbox','Sin solicitudes pendientes','Los pedidos de turno de pacientes aparecen acá.'); return; }
  el.innerHTML = `
    <div class="notice" style="margin-bottom:14px"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <div>Esto son <b>pedidos</b>, NO turnos. El paciente <b>todavía no tiene turno confirmado</b>. Al "Agendar" se crea el paciente y se carga el turno; después avisale para que confirme.</div></div>
    <div class="card">`+state.requests.map(r=>`<div class="list-item">
    <div class="avatar">${initials(r.nombre)}</div>
    <div class="li-main">
      <div class="li-name">${esc(r.nombre)}</div>
      <div class="li-sub">${r.dni?'DNI '+esc(r.dni)+' · ':''}${r.telefono?esc(r.telefono):'sin teléfono'}${r.obraSocial?' · '+esc(r.obraSocial):''}${r.motivo?' · '+esc(r.motivo):''}${r.preferencia?' · prefiere: '+esc(r.preferencia):''}</div>
    </div>
    <div class="li-acts">
      ${r.telefono?`<button class="btn btn-sm btn-wa" title="Escribirle por WhatsApp para coordinar" onclick="contactReq('${r.id}')">WhatsApp</button>`:''}
      <button class="btn btn-sm btn-primary" onclick="acceptReq('${r.id}')">Agendar</button>
      <button class="btn btn-sm btn-ghost" onclick="rejectReq('${r.id}')">Descartar</button>
    </div>
  </div>`).join('')+`</div>`;
}
// Escribir al paciente para coordinar ANTES de cargar el turno (proponer día/hora).
window.contactReq = id=>{
  const r = state.requests.find(x=>x.id===id); if(!r || !r.telefono) return;
  const cons = state.config.name || 'el consultorio';
  const nombre = firstName(r.nombre);
  const msg = `Estimado/a${nombre?' '+nombre:''}: Le escribimos del ${cons} en relación a su solicitud de turno${r.motivo?` (${r.motivo})`:''}. Nos comunicamos para coordinar día y horario. ¿Le resulta conveniente...?`;
  window.open(`https://wa.me/${onlyDigits(r.telefono)}?text=${encodeURIComponent(msg)}`, '_blank');
};
window.acceptReq = async id=>{
  const r = state.requests.find(x=>x.id===id); if(!r) return;
  const parts = (r.nombre||'').trim().split(/\s+/);
  // El DNI es la clave estable para reconocer pacientes recurrentes: si dos
  // solicitudes traen el mismo DNI, son la misma persona aunque haya escrito
  // el nombre distinto cada vez (con o sin segundo nombre, mayúsculas, etc.).
  // Para solicitudes viejas sin DNI cargado, caemos al matching por nombre exacto.
  let ref = r.dni ? state.patients.find(p=>p.dni && p.dni.trim()===r.dni.trim()) : null;
  if(!ref && !r.dni){
    ref = state.patients.find(p=>`${p.nombre} ${p.apellido}`.toLowerCase().trim()===(r.nombre||'').toLowerCase().trim());
  }
  if(!ref){
    ref = await addDoc(collection(db,'patients'), { nombre:parts.slice(0,-1).join(' ')||parts[0]||r.nombre, apellido:parts.length>1?parts.slice(-1)[0]:'', dni:r.dni||'', telefono:r.telefono||'', email:r.email||'', obraSocial:r.obraSocial||'', notas:r.motivo?('Motivo solicitud: '+r.motivo):'', createdAt:serverTimestamp() });
  } else {
    // Paciente ya registrado: refrescamos los datos de contacto que haya vuelto a
    // mandar (sin pisar con vacío lo que ya tenía cargado), sin tocar notas clínicas.
    try{
      await updateDoc(doc(db,'patients',ref.id), {
        telefono: r.telefono||ref.telefono||'', email: r.email||ref.email||'', obraSocial: r.obraSocial||ref.obraSocial||'',
        updatedAt: serverTimestamp()
      });
    }catch(_){ /* no bloquea el flujo de agendar si esto falla */ }
  }
  window.go('agenda');
  window.openApptModalFor(ref.id);
  // marcamos el motivo en el modal y ligamos la solicitud (se confirma al GUARDAR, no antes)
  setTimeout(()=>{ const m=document.getElementById('m_motivo'); if(m && !m.value && r.motivo) m.value=r.motivo; },40);
  state.pendingReqId = id;
  toast('Asigná fecha y hora del turno','ok');
};
window.rejectReq = id=>{ confirmDialog('¿Descartar esta solicitud? (no se crea ningún turno)', async ()=>{ try{ await updateDoc(doc(db,'requests',id),{estado:'descartado'}); toast('Solicitud descartada','ok'); }catch(e){ toast('Error: '+e.code,'err'); } }); };
