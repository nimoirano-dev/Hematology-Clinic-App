import { getDoc, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, sendPasswordResetEmail }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, db } from './firebase.js';
import { state } from './state.js';
import { esc, toast } from './utils.js';
import { modal, closeModal } from './modal.js';
import { buildNav } from './nav.js';
import { subscribeAll } from './data.js';

// ---------- Auth ----------
document.getElementById('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const btn=document.getElementById('loginBtn'), err=document.getElementById('loginErr');
  const loginEmail=document.getElementById('loginEmail'), loginPass=document.getElementById('loginPass');
  btn.disabled=true; btn.textContent='Ingresando…'; err.classList.remove('show');
  try{
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPass.value);
  }catch(ex){
    err.textContent = ex.code==='auth/invalid-credential' ? 'Email o contraseña incorrectos.' : 'Error: '+ex.code;
    err.classList.add('show'); btn.disabled=false; btn.textContent='Ingresar';
  }
});
window.doSignOut = ()=>signOut(auth);
document.getElementById('logoutBtn').addEventListener('click', window.doSignOut);

onAuthStateChanged(auth, async user=>{
  if(state.publicMode) return; // en modo solicitud pública ignoramos el login del personal
  state.unsub.forEach(u=>u()); state.unsub=[];
  if(!user){ window.showGate('home'); return; }
  // resolver rol: solo cuenta si existe un documento en staff/{uid}
  let role = null;
  try{
    const sd = await getDoc(doc(db,'staff',user.uid));
    if(sd.exists()) role = sd.data().role || 'admin';
  }catch(_){ /* sin doc en staff todavía: las reglas rechazan la lectura */ }
  if(!role){
    // no es (todavía) personal: mostrar el estado de su solicitud de acceso, si tiene una
    let reqData = null;
    try{ const rq = await getDoc(doc(db,'accessRequests',user.uid)); if(rq.exists()) reqData = rq.data(); }catch(_){}
    showPendingAccess(reqData);
    return;
  }
  state.user = user; state.role = role;
  document.getElementById('gate').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('navUser').innerHTML =
    `<b>${esc(user.email)}</b><span class="role-chip">${role}</span>`;
  buildNav();
  subscribeAll();
});

window.showGate = function(mode){
  document.getElementById('app').style.display='none';
  document.getElementById('gate').style.display='flex';
  document.getElementById('gateLoad').style.display = mode==='loading'?'flex':'none';
  document.getElementById('homeCard').style.display = mode==='home'?'block':'none';
  document.getElementById('loginCard').style.display = mode==='login'?'block':'none';
  document.getElementById('pendingCard').style.display = mode==='pending'?'block':'none';
  document.getElementById('staffAccessBtn').style.display = mode==='home'?'flex':'none';
}

function showPendingAccess(reqData){
  const t = document.getElementById('pendingTitle'), s = document.getElementById('pendingSub');
  if(reqData?.estado==='rechazado'){
    t.textContent = 'Solicitud rechazada';
    s.textContent = 'Tu solicitud de acceso fue rechazada. Si creés que es un error, contactá al personal administrador.';
  } else if(reqData?.estado==='pendiente'){
    t.textContent = 'Solicitud pendiente';
    s.textContent = 'Tu solicitud de acceso está pendiente de aprobación. Te van a habilitar el acceso una vez que el personal administrador la revise.';
  } else {
    t.textContent = 'Sin acceso';
    s.textContent = 'Tu cuenta no tiene acceso al sistema. Contactá al personal administrador para que te dé de alta.';
  }
  window.showGate('pending');
}

// ---------- Recuperar contraseña ----------
window.openForgotPassword = ()=>{
  const prefill = document.getElementById('loginEmail')?.value.trim() || '';
  modal('Recuperar contraseña', `
    <p class="small muted" style="margin-bottom:10px">Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.</p>
    <label class="lbl">Email</label>
    <input type="email" id="fp_email" value="${esc(prefill)}" placeholder="secretaria@consultorio.com">
  `, [
    {label:'Cancelar', class:'btn-ghost', fn:closeModal},
    {label:'Enviar', class:'btn-primary', fn:async ()=>{
      const email = document.getElementById('fp_email').value.trim();
      if(!email){ toast('Ingresá tu email','err'); return; }
      try{ await sendPasswordResetEmail(auth, email); toast('Te enviamos un email para restablecer la contraseña','ok'); closeModal(); }
      catch(e){ toast('Error: '+e.code,'err'); }
    }}
  ]);
};

// ---------- Solicitar acceso (auto-registro de personal, pendiente de aprobación) ----------
window.openAccessRequest = ()=>{
  modal('Solicitar acceso', `
    <div class="notice info" style="margin-bottom:4px"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <div>Se crea tu cuenta, pero <b>no vas a poder ingresar hasta que el personal administrador apruebe tu solicitud</b>.</div></div>
    <label class="lbl">Nombre y apellido</label><input id="ar_nombre">
    <label class="lbl">Email</label><input type="email" id="ar_email" placeholder="tu@email.com">
    <label class="lbl">Contraseña</label><input type="password" id="ar_pass" placeholder="Mínimo 6 caracteres">
    <label class="lbl">Motivo / rol solicitado</label><textarea id="ar_motivo" placeholder="Ej: soy la nueva secretaria del consultorio…"></textarea>
  `, [
    {label:'Cancelar', class:'btn-ghost', fn:closeModal},
    {label:'Enviar solicitud', class:'btn-primary', fn:submitAccessRequest}
  ]);
};
async function submitAccessRequest(){
  const nombre = document.getElementById('ar_nombre').value.trim();
  const email = document.getElementById('ar_email').value.trim();
  const pass = document.getElementById('ar_pass').value;
  const motivo = document.getElementById('ar_motivo').value.trim();
  if(!nombre || !email || !pass){ toast('Completá nombre, email y contraseña','err'); return; }
  if(pass.length<6){ toast('La contraseña debe tener al menos 6 caracteres','err'); return; }
  try{
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db,'accessRequests',cred.user.uid), { nombre, email, motivo, estado:'pendiente', createdAt: serverTimestamp() });
    closeModal();
    toast('Solicitud enviada · pendiente de aprobación','ok');
  }catch(e){
    const msg = e.code==='auth/email-already-in-use' ? 'Ese email ya tiene una cuenta. Probá recuperar la contraseña.' : 'Error: '+e.code;
    toast(msg,'err');
  }
}
