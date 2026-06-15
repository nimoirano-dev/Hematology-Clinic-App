# Turnos · Hematología

PWA de gestión de turnos para un consultorio de hematología. Un solo `index.html` + Firebase, sin build tooling. Pensada para correr en GitHub Pages.

## Qué hace

- **Agenda diaria** — crear/editar/eliminar turnos, navegar por día, estados (pendiente → confirmado → atendido / ausente / cancelado), contadores del día.
- **Pacientes** — ficha con datos personales, obra social y notas clínicas; búsqueda; historial de turnos por paciente.
- **Lista de espera** — cola con prioridad normal/urgente; "Dar turno" crea el paciente (si hace falta) y abre el alta de turno.
- **Solicitudes de pacientes** — formulario público (`?solicitar`, sin login). Deja en claro al paciente que es un *pedido*, no un turno confirmado. La secretaria puede escribirle por WhatsApp para coordinar, agendarlo o descartarlo.
- **Circuito anti-error de confirmación** — pensado para que nadie llegue sin turno confirmado:
  - La solicitud recién pasa a "agendada" cuando el turno **se guarda** (si se cancela el alta, el pedido sigue pendiente, no se pierde).
  - Al crear un turno, paso obligado de **avisar al paciente por WhatsApp** (mensaje pre-armado que pide confirmación).
  - Cada turno muestra su estado de comunicación: **⚠ sin avisar** → **avisado** → **confirmado**.
  - La agenda del día resalta cuántos turnos quedan **sin avisar** (contador + banner rojo).
- **Recordatorios** — botón de WhatsApp por turno (aviso inicial y recordatorio). *Envío manual en esta versión; automático en fase 2.*
- **Roles** — `admin` (secretaría, ve todo) y `doctor` (agenda + pacientes).
- **PWA** — instalable, abre offline (el shell; los datos requieren red).

## Puesta en marcha

Ver **[SETUP.md](SETUP.md)** — configurar Firebase, usuarios, reglas y publicar.

## Roadmap (fase 2)

- **Recordatorios automáticos** (24 h / 1 h antes) vía un Cloudflare Worker con cron + WhatsApp Cloud API o Twilio — mismo patrón que el proxy de Riot del LoL tracker.
- Vista semanal / agenda por profesional.
- Portal del paciente con login para ver/cancelar sus propios turnos.
