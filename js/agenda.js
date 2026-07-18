import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state, userStamp } from './state.js';
import { ymd, parseYmd, esc, fmtDateLong, todayYmd, onlyDigits, toast } from './utils.js';
import { modal, closeModal, confirmDialog } from './modal.js';

// ---------- Atajos de teclado (solo en Agenda, fuera de inputs/modal) ----------
document.addEventListener('keydown', e=>{
  if(state.publicMode) return;
  if(document.getElementById('modalBg').classList.contains('open')) return;
  const tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select') return;
  if(state.activeSection!=='agenda') return;
  if(e.key==='ArrowLeft') shiftDay(-1);
  else if(e.key==='ArrowRight') shiftDay(1);
  else if(e.key==='t'||e.key==='T') goToday();
  else if(e.key==='n'||e.key==='N') openApptModal();
});

// ---------- Agenda ----------
const CAL_H = 60;
const CAL_START = 7;
const CAL_END   = 20;
const MON_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DOW_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function getDays(){
  const n={day:1,'3day':3,week:7}[state.agendaView]||1;
  let start=state.agendaDate;
  if(state.agendaView==='week'){
    const d=parseYmd(state.agendaDate), dow=d.getDay();
    d.setDate(d.getDate()-(dow===0?6:dow-1));
    start=ymd(d);
  }
  const s=parseYmd(start);
  return Array.from({length:n},(_,i)=>{ const d=new Date(s); d.setDate(d.getDate()+i); return ymd(d); });
}
function agendaRangeLabel(){
  const days=getDays();
  if(days.length===1) return fmtDateLong(days[0]);
  const d1=parseYmd(days[0]), d2=parseYmd(days[days.length-1]);
  return d1.getMonth()===d2.getMonth()
    ? `${d1.getDate()}–${d2.getDate()} ${MON_SHORT[d1.getMonth()]} ${d1.getFullYear()}`
    : `${d1.getDate()} ${MON_SHORT[d1.getMonth()]} – ${d2.getDate()} ${MON_SHORT[d2.getMonth()]}`;
}
window.shiftDay = delta=>{
  const n={day:1,'3day':3,week:7}[state.agendaView]||1;
  const d=parseYmd(state.agendaDate); d.setDate(d.getDate()+delta*n);
  state.agendaDate=ymd(d); renderAgenda();
};
window.goToday  = ()=>{ state.agendaDate=todayYmd(); renderAgenda(); };
window.pickDate = v=>{ if(v){ state.agendaDate=v; renderAgenda(); } };
window.setView  = v=>{ state.agendaView=v; renderAgenda(); };
function shiftDay(d){ window.shiftDay(d); }
function goToday(){ window.goToday(); }

export function renderAgenda(){
  document.getElementById('agendaDate').textContent = agendaRangeLabel();
  document.getElementById('agendaPicker').value = state.agendaDate;
  document.querySelectorAll('#viewToggle button').forEach(b=>
    b.classList.toggle('active', b.dataset.view===state.agendaView));
  const days=getDays();
  const allAppts=state.appointments.filter(a=>days.includes(a.fecha)&&a.estado!=='cancelado');
  const sinAvisar=allAppts.filter(a=>apptVivo(a)&&!a.avisoEnviado);
  document.getElementById('dayStats').innerHTML=`
    <div class="dstat"><div class="n">${allAppts.length}</div><div class="l">Turnos</div></div>
    <div class="dstat"><div class="n">${allAppts.filter(a=>a.estado==='confirmado').length}</div><div class="l">Confirm.</div></div>
    <div class="dstat" ${sinAvisar.length?'style="border-color:#f0c4c4;background:var(--danger-bg)"':''}><div class="n" ${sinAvisar.length?'style="color:var(--danger)"':''}>${sinAvisar.length}</div><div class="l">Sin avisar</div></div>`;
  const el=document.getElementById('agendaList');
  const banner=sinAvisar.length
    ?`<div class="alert-banner" style="margin-bottom:12px"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${sinAvisar.length} turno(s) sin avisar — hacé clic en el evento y usá los botones de WhatsApp.</div>`:''
  el.innerHTML=banner+calendarHTML(days);
  const scroll=el.querySelector('.cal-scroll');
  if(scroll){ const now=new Date(),h=now.getHours(); scroll.scrollTop=Math.max(0,(h>=CAL_START&&h<CAL_END?(h-CAL_START)*CAL_H-60:CAL_H)); }
}

function calendarHTML(days){
  const totalH=(CAL_END-CAL_START)*CAL_H;
  const hours=Array.from({length:CAL_END-CAL_START},(_,i)=>CAL_START+i);
  const today=todayYmd(), now=new Date();
  const headCols=days.map(date=>{
    const d=parseYmd(date),isToday=date===today;
    return `<div class="cal-day-head${isToday?' today':''}" onclick="state.agendaDate='${date}';setView('day')">
      <div class="dow">${DOW_SHORT[d.getDay()]}</div>
      <div class="dom">${d.getDate()}</div>
      <div class="mon">${MON_SHORT[d.getMonth()]}</div>
    </div>`;
  }).join('');
  const timesHTML=hours.map(h=>`<div class="cal-time-lbl" style="top:${(h-CAL_START)*CAL_H}px">${String(h).padStart(2,'0')}:00</div>`).join('');
  const dayCols=days.map(date=>{
    const appts=state.appointments.filter(a=>a.fecha===date&&a.estado!=='cancelado').sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));
    const lines=hours.map(h=>`<div class="cal-hour-line" style="top:${(h-CAL_START)*CAL_H}px"></div><div class="cal-hour-line half" style="top:${(h-CAL_START)*CAL_H+CAL_H/2}px"></div>`).join('');
    let nowLine='';
    if(date===today){ const mins=(now.getHours()-CAL_START)*60+now.getMinutes(); if(mins>=0&&mins<=(CAL_END-CAL_START)*60) nowLine=`<div class="cal-now-line" style="top:${mins}px"></div>`; }
    const events=appts.map(a=>{
      const [hh,mm]=(a.hora||'08:00').split(':').map(Number);
      if(hh<CAL_START||hh>=CAL_END) return '';
      const top=(hh-CAL_START)*60+mm, height=Math.max(a.duracion||30,24);
      const sinAv=apptVivo(a)&&!a.avisoEnviado, short=height<38;
      const apellido=(a.patientName||'Paciente').split(',')[0].trim();
      return `<div class="cal-event estado-${a.estado||'pendiente'}${sinAv?' sinavisar':''}"
        style="top:${top}px;height:${height}px"
        title="${esc(a.patientName||'')} · ${esc(a.hora)}${sinAv?' · ⚠ sin avisar':''} · arrastrá para reprogramar"
        draggable="true"
        ondragstart="calDragStart(event,'${a.id}')"
        onclick="event.stopPropagation();openApptModal('${a.id}')">
        <div class="cal-event-time">${esc(a.hora)}${sinAv?' ⚠':''}</div>
        ${!short?`<div class="cal-event-name">${esc(apellido)}</div>`:''}
        ${!short&&a.motivo?`<div class="cal-event-mot">${esc(a.motivo)}</div>`:''}
      </div>`;
    }).join('');
    return `<div class="cal-day-col" style="height:${totalH}px" onclick="calNewAppt(event,'${date}')" ondragover="event.preventDefault()" ondrop="calDrop(event,'${date}')">${lines}${nowLine}${events}</div>`;
  }).join('');
  return `<div class="cal-outer"><div class="cal-head"><div class="cal-corner"></div><div class="cal-days-head">${headCols}</div></div><div class="cal-scroll"><div class="cal-inner"><div class="cal-times-col" style="height:${totalH}px">${timesHTML}</div><div class="cal-days-body">${dayCols}</div></div></div></div>`;
}

window.calNewAppt=(e,date)=>{
  if(e.target.closest('.cal-event')) return;
  const col=e.currentTarget, rect=col.getBoundingClientRect();
  const scrollTop=col.closest('.cal-scroll')?.scrollTop||0;
  const y=e.clientY-rect.top+scrollTop;
  const clampedMins=Math.max(0,Math.min(Math.round(y/15)*15,(CAL_END-CAL_START)*60-30));
  const hh=CAL_START+Math.floor(clampedMins/60), mm=clampedMins%60;
  const hora=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  state.agendaDate=date; openApptModal();
  setTimeout(()=>{ const f=document.getElementById('m_fecha'); if(f) f.value=date; const h=document.getElementById('m_hora'); if(h) h.value=hora; },40);
};
// ---------- Drag & drop: reprogramar turno arrastrando el evento ----------
let dragApptId = null;
window.calDragStart = (e,id)=>{ dragApptId = id; e.dataTransfer.effectAllowed = 'move'; };
window.calDrop = async (e,date)=>{
  e.preventDefault();
  if(!dragApptId) return;
  const id = dragApptId; dragApptId = null;
  const col = e.currentTarget, rect = col.getBoundingClientRect();
  const scrollTop = col.closest('.cal-scroll')?.scrollTop || 0;
  const y = e.clientY - rect.top + scrollTop;
  const clampedMins = Math.max(0, Math.min(Math.round(y/15)*15, (CAL_END-CAL_START)*60-15));
  const hh = CAL_START + Math.floor(clampedMins/60), mm = clampedMins%60;
  const hora = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  try{
    await updateDoc(doc(db,'appointments',id), { fecha: date, hora, updatedAt: serverTimestamp(), updatedBy: userStamp() });
    toast(`Turno reprogramado a ${fmtDateLong(date)} ${hora}`, 'ok');
  }catch(err){ toast('Error: '+err.code, 'err'); }
};

// ---------- Imprimir / exportar agenda ----------
window.printAgenda = ()=>{
  const days = getDays();
  const appts = state.appointments.filter(a=>days.includes(a.fecha)&&a.estado!=='cancelado')
    .sort((x,y)=>(x.fecha+x.hora).localeCompare(y.fecha+y.hora));
  const rows = appts.map(a=>`<tr><td>${esc(fmtDateLong(a.fecha))}</td><td>${esc(a.hora||'')}</td><td>${esc(a.patientName||'')}</td><td>${esc(a.motivo||'')}</td><td>${esc(a.estado||'pendiente')}</td><td>${esc(a.telefono||'')}</td></tr>`).join('');
  document.getElementById('printArea').innerHTML = `
    <h2>Agenda · ${esc(agendaRangeLabel())}</h2>
    <table class="print-table">
      <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Motivo</th><th>Estado</th><th>Teléfono</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">Sin turnos en este rango.</td></tr>'}</tbody>
    </table>`;
  window.print();
};

// ¿el turno todavía "necesita" comunicación? (no cancelado/atendido/ausente)
function apptVivo(a){ return !['cancelado','atendido','ausente'].includes(a.estado); }

// ---------- Comunicación con el paciente (WhatsApp) ----------
// Nombre de pila a partir de "Apellido, Nombre" o "Nombre Apellido".
function firstName(full){
  if(!full) return '';
  const s = full.includes(',') ? full.split(',')[1] : full;
  return s.trim().split(/\s+/)[0] || '';
}
const RCTA_LINK = 'https://app.rcta.me/patients/a7ab3758f5dffb512013ea662403e9ac7a30acdd';

function apptMessage(a, kind){
  const cons = state.config.name || 'el consultorio';
  const addr = state.config.address ? ` (${state.config.address})` : '';
  const nombre = firstName(a.patientName);
  const saludo = `Estimado/a${nombre?' '+nombre:''}:`;
  const cuando = `el ${fmtDateLong(a.fecha)} a las ${a.hora} hs`;
  const mot = a.motivo ? ` Motivo: ${a.motivo}.` : '';
  if(kind==='aviso')
    return `${saludo} Le escribimos del ${cons}${addr}. Su turno ha sido AGENDADO para ${cuando}.${mot} Por favor, responda este mensaje para CONFIRMAR su asistencia. En caso de no poder concurrir, comuníquese con nosotros para reprogramarlo. ¡Muchas gracias!`;
  if(kind==='rcta')
    return `${saludo} Le escribimos del ${cons}. Para que la Dra. pueda emitir recetas y gestionar su historia clínica, le pedimos que complete sus datos en el siguiente enlace:\n\n${RCTA_LINK}\n\nEs un trámite de pocos minutos. Muchas gracias.`;
  return `${saludo} Le recordamos su turno en el ${cons}${addr} ${cuando}.${mot} En caso de no poder asistir, le pedimos que nos avise con anticipación. ¡Muchas gracias!`;
}
// Abre WhatsApp con el mensaje correcto y marca el turno como avisado.
// Acepta un id (busca en state) o directamente el objeto del turno (evita races
// justo después de crearlo, cuando el listener aún no actualizó state.appointments).
window.notifyAppt = async appt=>{
  const a = (typeof appt === 'string') ? state.appointments.find(x=>x.id===appt) : appt;
  if(!a){ toast('No se encontró el turno','err'); return; }
  if(!a.telefono){ toast('El paciente no tiene teléfono cargado','err'); return; }
  const kind = a.avisoEnviado ? 'recordatorio' : 'aviso';
  window.open(`https://wa.me/${onlyDigits(a.telefono)}?text=${encodeURIComponent(apptMessage(a,kind))}`, '_blank');
  if(!a.avisoEnviado){
    try{ await updateDoc(doc(db,'appointments',a.id), { avisoEnviado: serverTimestamp() }); toast('Marcado como avisado','ok'); }
    catch(e){ toast('Se abrió WhatsApp, pero no se pudo marcar: '+e.code,'err'); }
  }
};

// Envía el link del formulario RCTA al paciente por WhatsApp.
window.sendRcta = id=>{
  const a = state.appointments.find(x=>x.id===id);
  if(!a){ toast('No se encontró el turno','err'); return; }
  if(!a.telefono){ toast('El paciente no tiene teléfono cargado','err'); return; }
  window.open(`https://wa.me/${onlyDigits(a.telefono)}?text=${encodeURIComponent(apptMessage(a,'rcta'))}`, '_blank');
};

// ---------- Appointment modal ----------
window.openApptModal = (id=null)=>{
  state.pendingReqId = null; // por defecto el alta no está ligada a una solicitud
  const a = id ? state.appointments.find(x=>x.id===id) : null;
  const patOpts = state.patients.map(p=>`<option value="${p.id}" ${a&&a.patientId===p.id?'selected':''}>${esc(p.apellido)}, ${esc(p.nombre)} ${p.dni?'· '+esc(p.dni):''}</option>`).join('');
  modal(a?'Editar turno':'Nuevo turno', `
    <label class="lbl">Paciente</label>
    <select id="m_pat"><option value="">— Seleccionar —</option>${patOpts}</select>
    <div class="small muted" style="margin-top:6px">¿No está en la lista? <a href="#" onclick="closeModal();openPatientModal();return false">Crear paciente</a></div>
    <div class="field-grid">
      <div><label class="lbl">Fecha</label><input type="date" id="m_fecha" value="${a?a.fecha:state.agendaDate}"></div>
      <div><label class="lbl">Hora</label><input type="time" id="m_hora" value="${a?esc(a.hora):'09:00'}"></div>
      <div><label class="lbl">Duración (min)</label><input type="number" id="m_dur" value="${a?a.duracion||30:30}" step="5" min="5"></div>
      <div><label class="lbl">Estado</label><select id="m_estado">
        ${['pendiente','confirmado','atendido','ausente','cancelado'].map(s=>`<option ${a&&a.estado===s?'selected':''}>${s}</option>`).join('')}
      </select></div>
    </div>
    <label class="lbl">Motivo</label>
    <input type="text" id="m_motivo" value="${a?esc(a.motivo):''}" placeholder="Control, hemograma, primera consulta…">
    <label class="lbl">Notas</label>
    <textarea id="m_notas" placeholder="Observaciones internas…">${a?esc(a.notas):''}</textarea>
    ${a&&(a.createdBy?.email||a.updatedBy?.email)?`<div class="small muted" style="margin-top:12px">${a.createdBy?.email?`Creado por ${esc(a.createdBy.email)}`:''}${a.updatedBy?.email&&a.updatedBy.email!==a.createdBy?.email?`${a.createdBy?.email?' · ':''}Última edición: ${esc(a.updatedBy.email)}`:''}</div>`:''}
    ${a&&a.telefono?`<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-wa btn-sm" onclick="notifyAppt('${a.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> ${a.avisoEnviado?'Recordatorio':'Avisar'} por WhatsApp</button>
      <button class="btn btn-ghost btn-sm" onclick="sendRcta('${a.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Enviar formulario RCTA</button>
    </div>`:''}
  `, [
    {label:'Cancelar', class:'btn-ghost', fn:closeModal},
    {label: a?'Guardar':'Crear turno', class:'btn-primary', fn:()=>saveAppt(id)}
  ]);
};
async function saveAppt(id){
  const patId = document.getElementById('m_pat').value;
  if(!patId){ toast('Elegí un paciente','err'); return; }
  const m_fecha=document.getElementById('m_fecha'), m_hora=document.getElementById('m_hora');
  if(!m_fecha.value || !m_hora.value){ toast('Completá fecha y hora','err'); return; }
  const p = state.patients.find(x=>x.id===patId);
  const data = {
    patientId: patId,
    patientName: p ? `${p.apellido}, ${p.nombre}` : '',
    telefono: p?.telefono||'', obraSocial: p?.obraSocial||'',
    fecha: m_fecha.value, hora: m_hora.value,
    duracion: Number(document.getElementById('m_dur').value)||30,
    estado: document.getElementById('m_estado').value,
    motivo: document.getElementById('m_motivo').value.trim(),
    notas: document.getElementById('m_notas').value.trim(),
    updatedAt: serverTimestamp(), updatedBy: userStamp()
  };
  const reqId = state.pendingReqId; // solicitud que estamos agendando (si aplica)
  try{
    if(id){
      await updateDoc(doc(db,'appointments',id), data); toast('Turno actualizado','ok');
      closeModal();
    } else {
      data.createdAt=serverTimestamp(); data.createdBy=userStamp();
      if(reqId) data.requestId = reqId;
      const ref = await addDoc(collection(db,'appointments'), data);
      // Recién ahora que el turno EXISTE marcamos la solicitud como agendada.
      if(reqId){ try{ await updateDoc(doc(db,'requests',reqId), { estado:'agendado' }); }catch(_){} }
      state.pendingReqId = null;
      // Cerramos el alta y forzamos el paso de avisar al paciente.
      const newAppt = { id:ref.id, ...data };
      if(data.telefono) promptAviso(newAppt);
      else { closeModal(); toast('Turno creado · ⚠ sin teléfono para avisar','err'); }
    }
  }catch(e){ toast('Error: '+e.code,'err'); }
}
// Tras crear un turno, paso obligado: avisar al paciente.
function promptAviso(a){
  modal('Turno creado · avisar al paciente', `
    <div class="notice info"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <div>El turno quedó cargado pero <b>el paciente aún no fue notificado</b>. Envíele el aviso por WhatsApp para que confirme su asistencia. Hasta entonces figurará como <b>"sin avisar"</b> en la agenda.</div></div>
    <div class="card pad" style="background:var(--surface2);margin-top:14px">
      <div class="small muted" style="margin-bottom:4px">Vista previa del mensaje</div>
      <div class="small">${esc(apptMessage(a,'aviso'))}</div>
    </div>
  `, [
    {label:'Avisar después', class:'btn-ghost', fn:()=>{ closeModal(); toast('Turno creado · pendiente de avisar','err'); }},
    {label:'Avisar por WhatsApp', class:'btn-wa', fn:()=>{ closeModal(); window.notifyAppt(a); }}
  ]);
}
window.delAppt = id=>{
  confirmDialog('¿Eliminar este turno?', async ()=>{
    try{ await deleteDoc(doc(db,'appointments',id)); toast('Turno eliminado','ok'); }
    catch(e){ toast('Error: '+e.code,'err'); }
  });
};
