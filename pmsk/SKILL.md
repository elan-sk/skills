---
name: pmsk
description: 'Conecta directo con la API de ProjectManagerSK — sistema propio de gestión de proyectos del usuario, a veces tecleado "MPSK" por error — para crear/consultar proyectos, fases, tareas, asignados, estados y dependencias, y diseñar y subir Ajustes, Pruebas y Aceptaciones (con imágenes y archivos), comentarios y preguntas de selección, sin tener que redescubrir qué es ni dónde vive cada vez. Disparar de inmediato con "MPSK", "PMSK", "ProjectManagerSK", "súbelo al gestor de proyectos", "montá esto en mi tracker de proyectos", o al pedir migrar/vincular un cronograma a ese sistema — sin preguntar qué es ni buscarlo primero.'
---

# ProjectManagerSK (PMSK — a veces tecleado "MPSK")

**Esto ya está resuelto: no hay que investigar qué es ni buscar dónde vive. Ir directo al grano.**

## Qué es

App propia de gestión de proyectos (Next.js + Prisma + MySQL) del usuario: proyectos, fases, tareas con dependencias, asignados/revisores, checklist, QA por rondas, alarmas. Repo local en `/home/elan-sk/Documentos/PERSONALES/SOFTWARE/ProjectManagerSK`.

Ese repo trae su propia skill con el mapeo **completo y autorizado** de la API (todos los endpoints, permisos, reglas de atraso, flujo de revisión/QA): `.claude/skills/project-manager-sk/SKILL.md`. **Si ese path existe en este entorno, leerlo para cualquier endpoint que no esté resumido acá abajo** — este archivo es solo el atajo para no perder tiempo en la fase de descubrimiento (como pasó la primera vez, confundiendo "MPSK" con una herramienta externa tipo Monday/ClickUp). Si la API evoluciona, la fuente de verdad es esa skill del repo, no esta copia resumida.

## URL del servidor

Producción confirmada (2026-09-13): `https://mediumorchid-donkey-632879.hostingersite.com`

No es secreta — usarla directo, sin preguntar. Si algún llamado falla por **conexión** (timeout, connection refused — no un 401/403/404, esos son respuestas válidas del servidor), puede haberse movido: recién ahí preguntar la URL actual.

## Login — SIEMPRE usuario/contraseña de la persona, NUNCA credencial guardada

No existe ninguna API key fija. Cada vez que haga falta hablar con la API en una conversación nueva (sin token vigente todavía en esta sesión), pedirle a la persona su usuario o correo y contraseña de PMSK — las mismas con las que entra a la app web:

```bash
curl -s "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" \
  -d '{"identifier":"usuario_o_correo","password":"..."}'
```

Devuelve `{ token, expiresAt, user: {id, name, username, role} }`. Usar ese `token` en `Authorization: Bearer <token>` para el resto de los llamados de la conversación (dura 8hs). **Nunca** escribir usuario, contraseña ni token en un archivo — solo en memoria mientras dure la conversación.

Si el login por API falla y no queda claro si es la credencial o el llamado: verificar **una sola vez** en `$BASE_URL/login` con el navegador (login real de la app) antes de seguir probando variantes a ciegas — evita arriesgar un bloqueo de cuenta por reintentos.

## Flujo típico: resolver personas antes de crear tareas

`GET /api/v1/users` (con el token) devuelve `{id, name, username, email, role}` de la gente activa. Mapear cada responsable del cronograma/documento de origen a su `userId` real ANTES de crear tareas — nunca inventar un id ni asumir que un nombre existe.

Si un nombre del origen (ej. "Cliente", "Sistemas Racafé", cualquier stakeholder sin login propio) no aparece en esa lista, no es una persona con cuenta: no forzarlo en `assigneeIds` — mencionarlo en la `description` de la tarea para no perder el dato.

`POST .../tasks` exige `assigneeIds` con al menos un id, incluso para `type: MILESTONE` cuyo responsable en el documento de origen suele ser "—": en ese caso asignar al PM o responsable general del proyecto.

## Dependencias entre tareas — regla dura, siempre presente al montar un cronograma

No crear un lote de tareas "sueltas" sin dependencias solo porque el documento de origen (Excel, tracker, acta de reunión) no traía una columna explícita de "depende de". Antes de crear las tareas, identificar activamente qué tarea no puede arrancar sin que otra haya cerrado — orden lógico del trabajo, no solo orden de fechas:

- Entre fases: la primera tarea de una fase normalmente depende del cierre/hito de la fase anterior.
- Dentro de una fase: sprints o bloques secuenciales del mismo responsable, o donde el output de uno alimenta al otro (ej. "desarrollo" depende de "diseño aprobado"; "despliegue" depende de "QA/UAT cerrado"; una tarea de contenido depende del copy aprobado).
- Bloqueos/definiciones pendientes (ver ejemplo real: Racafé, sept-2026): si una reunión o documento deja un punto sin decidir que otra tarea necesita para arrancar, modelarlo como una tarea `BLOCKED` propia y declarar la dependencia real con `POST /api/v1/tasks/:id/dependencies` — no dejarlo solo mencionado en texto.

Declarar cada relación real detectada con `dependsOnTaskIds` al crear la tarea (o `POST .../dependencies` después). Sí evitar inventar relaciones sin base real — la regla es "buscarlas activamente y declararlas", no "inferir cualquier cosa a partir de fechas parecidas". Si hay duda real sobre si dos tareas están relacionadas, preguntar antes de decidir por cuenta propia.

## Objetivos, requerimientos y descripción — completar SIEMPRE, no dejarlos vacíos

Regla dura (falla real: en la primera carga de un cronograma completo se creó el proyecto con solo fases y tareas, dejando estos tres campos vacíos aunque la información ya estaba disponible en los documentos de origen). Si hay documentos de origen (Excel/tracker, actas de reunión, documento de requisitos, resumen ejecutivo) con esta información, **siempre** volcarla en PMSK — no es opcional ni "solo si el usuario lo pide":

- `POST /api/v1/projects/:id/objectives` — `{ title, description? }`. Un objetivo por cada meta de negocio/producto real del proyecto (qué problema resuelve, qué logra) — sacarlos del resumen ejecutivo / documento de requisitos, no inventarlos genéricos.
- `POST /api/v1/projects/:id/requirements` — `{ title, description?, objectiveIds: [...], phaseIds: [...] }`. Un requerimiento por cada entregable/funcionalidad concreta del alcance (páginas, formularios, integraciones, requisitos transversales como bilingüe/tracking/seguridad). **Vincular siempre** `objectiveIds` (a qué objetivo(s) sirve) y `phaseIds` (en qué fase del cronograma se construye) — un requerimiento sin esos vínculos queda huérfano y no sirve para nada en la vista de PMSK.
- `PATCH /api/v1/projects/:id` — `{ description }` (HTML). Acá va **todo lo que no entra en un campo estructurado**: introducción/contexto del cliente, diagnóstico del problema que motiva el proyecto, decisiones técnicas y su razón (ej. plataforma elegida y por qué se descartó otra), qué queda fuera de alcance de este cronograma y por qué, riesgos/preguntas abiertas. Regla del pedido original: "no perder información solo porque no encaja en un campo específico".

Antes de crear tareas, ya se leyeron los documentos del proyecto para armar el cronograma — no releerlos de nuevo para esto, ya está toda la información a mano en esa misma pasada.

## Checklist completo al crear un proyecto nuevo — ningún paso es opcional

Crear solo fases + tareas es más rápido pero deja el proyecto a medias en PMSK. Cada vez que se crea un proyecto nuevo (no al agregar una tarea suelta a uno ya existente), seguir este orden completo — cada paso depende de IDs que salen del anterior:

1. `POST /api/v1/projects` — el proyecto. Borrar la fase "General" que crea sola y vacía si no se va a usar.
2. `POST .../phases` — todas las fases del cronograma (los requerimientos del paso 4 necesitan sus `phaseId`).
3. `POST .../objectives` — todos los objetivos reales del proyecto (los requerimientos del paso 4 necesitan sus `objectiveId`).
4. `POST .../requirements` — con `objectiveIds` + `phaseIds` ya resueltos de los pasos 2 y 3.
5. `POST .../tasks` — una por tarea, con `assigneeIds` resueltos (sección de arriba) y `dependsOnTaskIds`/`POST .../dependencies` para toda relación real detectada (sección de dependencias, arriba).
6. `PATCH /api/v1/projects/:id` con `description` — al final, cuando ya se sabe qué quedó cubierto por objetivos/requerimientos/fases y qué no.

Mostrarle a la persona el resumen (cuántos objetivos/requerimientos/fases/tareas) antes de disparar todo esto — ver "Antes de disparar una carga masiva" más abajo.

## Endpoints más usados (ver la skill del repo para el resto: revisión/QA, checklist, etiquetas, adjuntos, links)

- `POST /api/v1/projects` — `{ name, clientName?, startDate, pmId }`.
- `GET /api/v1/projects` / `GET /api/v1/projects/:id` — listar / detalle con fases, tareas, `bottlenecks`, `delays`.
- `POST /api/v1/projects/:id/phases` — `{ name }`. Al crear el proyecto, PMSK agrega solo una fase "General" vacía — borrarla si no se usa: `DELETE /api/v1/projects/:id/phases/:phaseId` (409 si ya tiene tareas).
- `POST /api/v1/projects/:id/tasks` — `{ phaseId, title, type: SIMPLE|MILESTONE|QA|ADJUSTMENT|ACCEPTANCE, description?, plannedStart, durationDays, assigneeIds, dependsOnTaskIds?, reviewerIds?, meetingUrl? }`. `plannedEnd` se calcula solo en días hábiles (festivos del país del proyecto).
- `PATCH /api/v1/tasks/:id` — `{ status: NOT_STARTED|IN_PROGRESS|BLOCKED|COMPLETED|RETURNED }` (entre otros campos). Cambiar a `COMPLETED`/`RETURNED` corre las mismas validaciones que la app web (checklist, evidencia, ronda aprobada) → 409 con el motivo si no se cumplen.
- `POST /api/v1/tasks/:id/dependencies` — `{ predecessorId, type: FINISH_TO_START|START_TO_START }`. Para dependencias detectadas después de crear la tarea (ver sección de arriba) — no solo las explícitas del origen, también las de sentido lógico del trabajo.
- `PATCH /api/v1/tasks/:id/assignees` — `{ assigneeIds }` (reemplaza la lista completa).

## Permisos

La API exige lo mismo que la app web para esa persona (ver detalle completo en la skill del repo): cualquier logueado ve proyectos/tareas y crea proyectos; PM del proyecto o admin crea/borra fases, tareas, objetivos, requisitos, mueve fechas. Un **403** es un problema real de permiso — avisar qué rol hace falta, no reintentar con otro método.

## Antes de disparar una carga masiva

Mostrarle a la persona un resumen de qué se va a crear (cuántas fases/tareas, a quién queda asignado cada bloque) antes de ejecutar — son llamadas reales a un sistema compartido, visibles después para todo el equipo del proyecto en PMSK.

## Diseñar Ajustes, Pruebas y Aceptaciones y subirlos (agregado 2026-09-20)

Objetivo: la persona diseña conversando y Claude lo sube. **Confirmar la lista completa antes de subir.** Detalle y contratos exactos: `.claude/skills/project-manager-sk/SKILL.md` del repo (fuente de verdad). Resumen:

- **Roles, sin clave maestra**: Claude actúa con el rol real de quien hizo login. Para diseñar hace falta ser PM del proyecto o administrador (asignado en Ajuste/Aceptación; revisor para agregar pruebas). Un 403 es un permiso real: avisar qué rol hace falta, no reintentar.
- **Archivos e imágenes**: `POST /api/upload` (multipart, campo `file`, Bearer) → `{ url, name, mimeType }`; luego esa `url` (o un link `https://`) va en los campos «archivo» `{ url, name, mimeType? }`. Imágenes, PDF, Word, Excel, PowerPoint, TXT/CSV, hasta 20 MB. Desde Claude Code: `curl -F "file=@/ruta/imagen.png"`.
- `GET /api/v1/tasks/:id/design` — estructura completa (cambios o rondas/checks con ids, resultados, evidencias, calificación del cliente).
- `POST /api/v1/tasks/:id/design` — diseño completo en un llamado. Ajuste: `{ items:[{ description, note?, before?:[archivo], after?:[archivo] }] }`. Prueba/Aceptación: `{ deliverables:[archivo], templateId?, checks:[{ title, criteria?, category?, evidence?:[archivo] }] }` (crea la ronda 1 si no existe: exige ≥1 entregable).
- Crear la tarea: `POST /api/v1/projects/:id/tasks` con `type` = `ADJUSTMENT | QA | ACCEPTANCE`. En QA, `reviewerIds` (un asignado nunca es su revisor).
- Comentarios y preguntas: `POST /api/v1/tasks/:id/comments` (`scope`: task · adjustment_item · acceptance_check · qa_check · round · conversation; `targetId`; `body`; `mentions`; `attachments`; `poll:{multiple,options}` = pregunta radio/casillas) y `POST /api/v1/projects/:id/comments` (`project_conversation` · `project_definition`). Leer: `GET /api/v1/tasks/:id/threads`, `GET /api/v1/polls/:id` (estadística), `POST /api/v1/polls/:id/vote`, `PATCH /api/v1/polls/:id {closed}`. Porcentaje = sobre personas que respondieron (múltiple puede pasar de 100 %).
- Link para el cliente: `POST|GET|DELETE /api/v1/tasks/:id/share-link` (y `/projects/:id/share-link`) → `path` `/share/<token>` (anteponer la URL del servidor). El cliente califica y acepta desde ahí; la API nunca lo hace por él.
- Cuidado: comentar con `mentions` en la conversación interna o en el hilo de una prueba avisa por WhatsApp a personas reales. No publicar comentarios de prueba.

