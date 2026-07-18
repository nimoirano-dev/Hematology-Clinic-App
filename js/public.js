import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state } from './state.js';
import { esc, toast } from './utils.js';

// ====================================================================
// PUBLIC REQUEST VIEW  (?solicitar)  — sin login
// ====================================================================
export async function renderPublic(){
  document.getElementById('gate').style.display='none';
  const v = document.getElementById('publicView'); v.style.display='block';
  v.innerHTML = `<div class="pub-wrap">
    <div class="pub-head">
      <div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>
      <h1>Solicitud de turno</h1>
      <p>${esc(state.config.name || 'Consultorio')}${state.config.specialty ? ' de '+esc(state.config.specialty) : ''}</p>
    </div>
    <div class="card pad" id="pubForm">
      <div class="notice" style="margin-bottom:4px"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>Esto es un <b>pedido de turno</b>, no un turno confirmado. El consultorio se comunicará con usted por WhatsApp para acordar día y horario. <b>Por favor no concurra hasta recibir la confirmación.</b></div></div>
      <label class="lbl">Nombre y apellido *</label><input id="r_nombre">
      <label class="lbl">DNI *</label><input id="r_dni" placeholder="12345678" inputmode="numeric">
      <div class="small muted" style="margin-top:4px">Usamos su DNI para reconocerlo si ya solicitó un turno antes, y evitar cargar sus datos dos veces.</div>
      <label class="lbl">Teléfono (WhatsApp) *</label><input id="r_tel" placeholder="+54 9 11...">
      <label class="lbl">Email</label><input type="email" id="r_email">
      <label class="lbl">Obra social</label><input id="r_os">
      <label class="lbl">Motivo de la consulta</label><textarea id="r_motivo" placeholder="Indique brevemente el motivo de la consulta…"></textarea>
      <label class="lbl">Preferencia de día/horario</label><input id="r_pref" placeholder="Ej: martes a la mañana">
      <button class="btn btn-primary btn-block" style="margin-top:18px" id="r_btn">Enviar solicitud</button>
      <div style="text-align:center;margin-top:14px"><a href="?" class="small">← Volver al inicio</a></div>
    </div>
  </div>`;
  document.getElementById('r_btn').addEventListener('click', async ()=>{
    const r_nombre=document.getElementById('r_nombre'), r_dni=document.getElementById('r_dni'), r_tel=document.getElementById('r_tel'),
          r_email=document.getElementById('r_email'), r_os=document.getElementById('r_os'),
          r_motivo=document.getElementById('r_motivo'), r_pref=document.getElementById('r_pref');
    const nombre=r_nombre.value.trim(), dni=r_dni.value.trim(), tel=r_tel.value.trim();
    if(!nombre || !dni || !tel){ toast('Completá nombre, DNI y teléfono','err'); return; }
    const btn=document.getElementById('r_btn'); btn.disabled=true; btn.textContent='Enviando…';
    try{
      await addDoc(collection(db,'requests'), { nombre, dni, telefono:tel, email:r_email.value.trim(), obraSocial:r_os.value.trim(), motivo:r_motivo.value.trim(), preferencia:r_pref.value.trim(), estado:'nuevo', createdAt:serverTimestamp() });
      document.getElementById('pubForm').innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="var(--ok)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><div class="big">¡Solicitud recibida!</div><div class="small">Su solicitud fue recibida. <b>Aún no tiene turno confirmado.</b> El consultorio se comunicará con usted por WhatsApp para acordar día y horario. Por favor no concurra hasta recibir esa confirmación. ¡Muchas gracias!</div></div>`;
    }catch(e){ toast('Error: '+e.code,'err'); btn.disabled=false; btn.textContent='Enviar solicitud'; }
  });
}
