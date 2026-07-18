import { state } from './state.js';
import { esc, ymd, todayYmd } from './utils.js';

// ---------- Estadísticas (datos agregados, sin nombres de pacientes) ----------
export function renderStats(){
  const el = document.getElementById('statsContent');
  const days = Number(document.getElementById('statsPeriod')?.value || 30);
  const since = new Date(); since.setDate(since.getDate()-days);
  const sinceYmd = ymd(since), todayStr = todayYmd();
  const inRange = state.appointments.filter(a=>a.fecha>=sinceYmd && a.fecha<=todayStr);
  const total = inRange.length;
  const byEstado = {};
  inRange.forEach(a=>{ const e=a.estado||'pendiente'; byEstado[e]=(byEstado[e]||0)+1; });
  const ausentes = byEstado.ausente||0;
  const atendidos = byEstado.atendido||0;
  const cancelados = byEstado.cancelado||0;
  const tasaAusencia = total ? Math.round(ausentes/total*100) : 0;
  const osCounts = {};
  inRange.forEach(a=>{ const os=(a.obraSocial||'').trim()||'Sin especificar'; osCounts[os]=(osCounts[os]||0)+1; });
  const osSorted = Object.entries(osCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxOs = osSorted[0]?.[1] || 1;
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="n">${total}</div><div class="l">Turnos en el período</div></div>
      <div class="stat-card"><div class="n">${atendidos}</div><div class="l">Atendidos</div></div>
      <div class="stat-card"><div class="n" style="color:var(--danger)">${tasaAusencia}%</div><div class="l">Tasa de ausencias (${ausentes} de ${total})</div></div>
      <div class="stat-card"><div class="n">${cancelados}</div><div class="l">Cancelados</div></div>
    </div>
    <div class="card pad">
      <h3 style="font-size:1rem;margin-bottom:12px">Obra social más frecuente</h3>
      ${osSorted.length ? osSorted.map(([name,n])=>`
        <div class="bar-row">
          <div class="lbl-b" title="${esc(name)}">${esc(name)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.round(n/maxOs*100)}%"></div></div>
          <div class="bar-n">${n}</div>
        </div>`).join('') : '<div class="small muted">Sin turnos en este período.</div>'}
    </div>`;
}
window.renderStats = renderStats;
