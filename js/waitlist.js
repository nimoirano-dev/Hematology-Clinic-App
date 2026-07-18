import { collection, doc, addDoc, deleteDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state } from './state.js';
import { esc, initials, toast } from './utils.js';
import { modal, closeModal, confirmDialog, emptyState } from './modal.js';

// ---------- Waiting list ----------
export function renderWait(){
  const el = document.getElementById('waitList');
  if(!state.waitlist.length){ el.innerHTML = emptyState('clock','Lista vacía','Sin pacientes en espera.'); return; }
  el.innerHTML = state.waitlist.map(w=>`<div class="list-item">
    <div class="avatar">${initials(w.nombre)}</div>
    <div class="li-main">
      <div class="li-name">${esc(w.nombre)} ${w.prioridad==='urgente'?'<span class="chip ausente">urgente</span>':''}</div>
      <div class="li-sub">${w.telefono?esc(w.telefono):''}${w.motivo?' · '+esc(w.motivo):''}</div>
    </div>
    <div class="li-acts">
      <button class="btn btn-sm btn-primary" onclick="waitToAppt('${w.id}')">Dar turno</button>
      <button class="btn btn-sm btn-ghost" onclick="delWait('${w.id}')">Quitar</button>
    </div>
  </div>`).join('');
}
window.openWaitModal = ()=>{
  modal('Agregar a lista de espera', `
    <label class="lbl">Nombre completo</label><input id="w_nombre">
    <label class="lbl">Teléfono</label><input id="w_tel" placeholder="+54 9 11...">
    <label class="lbl">Motivo</label><input id="w_motivo" placeholder="Control, derivación…">
    <label class="lbl">Prioridad</label>
    <select id="w_prio"><option value="normal">Normal</option><option value="urgente">Urgente</option></select>
  `, [
    {label:'Cancelar', class:'btn-ghost', fn:closeModal},
    {label:'Agregar', class:'btn-primary', fn:saveWait}
  ]);
};
async function saveWait(){
  const w_nombre=document.getElementById('w_nombre'), w_tel=document.getElementById('w_tel'),
        w_motivo=document.getElementById('w_motivo'), w_prio=document.getElementById('w_prio');
  if(!w_nombre.value.trim()){ toast('Falta el nombre','err'); return; }
  try{
    await addDoc(collection(db,'waitlist'), { nombre:w_nombre.value.trim(), telefono:w_tel.value.trim(), motivo:w_motivo.value.trim(), prioridad:w_prio.value, createdAt:serverTimestamp() });
    toast('Agregado a la lista','ok'); closeModal();
  }catch(e){ toast('Error: '+e.code,'err'); }
}
window.delWait = id=>{ confirmDialog('¿Quitar de la lista de espera?', async ()=>{ try{ await deleteDoc(doc(db,'waitlist',id)); toast('Quitado','ok'); }catch(e){ toast('Error: '+e.code,'err'); } }); };
window.waitToAppt = async id=>{
  const w = state.waitlist.find(x=>x.id===id); if(!w) return;
  // crear paciente si no existe (match por nombre simple), luego abrir turno
  let p = state.patients.find(x=>`${x.nombre} ${x.apellido}`.toLowerCase()===w.nombre.toLowerCase());
  if(!p){
    const parts = w.nombre.trim().split(/\s+/);
    const ref = await addDoc(collection(db,'patients'), { nombre:parts.slice(0,-1).join(' ')||parts[0], apellido:parts.length>1?parts.slice(-1)[0]:'', telefono:w.telefono||'', notas:'', createdAt:serverTimestamp() });
    p = {id:ref.id};
  }
  await deleteDoc(doc(db,'waitlist',id));
  window.go('agenda'); window.openApptModalFor(p.id);
  toast('Asigná fecha y hora','ok');
};
