import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state } from './state.js';
import { esc, initials, parseYmd, fmtDateLong, todayYmd, toast } from './utils.js';
import { modal, closeModal, confirmDialog, emptyState } from './modal.js';

// ---------- Patients ----------
export function renderPatients(){
  const q = (document.getElementById('patSearch')?.value||'').toLowerCase().trim();
  let list = state.patients;
  if(q) list = list.filter(p=>`${p.nombre} ${p.apellido} ${p.dni} ${p.obraSocial}`.toLowerCase().includes(q));
  document.getElementById('patCount').textContent = `${state.patients.length} paciente(s)`;
  const el = document.getElementById('patList');
  if(!list.length){ el.innerHTML = emptyState('users', q?'Sin resultados':'Sin pacientes', q?'Probá otra búsqueda.':'Agregá tu primer paciente.'); return; }
  el.innerHTML = list.map(p=>{
    const next = state.appointments.filter(a=>a.patientId===p.id && a.fecha>=todayYmd() && a.estado!=='cancelado').sort((x,y)=>(x.fecha+x.hora).localeCompare(y.fecha+y.hora))[0];
    return `<div class="list-item">
      <div class="avatar">${initials(p.nombre+' '+p.apellido)}</div>
      <div class="li-main" onclick="openPatientDetail('${p.id}')" style="cursor:pointer">
        <div class="li-name">${esc(p.apellido)}, ${esc(p.nombre)}</div>
        <div class="li-sub">${p.dni?'DNI '+esc(p.dni):'sin DNI'}${p.obraSocial?' · '+esc(p.obraSocial):''}${next?' · próx: '+fmtDateLong(next.fecha)+' '+esc(next.hora):''}</div>
      </div>
      <div class="li-acts">
        <button class="btn btn-sm" onclick="openApptModalFor('${p.id}')">Turno</button>
        <button class="btn btn-sm btn-ghost" onclick="openPatientModal('${p.id}')">Editar</button>
      </div>
    </div>`;
  }).join('');
}
window.renderPatients = renderPatients;
window.openApptModalFor = pid=>{ window.openApptModal(); setTimeout(()=>{ const s=document.getElementById('m_pat'); if(s) s.value=pid; },30); };

window.openPatientModal = (id=null)=>{
  const p = id ? state.patients.find(x=>x.id===id) : null;
  modal(p?'Editar paciente':'Nuevo paciente', `
    <div class="field-grid">
      <div><label class="lbl">Nombre</label><input id="p_nombre" value="${p?esc(p.nombre):''}"></div>
      <div><label class="lbl">Apellido</label><input id="p_apellido" value="${p?esc(p.apellido):''}"></div>
      <div><label class="lbl">DNI</label><input id="p_dni" value="${p?esc(p.dni):''}"></div>
      <div><label class="lbl">Fecha nac.</label><input type="date" id="p_nac" value="${p?esc(p.nacimiento):''}"></div>
      <div><label class="lbl">Teléfono</label><input id="p_tel" value="${p?esc(p.telefono):''}" placeholder="+54 9 11..."></div>
      <div><label class="lbl">Email</label><input type="email" id="p_email" value="${p?esc(p.email):''}"></div>
      <div><label class="lbl">Obra social</label><input id="p_os" value="${p?esc(p.obraSocial):''}"></div>
      <div><label class="lbl">N° afiliado</label><input id="p_afil" value="${p?esc(p.afiliado):''}"></div>
    </div>
    <label class="lbl">Notas clínicas</label>
    <textarea id="p_notas" placeholder="Diagnóstico, medicación, observaciones…">${p?esc(p.notas):''}</textarea>
  `, [
    ...(p?[{label:'Eliminar', class:'btn-danger', fn:()=>delPatient(id)}]:[]),
    {label:'Cancelar', class:'btn-ghost', fn:closeModal},
    {label:'Guardar', class:'btn-primary', fn:()=>savePatient(id)}
  ]);
};
async function savePatient(id){
  const data = {
    nombre: document.getElementById('p_nombre').value.trim(), apellido: document.getElementById('p_apellido').value.trim(),
    dni: document.getElementById('p_dni').value.trim(), nacimiento: document.getElementById('p_nac').value,
    telefono: document.getElementById('p_tel').value.trim(),
    email: document.getElementById('p_email').value.trim(), obraSocial: document.getElementById('p_os').value.trim(),
    afiliado: document.getElementById('p_afil').value.trim(),
    notas: document.getElementById('p_notas').value.trim(), updatedAt: serverTimestamp()
  };
  if(!data.nombre || !data.apellido){ toast('Nombre y apellido son obligatorios','err'); return; }
  if(!id && data.dni){
    const dup = state.patients.find(p=>p.dni && p.dni.trim()===data.dni);
    if(dup){ toast(`Ya existe un paciente con ese DNI: ${dup.apellido}, ${dup.nombre}`,'err'); return; }
  }
  try{
    if(id) await updateDoc(doc(db,'patients',id), data);
    else { data.createdAt=serverTimestamp(); await addDoc(collection(db,'patients'), data); }
    toast('Paciente guardado','ok'); closeModal();
  }catch(e){ toast('Error: '+e.code,'err'); }
}
window.delPatient = id=>{
  confirmDialog('¿Eliminar este paciente? Sus turnos NO se borran.', async ()=>{
    try{ await deleteDoc(doc(db,'patients',id)); toast('Paciente eliminado','ok'); closeModal(); }
    catch(e){ toast('Error: '+e.code,'err'); }
  });
};
window.openPatientDetail = id=>{
  const p = state.patients.find(x=>x.id===id); if(!p) return;
  const appts = state.appointments.filter(a=>a.patientId===id).sort((x,y)=>(y.fecha+y.hora).localeCompare(x.fecha+x.hora));
  const age = p.nacimiento ? Math.floor((Date.now()-parseYmd(p.nacimiento))/3.15576e10)+' años' : '';
  modal(`${p.apellido}, ${p.nombre}`, `
    <div class="small muted" style="margin-bottom:14px">
      ${p.dni?'DNI '+esc(p.dni):''}${age?' · '+age:''}${p.telefono?' · '+esc(p.telefono):''}<br>
      ${p.obraSocial?esc(p.obraSocial)+(p.afiliado?' #'+esc(p.afiliado):''):''}
    </div>
    ${p.notas?`<div class="card pad" style="background:var(--surface2);margin-bottom:14px"><b class="small">Notas clínicas</b><div class="small" style="margin-top:4px;white-space:pre-wrap">${esc(p.notas)}</div></div>`:''}
    <label class="lbl">Historial de turnos (${appts.length})</label>
    ${appts.length?appts.map(a=>`<div class="list-item" style="padding:10px 0"><div class="li-main"><div class="li-name small">${fmtDateLong(a.fecha)} · ${esc(a.hora)}</div><div class="li-sub">${a.motivo?esc(a.motivo)+' · ':''}<span class="chip ${a.estado}">${a.estado}</span></div></div></div>`).join(''):'<div class="small muted">Sin turnos registrados.</div>'}
  `, [
    {label:'Editar', class:'btn-ghost', fn:()=>{closeModal();window.openPatientModal(id);}},
    {label:'Nuevo turno', class:'btn-primary', fn:()=>{closeModal();window.openApptModalFor(id);}}
  ]);
};
