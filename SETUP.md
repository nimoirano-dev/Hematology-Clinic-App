# Setup — Turnos Hematología

App de **un solo archivo** (`index.html`) + **Firebase** (Auth + Firestore). Sin build, sin Node. Se publica en GitHub Pages como tus otras apps.

---

## 1. Crear el proyecto en Firebase

1. Entrá a https://console.firebase.google.com → **Agregar proyecto**.
2. Una vez creado, en el menú izquierdo:
   - **Build → Authentication → Get started → Sign-in method → Email/Password → Activar.**
   - **Build → Firestore Database → Crear base de datos** (modo *producción*, región `southamerica-east1` o la más cercana).
3. En **Configuración del proyecto (⚙) → Tus apps → Web (`</>`)**, registrá una app web.
   Copiá el objeto `firebaseConfig` que te da.

## 2. Pegar las credenciales

En `index.html`, buscá el bloque `const firebaseConfig = {...}` (cerca del `<script type="module">`) y reemplazá los `TU_...` con tus valores reales.

> El `apiKey` de Firebase **no es secreto** — es seguro que quede en el HTML público. La seguridad real la dan las **reglas de Firestore** (paso 4) y el login.

## 3. Crear los usuarios del personal

En **Authentication → Users → Add user**, creá uno por persona (email + contraseña). Ej:
- `secretaria@consultorio.com`
- `doctor@consultorio.com`

## 4. Publicar las reglas de seguridad

En **Firestore → Rules**, pegá el contenido de [`firestore.rules`](firestore.rules) y **Publicar**.
Esto permite que:
- Solo personal logueado lea/escriba pacientes, turnos, etc.
- Cualquiera (paciente sin login) pueda **crear** una solicitud de turno desde el formulario público, pero nadie sin login puede leerlas.

## 5. (Opcional) Roles por usuario

Por defecto **todo usuario autenticado entra como `admin`** (ve todo).
Para limitar a un médico a solo *Agenda* y *Pacientes*:

1. Copiá el **UID** del usuario (Authentication → Users → columna User UID).
2. En **Firestore → Data**, creá la colección `staff` con un documento cuyo **ID = ese UID**:
   ```
   staff/{uid}  →  { email: "doctor@consultorio.com", role: "doctor" }
   ```
   Roles válidos: `admin` (todo) · `doctor` (agenda + pacientes).

---

## Publicar (GitHub Pages)

Igual que tus otras apps:

```powershell
cd "C:\Users\nacho\OneDrive\Escritorio\Proyectos Claude\Code\consultorio-turnos"
git init
git add .
git commit -m "App de turnos hematología"
# crear repo en GitHub y luego:
git remote add origin https://github.com/TU_USUARIO/consultorio-turnos.git
git branch -M main
git push -u origin main
```

En el repo → **Settings → Pages → Source: `main` / root**. Queda en
`https://TU_USUARIO.github.io/consultorio-turnos/`

- **Personal:** entra a esa URL y se loguea.
- **Pacientes:** compartiles `https://TU_USUARIO.github.io/consultorio-turnos/?solicitar`
  (ese link va directo al formulario de solicitud, sin login).

---

## Estructura de datos (Firestore)

| Colección | Campos principales |
|---|---|
| `patients` | nombre, apellido, dni, nacimiento, telefono, email, obraSocial, afiliado, notas |
| `appointments` | patientId, patientName, fecha (`YYYY-MM-DD`), hora (`HH:MM`), duracion, estado, motivo, notas |
| `waitlist` | nombre, telefono, motivo, prioridad |
| `requests` | nombre, telefono, email, obraSocial, motivo, preferencia, estado (`nuevo`/`agendado`/`descartado`) |
| `config/consultorio` | name, address, phone |
| `staff/{uid}` | email, role |

Estados de turno: `pendiente` · `confirmado` · `atendido` · `ausente` · `cancelado`.
