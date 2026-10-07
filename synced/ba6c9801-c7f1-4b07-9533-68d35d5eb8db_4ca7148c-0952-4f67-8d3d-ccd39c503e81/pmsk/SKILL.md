---
name: pmsk
description: 'Conecta directo con la API de ProjectManagerSK — sistema propio de gestión de proyectos del usuario, a veces tecleado "MPSK" por error — para crear/consultar proyectos, fases, tareas, asignados, estados y dependencias, y diseñar y subir Ajustes, Pruebas y Aceptaciones (con imágenes y archivos), comentarios y preguntas de selección, sin tener que redescubrir qué es ni dónde vive cada vez. Disparar de inmediato con "MPSK", "PMSK", "ProjectManagerSK", "súbelo al gestor de proyectos", "montá esto en mi tracker de proyectos", al pegar un link `/api/v1/claude-link/…` del botón "Conectar IA", o al pedir migrar/vincular un cronograma a ese sistema — sin preguntar qué es ni buscarlo primero.'
---

# ProjectManagerSK (PMSK — a veces tecleado "MPSK")

**Esto ya está resuelto: no hay que investigar qué es ni buscar dónde vive. Ir directo al grano.**

## Qué es

App propia de gestión de proyectos (Next.js + Prisma + MySQL) del usuario: proyectos, fases, tareas con dependencias, asignados/revisores, checklist, QA por rondas, alarmas. Repo local en `/home/elan-sk/Documentos/PERSONALES/SOFTWARE/ProjectManagerSK`.

Ese repo trae su propia skill con el mapeo **completo y autorizado** de la API (todos los endpoints, permisos, reglas de atraso, flujo de revisión/QA): `.claude/skills/project-manager-sk/SKILL.md`. **Si ese path existe en este entorno, leerlo para cualquier endpoint que no esté resumido acá abajo** — este archivo es solo el atajo para no perder tiempo en la fase de descubrimiento (como pasó la primera vez, confundiendo "MPSK" con una herramienta externa tipo Monday/ClickUp). Si la API evoluciona, la fuente de verdad es esa skill del repo, no esta copia resumida.

## URL del servidor

Producción confirmada (2026-09-13): `https://mediumorchid-donkey-632879.hostingersite.com`

No es secreta — usarla directo, sin preguntar. Si algún llamado falla por **conexión** (timeout, connection refused — no un 401/403/404, esos son respuestas válidas del servidor), puede haberse movido: recién ahí preguntar la URL actual.

## Login — usuario/contraseña de la persona, guardados en `.pmsk.env` del proyecto

No existe ninguna API key fija. Se usan el usuario o correo y la contraseña de PMSK de la persona — las mismas con las que entra a la app web (cómo obtenerlos y guardarlos: ver "Credenciales" más abajo):

```bash
curl -s "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" \
  -d '{"identifier":"usuario_o_correo","password":"..."}'
```

Devuelve `{ token, expiresAt, user: {id, name, username, role} }`. Usar ese `token` en `Authorization: Bearer <token>` para el resto de los llamados de la conversación (dura 8hs). El token NO se guarda en archivo: solo en memoria mientras dure la conversación.

Si el login por API falla y no queda claro si es la credencial o el llamado: verificar **una sola vez** en `$BASE_URL/login` con el navegador (login real de la app) antes de seguir probando variantes a ciegas — evita arriesgar un bloqueo de cuenta por reintentos.

## Conexión por link — "Conectar IA" (tiene prioridad sobre el login)

Si la persona pega un link con la forma `<BASE_URL>/api/v1/claude-link/<token>`, generado con el botón **"Conectar IA"** de la app, usarlo **en lugar** del login con usuario/contraseña — no pedir ni leer credenciales:

1. Abrirlo con `curl -s "<link>"`. Responde markdown con la URL base, el token (`Authorization: Bearer …`) y el contexto en JSON. Link de **tarea**: tres bloques, la tarea (`GET /tasks/:id`: cascada fase → requerimientos → objetivos, asignados, revisores, etiquetas, checklist, insumos/evidencias, dependencias), el diseño (`/design`: cambios con antes/después/**insumos** o rondas) y todos los hilos (`/threads`). Link de proyecto: `GET /projects/:id` (objetivos, requerimientos, adjuntos, links, repos, los archivos de cada tarea: insumos/evidencias, antes/después/insumos de ajustes, entregables y evidencias de rondas, y `schedule`: cuándo terminaría al ritmo actual y su retraso/holgura contra la fecha de cierre — ver «Cronograma») y sus hilos (`GET /projects/:id/threads`: `definition` y `conversation`). Las rutas `/uploads/…` vienen con el dominio completo y se abren sin sesión (también dentro de textos y marcas `[[img:…]]`).
2. El token del link **es** la credencial: usarlo en `Authorization: Bearer` para el resto de los llamados, con los mismos permisos de la persona. Solo en memoria, nunca en archivos ni en la salida.
3. Es reutilizable: volver a abrirlo trae el contexto actualizado. Vale hasta que la tarea se completa, pasan 7 días sin uso (cada uso reinicia el plazo), se desactiva desde la app o se genera otro para la misma tarea/proyecto. `410` o `401` → pedir uno nuevo.
4. La tarea/proyecto del link es solo contexto: el token puede todo lo que la persona puede en la app, no solo esa tarea.
5. Cada persona puede tener un link activo por tarea/proyecto a la vez; no se pisan entre sí ni con la sesión de login.
6. Al trabajar una tarea (con o sin la skill `sdd`): si un insumo, enlace o comentario apunta a un componente o instructivo de la biblioteca (`biblioteca.depura-creatividad.com`), leerlo con la skill `biblioteca-depura` y su protocolo, no como página web. Y aunque nada la nombre, hacer siempre un barrido corto en la biblioteca (`indice` filtrado por stack y palabras clave de la tarea) por si hay algo reutilizable (decisión del usuario 2026-10-04).
7. Resultado de la tarea del link → Evidencias (`kind: "RESULTADO"`), antes de completarla (regla del usuario, 2026-10-06): si el entregable es un **documento**, el documento mismo en `.md`, subido siempre y sin preguntar (en tareas tipo **Entregable**/`MILESTONE` es obligatorio: sin Evidencia la app no deja completarlas); si es **código**, queda en el repo y a Evidencias van solo capturas de la prueba en navegador, y solo si se autorizó el navegador (sin prueba, no se inventan capturas: se aclara en el comentario).

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

## REGLAS DURAS de fechas y dependencias — misma lógica que la app (falla real 2026-09-20)

La API `POST /projects/:id/tasks` guarda `plannedStart` TAL CUAL: NO valida contra las predecesoras (la app web sí). Un error mío dejó un hito iniciando en Jueves Santo (festivo). Por eso, al crear/planificar tareas, calcular las fechas con la MISMA regla de `requiredStartFor` de la app, nunca "a ojo":

1. **FINISH_TO_START**: la sucesora empieza el **día HÁBIL siguiente** al `plannedEnd` de la predecesora. Con varias predecesoras, manda la de fin más tardío (el máximo). **START_TO_START**: mismo `plannedStart` que la predecesora.
2. **Día hábil = ni sábado/domingo NI festivo del país del proyecto** (`countryCode`, ej. CO). Saltar solo fines de semana es un BUG. Festivos: mismos que usa la app, `https://date.nager.at/api/v3/publicholidays/<año>/<CC>` (con header `User-Agent: curl/8.5.0`), traer todos los años que cruce el cronograma.
3. Un `plannedStart` nunca puede caer en fin de semana ni festivo. Ni siquiera un hito de 1 día.
4. `plannedEnd` lo calcula el servidor (`addBusinessDays(start, duración-1)`); leerlo de la respuesta y arrancar la siguiente desde ahí, no calcularlo aparte. Crear en orden topológico (predecesora antes que sucesora) y declarar `dependsOnTaskIds` en el mismo POST.
5. **Nunca** una sucesora puede iniciar antes o el mismo día del fin de su predecesora (en FINISH_TO_START), ni la primera tarea antes de `startDate` del proyecto.
6. **Verificar siempre al terminar una carga**: leer `GET /projects/:id` + `GET /tasks/:id/dependencies` de cada tarea y comprobar que cada sucesora cumple 1-3 (0 violaciones). Se puede probar en seco antes de reportar "listo".
7. **Para corregir fechas usar `POST /api/v1/tasks/:id/move` `{newStartDate}`**: usa la lógica de la app (mantiene la duración en días hábiles y recalcula en cascada todas las sucesoras). No editar fechas una por una a mano.
8. Si mandan un bloque de tareas con dependencias en cadena, la primera de cada fase depende del hito/última tarea de la fase anterior, y todo lo anterior se aplica igual.

## Descripción de tareas vs. herramientas del sistema (regla dura, 2026-09-20)

PMSK ya tiene herramientas propias por tarea: **checklist** (`GET|POST /tasks/:id/steps`, `PATCH /tasks/:id/steps/:stepId {done?, description?}`, `DELETE /tasks/:id/steps/:stepId`), comentarios, adjuntos (`GET|POST /tasks/:id/attachments`; `PUT|DELETE /tasks/:id/attachments/:attachmentId` reemplaza o quita un archivo, solo el que subió uno mismo), etiquetas, dependencias. **Usar SIEMPRE esas herramientas; nunca simularlas dentro de la descripción.**

- **`description` de una tarea es HTML** (viene de un editor visual WYSIWYG; `PATCH /api/v1/tasks/:id {description}`). Se manda con etiquetas (`<h3>`, `<p>`, `<ul><li>`, `<strong>`); la persona lo ve formateado, no como código. Si le preguntan "qué es HTML", explicar eso en una frase, sin tecnicismos.
- La descripción lleva **solo contexto**: objetivo, referencia en la documentación (sección/documento), definición de terminado (criterios de aceptación) y notas/decisiones abiertas. **Prohibido** meter listas de pasos o "qué hay que hacer" con viñetas: eso es un checklist disfrazado y se duplica con el real.
- Los pasos de trabajo van al **checklist real** (`/tasks/:id/steps`). PMSK exige el checklist completo para pasar la tarea a COMPLETED, algo que una lista en la descripción no hace.
- **Antes de tocar checklist/comentarios/adjuntos, preguntar** quién los crea (Claude por API o la persona en la app). Si dice que los hace ella, no tocarlos. No asumirlo.
- No adjuntar a tareas documentos con datos sensibles (ej. precios internos) mientras el proyecto no esté oculto.
- Al dudar si un script o cambio masivo es lo que quieren, mostrar un ejemplo de UNA tarea antes de aplicarlo a todas.

### Tiempos, QA, ajustes y aceptación: SIEMPRE con las herramientas nativas de PMSK

- **Tiempo de las tareas** (inicio, duración, fin): usar los campos y endpoints de la app (`plannedStart` + `durationDays` al crear; `POST /tasks/:id/move` y `/resize` para cambiarlas; dependencias reales). Nunca poner fechas o duraciones como texto en la descripción ni calcular el fin por fuera (ver reglas duras de fechas).
- **Pruebas de calidad (QA)**: tarea `type: QA` con `reviewerIds` y `defaultTestTemplateId` (plantilla que se copia sola a la ronda 1 al enviarla a revisión), y sus rondas/checks por `POST /tasks/:id/design` (`checks`; `deliverables` opcional). No describir "pruebas" como lista en una descripción.
- **Revisar ajustes**: tarea `type: ADJUSTMENT` con `POST /tasks/:id/design` `{items:[…]}` (before/after con archivos vía `/api/upload`).
- **Pruebas de aceptación**: tarea `type: ACCEPTANCE` con `POST /tasks/:id/design` (`checks`), y el link para el cliente con `/tasks/:id/share-link`. La calificación/aceptación la hace el cliente, nunca la API.
- Si el trabajo exige una de estas figuras y la tarea se creó como `SIMPLE`, corregir el `type` a la correcta en vez de improvisar con texto.
- **Claude decide con criterio de experto qué tareas necesitan QA / Ajuste / Aceptación** (no preguntar "¿cuáles?"): QA donde hay criterios de aceptación verificables o riesgo alto (seguridad, aislamiento de datos, despliegue, integraciones, dinero/impuestos); Aceptación solo donde el cliente valida algo que ve/usa; Ajuste solo con cambios pedidos concretos. En proyecto unipersonal, la QA formal se concentra en el cierre de cada entrega (una por entrega, con un check por criterio de aceptación CA-x.y), no en cada tarea.
- **Límites reales de la API para QA (verificados 2026-09-20)**: (1) Plantillas de prueba: SÍ por API desde 2026-10-04. Crear, renombrar y agregar/editar ítems exige revisor (en alguna tarea de cualquier proyecto), PM o admin, en la web y por API por igual; borrar, solo admin; un miembro sin eso recibe 403 en todo, incluso al listar (no ofrecerle la acción) — ver `/api/v1/test-templates` abajo; se aplican con `defaultTestTemplateId` (al crear la tarea o después con `PUT /api/v1/tasks/:id/review/default-template` (`{ "templateId": "…" | null }`, solo Prueba, revisor/PM/admin): plantilla que se copia sola a la ronda 1 cuando el ejecutor entrega) o `templateId`. Las categorías de respuesta siguen solo en la app (Configuración), con la misma regla de permisos. (2) Desde 2026-10-06 el entregable es **opcional** para enviar o reenviar una Prueba a revisión (en la app y por API: `POST /tasks/:id/review/rounds` y `/design` aceptan `deliverables` vacío); lo que sigue exigido es, al reenviar, la respuesta + evidencia de corrección de cada prueba «Con errores». Flujo recomendado: crear la tarea `QA` con `defaultTestTemplateId` (o asignarla antes de la ronda 1 con `PUT …/review/default-template`) y la plantilla se copia sola al enviar. (3) `reviewerIds` nunca puede incluir a un asignado de la tarea; elegir revisor real es decisión de la persona → `AskUserQuestion`. Asignar revisor puede notificar por WhatsApp a gente real (proyecto aún no oculto = riesgo).
- **Proyecto oculto = personal de quien lo pide** (aclarado por el usuario 2026-09-20): todas las tareas se asignan a esa persona, nadie más trabaja ni revisa; NO ofrecer ni asignar otros usuarios como revisores/asignados. Las QA van asignadas a esa persona y sin `reviewerIds`: quien es PM/administrador puede calificar la prueba sin ser revisor (`canReviewTask`). No preguntar "¿quién revisa?" en ese caso.
- Insertar una tarea QA en una cadena existente: crearla con `plannedStart` válido, declarar `POST /tasks/:id/dependencies` (predecesora → QA, QA → hito) y dejar que la app recalcule en cascada; luego verificar de nuevo las reglas de fechas.
- **Preguntas al usuario**: TODA confirmación, elección u opción (¿creo esto o aquello?, ¿tú o yo?, ¿confirmas la lista?) se hace con el formulario `AskUserQuestion`, no con preguntas sueltas en texto. Aplica también a decidir si una tarea necesita QA/Ajuste/Aceptación, a confirmar antes de una carga masiva y a quién crea checklist/comentarios/adjuntos.

## Objetivos, requerimientos y descripción — completar SIEMPRE, no dejarlos vacíos

Regla dura (falla real: en la primera carga de un cronograma completo se creó el proyecto con solo fases y tareas, dejando estos tres campos vacíos aunque la información ya estaba disponible en los documentos de origen). Si hay documentos de origen (Excel/tracker, actas de reunión, documento de requisitos, resumen ejecutivo) con esta información, **siempre** volcarla en PMSK — no es opcional ni "solo si el usuario lo pide":

- `POST /api/v1/projects/:id/objectives` — `{ title, description? }`. Un objetivo por cada meta de negocio/producto real del proyecto (qué problema resuelve, qué logra) — sacarlos del resumen ejecutivo / documento de requisitos, no inventarlos genéricos.
- `POST /api/v1/projects/:id/requirements` — `{ title, description?, objectiveIds: [...], phaseIds: [...] }`. Un requerimiento por cada entregable/funcionalidad concreta del alcance (páginas, formularios, integraciones, requisitos transversales como bilingüe/tracking/seguridad). **Vincular siempre** `objectiveIds` (a qué objetivo(s) sirve) y `phaseIds` (en qué fase del cronograma se construye) — un requerimiento sin esos vínculos queda huérfano y no sirve para nada en la vista de PMSK.
- `PATCH /api/v1/projects/:id` — `{ description }` (HTML). Acá va **todo lo que no entra en un campo estructurado**: introducción/contexto del cliente, diagnóstico del problema que motiva el proyecto, decisiones técnicas y su razón (ej. plataforma elegida y por qué se descartó otra), qué queda fuera de alcance de este cronograma y por qué, riesgos/preguntas abiertas. Regla del pedido original: "no perder información solo porque no encaja en un campo específico".

Antes de crear tareas, ya se leyeron los documentos del proyecto para armar el cronograma — no releerlos de nuevo para esto, ya está toda la información a mano en esa misma pasada.

## Proyecto oculto (actualizado 2026-10-03)

`PATCH /api/v1/projects/:id { "hidden": true }` lo oculta, pero **solo si quien está logueado es administrador Y además el PM del proyecto** (si no, 403). Si piden "proyecto oculto": crear el proyecto **vacío**, ocultarlo, y **recién después** subir documentos/contenido sensible (ej. precios internos). Un oculto solo lo ve ese administrador-PM: otros admins, el PM no-admin y los asignados no lo verán. Avisarlo de entrada.

## Proyecto archivado (historial) — distinto de eliminar

Un proyecto entregado/terminado se archiva: `PATCH /api/v1/projects/:id { "archived": true }` (PM o admin). Sale de la lista, el buscador, la agenda, los reportes y las alertas; se ve con `GET /api/v1/projects?archived=1` y se devuelve con `{ "archived": false }`. `DELETE /api/v1/projects/:id` en cambio **elimina** (solo admin) — no usarlo para "archivar".

## Credenciales: archivo `.pmsk.env` en la raíz del proyecto (no rastreado por git)

Regla dura (el usuario lo cambió 2026-09-30; reemplaza la regla anterior de "solo memoria"). Al empezar cualquier trabajo con la API, lo PRIMERO:

1. Raíz = `git rev-parse --show-toplevel` (si no es repo git, el directorio de trabajo actual). Archivo: `<raíz>/.pmsk.env` con
   ```
   PMSK_USER=usuario_o_correo
   PMSK_PASSWORD=...
   ```
2. **Si el archivo existe** → leerlo y hacer login directo, sin preguntar.
3. **Si no existe, o el login con lo guardado da 401** → pedir usuario/correo y contraseña con el formulario `AskUserQuestion` (una pregunta por dato, opciones marcador "Escribir en Other" + "Cancelar"; el valor real llega en la respuesta "Other"; si trae el marcador en vez del dato, volver a preguntar, no adivinar). Hacer login, y **solo si funciona** escribir/sobrescribir `.pmsk.env`.
4. Antes de escribirlo, garantizar que git lo ignore: `git check-ignore -q .pmsk.env` y, si no está ignorado, agregar la línea `.pmsk.env` a `.git/info/exclude` (local, no se sube; NO tocar el `.gitignore` rastreado). Luego `chmod 600 .pmsk.env`. Verificar con `git status --porcelain` que no aparezca.
5. En scripts, cargar las variables del archivo (`set -a; . ./.pmsk.env; set +a` en bash, o leerlo en Python) — nunca copiar la clave dentro del script ni mostrarla en la salida.

Nunca crear artifacts/páginas para pedir credenciales. El token sigue siendo solo de memoria.

## Recoger otras decisiones con AskUserQuestion

Para PM, qué documentos subir, si crear tareas, etc., usar también `AskUserQuestion`.

## Python `urllib` recibe 405 en login

El hosting bloquea el User-Agent por defecto de `urllib`. En scripts Python agregar el header `User-Agent: curl/8.5.0` (con `curl` funciona directo).

## Documentos fuente: los `.docx` se leen sin pandoc

No hay pandoc/docx2txt en este entorno: extraer texto con `python3` (`zipfile` + `word/document.xml`, quitando tags). Ignorar copias idénticas de nombre sin guion (mismo tamaño) al subir adjuntos.

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
- `GET /api/v1/projects` / `GET /api/v1/projects/:id` — listar (flujo normal; `?archived=1` = historial) / detalle con fases, tareas, `bottlenecks`, `delays`.
- **Cronograma (retraso/holgura proyectados, desde 2026-10-06)**: `GET /api/v1/projects/:id` → `schedule: { projectedEnd, targetEndDate, varianceBusinessDays, label, delayingTasks }`. Es el cálculo oficial de la app por ruta crítica: tarea en curso/bloqueada/devuelta y vencida = hoy + su duración; sin iniciar con el inicio pasado = arranca hoy; se corren sus sucesoras sin iniciar. `varianceBusinessDays` en días hábiles: + holgura, − retraso, `null` sin fecha de cierre (`targetEndDate`). Para «¿vamos atrasados?/¿cuándo terminamos?» usar esto (no estimar a mano) y nombrar `delayingTasks`. En la app el estado del proyecto dice «Retrasado 1 semana» / «A tiempo» / «Holgura de 2 meses» (sin fecha de cierre, la salud de siempre).
- `PATCH /api/v1/projects/:id` — `name`, `description`, `startDate`, `targetEndDate`, `clientName`, `repoUrl`, `color`, `iconUrl`, `whatsappGroupJid`, `archived`, `hidden` (`null` vacía un campo). Detalle de todos los demás endpoints (repos, reordenar fases/pasos, duplicar, fusionar, urgente, quitar entregables/evidencias, editar mensajes, categorías de etiqueta): skill del repo.
- `POST /api/v1/projects/:id/phases` — `{ name }`. Al crear el proyecto, PMSK agrega solo una fase "General" vacía — borrarla si no se usa: `DELETE /api/v1/projects/:id/phases/:phaseId` (409 si ya tiene tareas).
- `POST /api/v1/projects/:id/tasks` — `{ phaseId, title, type: SIMPLE|MILESTONE|QA|ADJUSTMENT|ACCEPTANCE, description?, plannedStart, durationDays, assigneeIds, dependsOnTaskIds?, reviewerIds?, meetingUrl? }`. `plannedEnd` se calcula solo en días hábiles (festivos del país del proyecto).
- `PATCH /api/v1/tasks/:id` — `{ status: NOT_STARTED|IN_PROGRESS|BLOCKED|COMPLETED|RETURNED }` (entre otros campos: título, descripción, fase, y para PM/admin `type`, `isUrgent`, `archived`). Cambiar a `COMPLETED`/`RETURNED` corre las mismas validaciones que la app web (checklist, evidencia, ronda aprobada) → 409 con el motivo si no se cumplen.
- `POST /api/v1/tasks/:id/dependencies` — `{ predecessorId, type: FINISH_TO_START|START_TO_START }`. Para dependencias detectadas después de crear la tarea (ver sección de arriba) — no solo las explícitas del origen, también las de sentido lógico del trabajo.
- `PATCH /api/v1/tasks/:id/assignees` — `{ assigneeIds }` (reemplaza la lista completa).

## Permisos

La API exige lo mismo que la app web para esa persona (ver detalle completo en la skill del repo): cualquier logueado ve proyectos/tareas y crea proyectos; PM del proyecto o admin crea/borra fases, tareas, objetivos, requisitos, mueve fechas. Un **403** es un problema real de permiso — avisar qué rol hace falta, no reintentar con otro método.

## Antes de disparar una carga masiva

Mostrarle a la persona un resumen de qué se va a crear (cuántas fases/tareas, a quién queda asignado cada bloque) antes de ejecutar — son llamadas reales a un sistema compartido, visibles después para todo el equipo del proyecto en PMSK.

## Tono de todo texto que se sube a la app — tercera persona, de usted, cordial y respetuoso (regla dura, 2026-09-21)

Todo lo que se redacte para la app (descripciones, Ajustes, checks y criterios de Pruebas y Aceptaciones, comentarios, preguntas, mensajes) lo leen miembros del equipo y clientes externos. Se escribe siempre **de usted, en tercera persona o impersonal, con calidez y respeto**:

- Nunca tuteo ni voseo: no «mira», «pulsa», «comprueba», «anota», «vas a probar», «querés», «podés».
- Sí: «Observe la parte superior…», «Pulse cada pestaña y verifique que…», «¿Qué es lo que usted va a probar?», «Se solicita indicar qué botón o función echa de menos.», «Quedamos atentos a sus comentarios».
- Amable y cálido, sin confianza ni jerga técnica: agradecer, invitar («Por favor», «Sería de gran ayuda que…»), nunca ordenar en seco.
- Aplica también a los textos de ejemplo y a los que se corrijan en contenido ya subido.

## Negritas para dar jerarquía (regla dura, 2026-09-21)

En los textos que se suben a la app, los **títulos y rótulos** de cada bloque van en negrita, en especial los que llevan dos puntos («Para qué sirve:», «Cómo probarlo:»). La negrita marca la jerarquía y hace el texto más fácil de recorrer.

- **Texto plano** (`criteria` de los checks de Prueba/Aceptación, comentarios, pasos del checklist): la app interpreta `*texto*` (un asterisco a cada lado, en la misma línea) como negrita. Escribir el rótulo así: `*Para qué sirve:* Comprobar que…`. No usar `**doble**` ni `<strong>` (se vería literal).
- **Campos HTML** (`description` de tareas y del proyecto): usar `<strong>` o `<h3>`.
- Aplicarla donde haga falta para mostrar la jerarquía (rótulos, términos clave); no resaltar frases enteras ni todo el texto. Al cargar o corregir checks, poner los rótulos ya con asteriscos.

## Diseñar Ajustes, Pruebas y Aceptaciones y subirlos (agregado 2026-09-20)

Objetivo: la persona diseña conversando y Claude lo sube. **Confirmar la lista completa antes de subir.** Detalle y contratos exactos: `.claude/skills/project-manager-sk/SKILL.md` del repo (fuente de verdad). Resumen:

- **Roles, sin clave maestra**: Claude actúa con el rol real de quien hizo login. Para diseñar hace falta ser PM del proyecto o administrador (asignado en Ajuste/Aceptación; revisor para agregar pruebas). Un 403 es un permiso real: avisar qué rol hace falta, no reintentar.
- **Archivos e imágenes**: `POST /api/upload` (multipart, campo `file`, Bearer) → `{ url, name, mimeType }`; luego esa `url` (o un link `https://`) va en los campos «archivo» `{ url, name, mimeType? }`. Imágenes, PDF, Word, Excel, PowerPoint, TXT/CSV/MD, hasta 20 MB. Desde Claude Code: `curl -F "file=@/ruta/imagen.png"`.
- **Sin duplicados (desde 2026-10-06)**: `/api/upload` nombra cada archivo por la huella de su contenido, así que subir otra vez el mismo archivo (con cualquier nombre) devuelve la misma `url`: no hace falta buscarlo antes. Si un archivo o link ya está en esa misma sección (Insumos de la tarea, Antes de un cambio, entregables de una ronda, Definición…), no se agrega otra vez: las cargas devuelven `added` y `skipped: [nombres]` (decírselo a la persona en una línea, sin tratarlo como error). Dos links son el mismo aunque cambien el nombre, `http`/`https`, `www.`, la barra final o el `#ancla`; un video de YouTube es el mismo en cualquiera de sus formatos (los parámetros `?a=1` sí distinguen). En secciones distintas sí se permite el mismo archivo.
- **Archivo demasiado grande** (regla del usuario, 2026-10-06): antes de subir, revisar el tamaño (`stat -c %s`). Si pasa de 20 MB, o `/api/upload` responde 413, no insistir ni comprimirlo por cuenta propia. Avisar a la persona y ofrecerle dejar un **link** en lugar del archivo, con la recomendación de subirlo a **Google Drive** y compartirlo con «Cualquier persona con el enlace · Lector». Si lo autoriza, también se puede subir con el conector de Google Drive. El link se registra como un archivo más: `{ url: "https://…", name: "<nombre descriptivo del archivo>" }`, en el mismo lugar donde iba el archivo (Insumos, Evidencias, entregable, antes/después, adjunto de comentario). El cliente lo ve por el link compartido: confirmar que el permiso de Drive no exponga otros archivos de la carpeta.
- **Documentos de texto siempre en `.md`** (regla del usuario, 2026-10-01): todo documento que Claude redacte y suba a PMSK (specs, informes, actas, guías, notas, instructivos) va como `.md` — nunca `.txt` ni `.docx` generado. El visor de la app muestra `.md` con formato (títulos, listas, tablas). Los archivos que aporta la persona se suben tal como vienen, sin convertirlos.
- `GET /api/v1/tasks/:id/design` — estructura completa; `items`/`rounds` aparecen siempre que existan, aunque le hayan cambiado el tipo a la tarea (cambios con `before`/`after`/`insumos` —internos, el cliente no los ve— o rondas/checks con ids, quién envió la ronda, resultados, `responseCategory`, evidencias, calificación del cliente).
- Plantillas de pruebas (revisor, PM o administrador en todo, igual que en la web; borrar solo administrador): `GET|POST /api/v1/test-templates` (lista con ítems / crea `{ "name": "…", "items": [{ "title": "…", "criteria": "un punto por línea", "category": "?" }] }`, devuelve `id` e `itemIds`), `PATCH|DELETE /api/v1/test-templates/:id` (`{ "name" }` / borra con sus ítems), `POST /api/v1/test-templates/:id/items` (agrega al final), `PATCH|DELETE /api/v1/test-template-items/:itemId` (`{ title, criteria?, category? }` reescribe el ítem completo: lo que no se mande queda vacío). Cambiar una plantilla no toca las rondas donde ya se aplicó.
- `POST /api/v1/tasks/:id/design` — diseño completo en un llamado. Ajuste: `{ items:[{ description, note?, before?:[archivo], after?:[archivo] }] }`. Prueba/Aceptación: `{ deliverables?:[archivo], templateId?, checks:[{ title, criteria?, category?, evidence?:[archivo] }] }` (crea la ronda 1 si no existe; el entregable es opcional).
- Crear la tarea: `POST /api/v1/projects/:id/tasks` con `type` = `ADJUSTMENT | QA | ACCEPTANCE`. En QA, `reviewerIds` (un asignado nunca es su revisor).
- Comentarios y preguntas: `POST /api/v1/tasks/:id/comments` (`scope`: task · adjustment_item · acceptance_check · qa_check · round · conversation; `targetId`; `body`; `mentions`; `attachments`; `poll:{multiple,options}` = pregunta radio/casillas) y `POST /api/v1/projects/:id/comments` (`project_conversation` · `project_definition`). Leer: `GET /api/v1/tasks/:id/threads` (en `conversation`/`qaChecks`, `text` va sin URLs; imágenes y archivos en `body` como marcas `[[img:url]]`, `[[file:url|nombre]]`), `GET /api/v1/polls/:id` (estadística), `POST /api/v1/polls/:id/vote`, `PATCH /api/v1/polls/:id {closed}`. Porcentaje = sobre personas que respondieron (múltiple puede pasar de 100 %).
- Link para el cliente: `POST|GET|DELETE /api/v1/tasks/:id/share-link` (y `/projects/:id/share-link`) → `path` `/share/<token>` (anteponer la URL del servidor). El cliente califica y acepta desde ahí; la API nunca lo hace por él.
- Cuidado: comentar con `mentions` en la conversación interna o en el hilo de una prueba avisa por WhatsApp a personas reales. No publicar comentarios de prueba.

## Flujo probado: prototipo interactivo → Prueba de Aceptación del cliente (2026-09-20)

Cuando pidan "un prototipo para que el cliente vea cómo va a ser y lo apruebe", el flujo completo que funcionó (modo `/solo-ya`) es:

1. **Prototipo**: un solo `.html`, sin backend, datos de ejemplo en `localStorage` (con try/catch y botón «Reiniciar demo»), menú tipo **Ribbon hecho a mano** (pestañas + grupos + botones grandes con icono; no hay librería Ribbon gratuita y estable para web, las existentes son comerciales), una **ruta por pantalla** (`#/pos`, `#/inventario`…) para dar link al punto exacto, y una función `window.SK` para poder armar estados desde el navegador al tomar capturas. Exponer los flujos reales del alcance (ej. turno → venta → factura simulada → inventario → cierre → reportes).
2. **SOLO tema claro y muy legible** (exigido por el usuario: «tema claro», «fácil de leer»): forzar `color-scheme: light` sin bloque oscuro ni botón de tema (el visor puede estar en oscuro), letra base 16px, `muted` oscuro con buen contraste, botones/tablas/inputs grandes. Nunca dejar que el tema del sistema decida.
3. **Publicar como Artifact** (privado; solo su dueño lo abre, lo comparte él desde Share — avisarlo). El archivo a publicar es un *fragmento*: quitar `<!doctype>`, `<html>`, `<head>`, `<meta>`, `<body>` (dejar `<title>`, `<link>` de Google Fonts, `<style>`, contenido, `<script>`). Republicar el mismo `file_path` mantiene la URL. No se puede comprobar desde aquí que un enlace con `#/ruta` llegue a la pantalla dentro del Artifact: en cada punto de la aceptación dar SIEMPRE también la ruta manual («pestaña X → botón Y»).
4. **Capturas** con Chrome DevTools sobre el archivo local (la petición explícita de «toma capturas» es la autorización del navegador para esa sesión): tema claro, ventana ~1366×1040, ocultar el toast antes de capturar, una captura por punto. Agrupar en pocas pasadas (evaluate + screenshot). Guardarlas en la carpeta scratchpad.
5. **Tarea `ACCEPTANCE`** en la fase correspondiente, con `description` = contexto y cómo calificar (sin listas de pasos), `deliverables` = link `https` del Artifact, y **un `check` por pantalla** con `criteria` (un paso por línea: link directo + pasos + qué opinar) y `evidence` = captura(s) subidas con `POST /api/upload`. Luego `POST /tasks/:id/share-link` y dar `BASE_URL + path` al usuario.
6. **Reemplazar capturas/checks ya cargados**: `GET /tasks/:id/design` → `DELETE /api/v1/checks/:checkId` (solo sin resultado) → `POST /api/v1/rounds/:roundId/checks {checks:[…]}`. Sirve si cambia el prototipo y hay que rehacer las imágenes.
7. **Insertar la aceptación en el cronograma**: `POST .../phases` SIEMPRE agrega la fase al final (la API no reordena; el orden por fecha sí es correcto, avisar que el orden visual de fases lo ajusta la persona en la app). Crear la tarea con `dependsOnTaskIds` = hito anterior, añadir `POST /tasks/:id/dependencies` desde la primera tarea de la fase siguiente, y mover esa con `POST /tasks/:id/move` al inicio requerido; verificar después las reglas de fechas (0 violaciones).

Otros hallazgos de esta sesión:
- Errores `500` o `405` esporádicos del hosting en la API (o con `urllib` sin User-Agent): reintentar con pausa; no significan error de permisos. Espaciar las llamadas (~0.5 s) en cargas masivas; una ráfaga rápida cortó la conexión y hay que reanudar sin duplicar (leer el estado antes).
- Un admin **puede** modificar un proyecto oculto por la API; las credenciales no lo impiden.
- Al crear un proyecto nuevo, `description`, objetivos y requerimientos van SIEMPRE llenos; si el proyecto aún no está oculto, la descripción va sin precios/márgenes internos y esos datos solo se suben tras ocultarlo. `.md` se sube a `/api/upload` tal cual (ver regla «Documentos de texto siempre en `.md`»).
- La numeración de contadores en resúmenes debe contarse, no asumirse (se dijo «24 requerimientos» y eran 29).
- **Prototipos para clientes, reglas del usuario**: (a) SIEMPRE con **transiciones suaves** para que no se vea brusco (fade/slide al cambiar de pantalla y de pestaña del Ribbon, diálogos, avisos, hover/active de botones, barras que crecen; solo al cambiar de pantalla, no en cada re-render; dentro de `@media (prefers-reduced-motion:no-preference)`); (b) omitir registro/login/roles/tipo de negocio salvo que los pidan: la demo arranca «ya con la sesión iniciada»; si se quita una pantalla, quitar también sus puntos de la aceptación y rehacer las capturas (que no aparezcan pestañas que ya no existen); (c) el archivo principal se llama **`index.html`** dentro de la carpeta del prototipo, para que pueda servirse tal cual en un hosting.
- **Lo que no se pueda hacer literal, se simula** (regla del usuario), pero **lo que el navegador sí permite se hace real**: imprimir (`window.print()` con CSS `@media print` que muestre solo el comprobante), descargar un archivo real (Blob + `<a download>`, p. ej. un XML de ejemplo marcado «simulado»), «Guardar como PDF» vía el diálogo de impresión, y `mailto:` con el mensaje armado. Todo dentro de try/catch con aviso (toast) de qué es simulado. Antes de dar un prototipo por «completo», **cruzarlo contra las tareas y RF de la entrega** (tabla cubierto/parcial/faltante) y ofrecer cerrar los huecos visibles (ej. costo y edición de producto, selector de período en reportes, comprobante imprimible).
- Cuidados al ampliar datos de demo: subir la versión de la clave de `localStorage` (`sk-proto-v2`…) para no mezclar con datos viejos; los gráficos SVG deben usar un `viewBox` ancho (~1000×300) para que el texto no se agrande al escalar, y las etiquetas se espacian (`ceil(n/10)`); evitar que botones, badges y celdas de stock se partan en dos líneas (`white-space:nowrap`).
- **Prototipo servido en hosting propio**: el usuario sube la carpeta; al recibir la URL, agregar el entregable con `POST /api/v1/rounds/:roundId/deliverables` (la API no permite borrar el anterior; lo quita la persona en la app) y rehacer los checks con links directos `URL/#/ruta` (guardar el script parametrizable por variable de entorno `URL`).
- Estilo de trabajo del usuario: pide modo `/solo-ya` y espera resultado; dar al final un reporte con qué se hizo, qué se asumió y qué dudas quedan, y actualizar esta skill con lo aprendido.

