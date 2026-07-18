import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state } from './state.js';
import './prefs.js';
import './modal.js';
import './nav.js';
import './agenda.js';
import './patients.js';
import './waitlist.js';
import './requests.js';
import './stats.js';
import './config.js';
import './auth.js'; // engancha onAuthStateChanged; debe cargarse después de nav.js y data.js (import transitivo)
import { renderPublic } from './public.js';

// ---------- Boot ----------
// Marca del consultorio (nombre/especialidad/profesional): lectura pública,
// para poder mostrarla en la home y el formulario antes de loguearse.
function applyBranding(){
  const c = state.config || {};
  const brand = 'Turnos' + (c.specialty ? ' · '+c.specialty : '');
  document.title = brand;
  const t = document.getElementById('homeTitle'); if(t) t.textContent = brand;
  const lt = document.getElementById('loginTitle'); if(lt) lt.textContent = brand;
  const s = document.getElementById('homeSub');
  if(s) s.textContent = `${c.name || 'Consultorio'}${c.specialty?' de '+c.specialty:''}${c.doctorName?' — '+c.doctorName:''}. Solicite su turno online y nos pondremos en contacto por WhatsApp para coordinar día y horario.`;
}
async function loadPublicConfig(){
  try{
    const snap = await getDoc(doc(db,'config','consultorio'));
    if(snap.exists()) state.config = snap.data();
  }catch(_){ /* sin permisos o sin conexión: se muestran los valores por defecto */ }
  applyBranding();
}
if(new URLSearchParams(location.search).has('solicitar')){
  state.publicMode = true;
  loadPublicConfig().then(renderPublic);
} else {
  window.showGate('loading');
  loadPublicConfig();
}

// Service worker
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
