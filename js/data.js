import { collection, doc, onSnapshot, query, where, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { state } from './state.js';
import { toast } from './utils.js';
import { renderAgenda } from './agenda.js';
import { renderPatients } from './patients.js';
import { renderWait } from './waitlist.js';
import { renderRequests, updateReqBadge } from './requests.js';
import { renderConfig, fillConfig, updateAccessBadge } from './config.js';
import { renderStats } from './stats.js';

// ---------- Firestore subscriptions ----------
export function subscribeAll(){
  state.unsub.push(onSnapshot(query(collection(db,'patients'), orderBy('apellido')), snap=>{
    state.patients = snap.docs.map(d=>({id:d.id,...d.data()}));
    if(state.activeSection==='pacientes') renderPatients();
    if(state.activeSection==='agenda') renderAgenda();
  }, errHandler));
  state.unsub.push(onSnapshot(query(collection(db,'appointments')), snap=>{
    state.appointments = snap.docs.map(d=>({id:d.id,...d.data()}));
    if(state.activeSection==='agenda') renderAgenda();
    if(state.activeSection==='stats') renderStats();
  }, errHandler));
  state.unsub.push(onSnapshot(query(collection(db,'waitlist'), orderBy('createdAt','desc')), snap=>{
    state.waitlist = snap.docs.map(d=>({id:d.id,...d.data()}));
    if(state.activeSection==='espera') renderWait();
  }, errHandler));
  if(state.role==='admin'){
    state.unsub.push(onSnapshot(query(collection(db,'requests'), where('estado','==','nuevo')), snap=>{
      state.requests = snap.docs.map(d=>({id:d.id,...d.data()}));
      updateReqBadge();
      if(state.activeSection==='solicitudes') renderRequests();
    }, errHandler));
    state.unsub.push(onSnapshot(collection(db,'staff'), snap=>{
      state.staff = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(state.activeSection==='config') renderConfig();
    }, errHandler));
    state.unsub.push(onSnapshot(query(collection(db,'accessRequests'), where('estado','==','pendiente')), snap=>{
      state.accessRequests = snap.docs.map(d=>({id:d.id,...d.data()}));
      updateAccessBadge();
      if(state.activeSection==='config') renderConfig();
    }, errHandler));
    state.unsub.push(onSnapshot(doc(db,'config','consultorio'), snap=>{
      state.config = snap.exists()?snap.data():{};
      if(state.activeSection==='config') fillConfig();
    }, errHandler));
  }
}
function errHandler(e){ console.error(e); toast('Error de conexión: '+e.code, 'err'); }
