import { ymd } from './utils.js';

// ---------- Estado compartido ----------
// Expuesto también en window porque algunos onclick="" inline en el HTML
// generado (ej. calendario) referencian `state` directamente.
export const state = {
  user: null, role: null,
  patients: [], appointments: [], waitlist: [], requests: [], staff: [], accessRequests: [],
  config: {},
  agendaDate: ymd(new Date()),
  agendaView: 'day',
  activeSection: 'agenda',
  publicMode: false,
  pendingReqId: null,
  unsub: []
};
window.state = state;

export function userStamp(){ return state.user ? { uid: state.user.uid, email: state.user.email } : null; }
