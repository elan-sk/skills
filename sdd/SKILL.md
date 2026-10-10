---
name: sdd
description: 'Spec-Driven Development para desarrollar con spec, plan, tareas y validación RF por RF, con entrevista hasta no tener dudas e inventario de impacto. Modo PMSK: al pegar un link de tarea `/api/v1/claude-link/…` (botón "Conectar IA") para DESARROLLARLA; arma `docs/constitution.md` + `specs/NNN-nombre/` desde la cascada objetivos → requerimientos → fase → tarea y registra en PMSK (descripción, checklist, insumos, evidencias, comentario, estado). Con link de una Prueba, arma su plantilla (la «General» + los requisitos de la Especificación probada). Modo chat (sin link): para pedidos de desarrollo medianos o grandes por chat —funcionalidad nueva, cambio de datos o permisos, algo que toca varias partes de la app— o con `/sdd`; mismo flujo sin PMSK. No para ajustes chicos (un texto, un estilo, un botón). También para retomar una spec ("seguí con la spec 003", "en qué va la tarea X") y para cambios de alcance ("hay requerimientos nuevos", "agregale esto a la spec", "actualizá la especificación").'
---

# SDD (con o sin tarea de PMSK)

## REGLA DURA: cero comentarios en el código (usuario, 2026-10-09)

- No escribir **ningún** comentario en el código: ni explicaciones, ni notas de implementación, ni "guías" para la persona o para la IA. Sobre todo en el frontend: plantillas (Django/Twig/PHP/JSX), CSS, JS y config de build. Tampoco en archivos generados por un comando.
- Todo el racional, las decisiones y el contexto van a archivos `.md` del proyecto (`MEMORY.md` de la raíz, `design.md`, `docs/`, `specs/NNN-*/historial.md`), nunca al código.
- Al copiar código de otro proyecto, quitarle los comentarios.
- En plantillas Django/Wagtail, `{# #}` es de **una sola línea**: en varias líneas se imprime como texto en la página. Motivo: así quedaron impresos en la página de Estilos de Racafé.


La spec manda. Nada se implementa si no está en la spec; si falta una decisión, se para y se pregunta. Flujo:

**Conexión → Leer las fuentes → Constitución (1 vez por repo) → Spec → Clarificación → ⏸ aprobación → Plan → ⏸ aprobación → Tareas (+ insumos) → Implementación → Validación (+ capturas) → Registro en PMSK (evidencias, comentario, estado)**

Solo se para a pedir aprobación en los dos ⏸ (decisión del usuario 2026-10-01). Lo demás sigue solo, pero toda duda real que aparezca en cualquier fase se pregunta igual.

### Cómo se pide una aprobación (regla dura, decisión del usuario 2026-10-10)

Toda parada ⏸ se pide **con el formulario `AskUserQuestion`**, nunca con una pregunta suelta al final del texto: en texto no se distingue un pedido de aprobación de un simple informe. Aplica a la constitución, la spec, el plan, la lista de pruebas (modo Prueba) y los cambios de alcance.

- Antes del formulario, el resumen de lo que se aprueba y una línea que lo diga sin rodeos: «**Necesito su aprobación para seguir.**»
- Una sola pregunta, que nombre lo que se aprueba («¿Aprueba la Especificación 004?»), con estas opciones:
  - **Aprobar (Recomendado)** — se sigue con el paso siguiente, y la descripción dice cuál es.
  - **No aprobar** — no se avanza; se pregunta qué cambiar.
  - «Other» (lo agrega solo el formulario) — para aprobar con matices escritos; se aplican y, si cambian el fondo, se vuelve a pedir aprobación.
- Sin respuesta del formulario no hay aprobación: un mensaje que no responde a la pregunta no cuenta como «sí».
- Cuando un mensaje solo informa (avance, resultado, hallazgo) no lleva formulario ni termina en pregunta; se cierra diciendo qué sigue.

### Lecciones del simulacro en Racafé (2026-10-10)

- **Entrevista proporcional.** Si la persona dice que la tarea es sencilla o de ejemplo, no se hacen rondas de preguntas: se toman las opciones recomendadas, se anotan en «Decisiones tomadas en la entrevista» y se sigue. Las preguntas de responsive siguen siendo obligatorias solo cuando hay decisiones reales que tomar.
- **El diseño se lee de los insumos, no del Figma.** En plan gratuito, el conector de Figma agota las consultas en pocos llamados. Antes de pedirle nada, revisar si la tarea trae la imagen exportada y las medidas; si no las trae, pedirlas. Si se consulta Figma, hacerlo una sola vez por sección y con el nodo exacto.
- **Dirección base = la del link.** El texto del link puede anunciar otra URL base (por ejemplo `localhost:3000` cuando se abrió por otro puerto). Usar el origen con el que se abrió el link.
- **Simulacros y pruebas del flujo** se hacen en una instalación local de PMSK, nunca en producción.
- **Tarea de componente:** su criterio de finalización incluye el ejemplo en la página de pruebas del proyecto, además de la verificación.
- **Si un requisito se simplifica al implementar,** se corrige primero la especificación (y queda en el historial), después el código.

## Modos y cuándo usarla (decisión del usuario 2026-10-03)

- **Modo PMSK**: hay un link de tarea `/api/v1/claude-link/…`. Flujo completo, incluido todo lo que se registra en PMSK (pasos marcados «solo modo PMSK»).
- **Modo chat**: pedido de desarrollo por chat, sin link. Mismo flujo (fuentes → constitución → spec → clarificación → ⏸ → plan con inventario de impacto → ⏸ → tareas → implementación → validación), pero **sin nada de PMSK**: no hay conexión, ni checklist, ni insumos, ni comentario, ni estado. La spec vive igual en `specs/NNN-slug/` del repo y el cierre es el reporte en el chat con la tabla de validación.
- **Cuándo entra sola en modo chat**: pedidos medianos o grandes — funcionalidad nueva, cambio en el modelo de datos o en permisos, comportamiento de una entidad (proyecto, tarea, usuario…) que se ve en varias partes de la app, o más de ~3 archivos de lógica. **No** para ajustes chicos (un texto, un estilo, un botón, mover un elemento): esos van directo. Si hay duda, preguntar en una línea «¿Lo hago con SDD o directo?» antes de arrancar.
- Con `/sdd` o «hacelo con SDD» entra siempre, sea del tamaño que sea.
- **Modo Prueba**: el link es de una tarea de tipo Prueba (`type: "QA"`). No hay código que implementar: la spec define qué debe verificar el revisor y, al aprobarla, se arma su plantilla de pruebas. Ver «Modo Prueba» (decisión del usuario 2026-10-04).

Endpoints y reglas de la API: skill `pmsk` (y `.claude/skills/project-manager-sk/SKILL.md` del repo de PMSK, fuente de verdad). Esta skill no los repite.

## 0. Conexión y contexto (solo modo PMSK)

Modo chat: saltar este paso. El pedido del chat es el punto de partida; buscar si ya hay una spec del mismo tema en `specs/*/spec.md` (por título o palabras clave) y, si existe, retomarla.


1. Abrir el link con `curl -s "<link>"`. El token del link es la credencial de la API: guardarlo **solo en memoria**, nunca en archivos, specs, historial ni salida visible. El link es reutilizable (reabrirlo trae el estado actualizado de la tarea) y vale hasta que la tarea se completa o pasan 7 días sin uso; `410`/`401` → pedir uno nuevo.
2. La respuesta trae la tarea en JSON con la cascada: `phase.requirements[].objectives[]`, más `project`, asignados, checklist (`steps`), dependencias y descripción. Si la fase no tiene requerimientos vinculados, decirlo y preguntar el "para qué" en la entrevista; no inventarlo.
3. Raíz del repo = `git rev-parse --show-toplevel`. Buscar si ya existe una spec de esta tarea: `grep -rl "<taskId>" specs/*/spec.md`. Si existe, **retomar** (ver "Retomar") en vez de crear otra.
4. Pasar la tarea a `COMPLETED` desactiva el link: hacerlo como **último** llamado del cierre. En otra sesión (retomar), pedir que la persona pegue de nuevo el mismo link; sigue sirviendo si no pasaron 7 días sin uso.

## 0.5 Leer las fuentes (siempre, antes de la entrevista)

Modo chat: las fuentes son lo que la persona escribió, pegó o adjuntó en la conversación, `MEMORY.md`/`AGENTS.md` del repo y el código que toca el pedido; los puntos 1-2 de abajo (archivos de PMSK) no aplican.


Lo que ya existe en PMSK es contexto de la tarea: leerlo entero antes de preguntar o especificar (decisión del usuario 2026-10-01).

1. **Listar**: `GET /api/v1/tasks/:id/attachments` (Insumos y Evidencias de la tarea, incluidos los de pasos del checklist), `GET /api/v1/projects/:id/attachments` (archivos del proyecto), `GET /api/v1/projects/:id/links` (enlaces del proyecto) y `GET /api/v1/tasks/:id/threads` (conversación interna y comentarios con el cliente: suelen traer pedidos y decisiones).
2. **Descargar** cada archivo al scratchpad (`curl -s -o <scratchpad>/fuentes/<nombre> "<BASE><url>"`) y **leerlo**:
   - Imágenes y PDF: con la herramienta de lectura (PDF por páginas si es largo).
   - `.md`, `.txt`, `.csv`, `.html`: como texto.
   - `.docx` / `.xlsx` / `.pptx`: extraer el texto con `python3` + `zipfile` (`word/document.xml`, `xl/sharedStrings.xml` + `xl/worksheets/*.xml`, `ppt/slides/*.xml`), quitando etiquetas.
   - `.doc` / `.xls` / `.ppt` antiguos o lo que no se pueda abrir: no inventar el contenido; decirlo y preguntar en la entrevista qué contiene o pedir otro formato.
   - Enlaces: abrir solo si son públicos y relevantes; un video o un enlace privado se nombra en la spec sin suponer qué tiene.
   - Componente o instructivo de la biblioteca (`biblioteca.depura-creatividad.com`): no abrirlo como página web; cargar la skill `biblioteca-depura` y leerlo con su protocolo (`$B entrada <id>`; sin id en el enlace, `$B indice` filtrando por el título). Usar su código/estructura y respetar sus instructivos obligatorios.
3. **Barrido en la biblioteca** (siempre, aunque ningún insumo la nombre — decisión del usuario 2026-10-04): con la skill `biblioteca-depura`, un `$B indice` filtrado por el stack del repo y las palabras clave de la tarea, y abrir solo los 1–3 candidatos que apliquen. Rápido, sin anunciarlo largo. Si algo sirve, va a la spec como fuente («Basado en *X*, #id»); si no hay nada, se anota en una línea en `historial.md`. Sin token o sin conexión: decirlo y seguir. En modo PMSK, el proyecto del link es el `proyecto` de la biblioteca (decisión del usuario 2026-10-10): incluir en el barrido lo que ese proyecto ya tiene documentado y, si de la tarea sale algo para documentar, clasificarlo con ese proyecto según la regla de la skill `biblioteca-depura`. **Alcance acotado** (decisión del usuario 2026-10-10): si el proyecto de PMSK tiene entre sus enlaces (`links` de `GET /projects/:id`, que no vienen en el link de tarea) el archivo de un proyecto u otro eje de la biblioteca, este barrido NO recorre el índice completo: se limita a las entradas de ese enlace (`$B url <enlace>`) y a las normas obligatorias del stack. Sin ese enlace, el barrido es el de siempre.
4. **Usar**: cada dato que salga de una fuente va a la spec con su origen; si una fuente contradice la descripción de la tarea u otra fuente, se pregunta en la entrevista cuál manda. Lo que las fuentes ya responden no se pregunta.
5. Los archivos descargados quedan solo en el scratchpad: no se copian al repo salvo que el plan lo requiera (ej. datos de ejemplo como fixture de tests) y no se vuelven a subir a Insumos (ya están en PMSK).
6. Anotar en `historial.md` qué fuentes se leyeron y cuáles no se pudieron leer.

## 1. Constitución (solo si falta `docs/constitution.md`)

Leer `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `package.json`/manifiestos y una muestra del código. Proponer 6-8 principios innegociables, cortos y **verificables**, sacados del proyecto real (stack, cómo se verifica —tsc/lint/scripts/tests existentes—, reutilizar antes de construir, datos del usuario, idioma, reglas del CLAUDE.md global que apliquen). Máx. 20 líneas. Escribir el archivo solo después de la aprobación. Agregar en `AGENTS.md` una línea: «Leer `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.»

## 2. Spec — `specs/NNN-slug/spec.md`

`NNN` = siguiente número libre en `specs/` (001, 002…); `slug` = título de la tarea en kebab-case corto.

### Entrevista: no quedarse con ninguna duda

Antes de escribir, cruzar la cascada, las fuentes leídas (0.5) y el código, y listar lo que falta. Preguntar **siempre con `AskUserQuestion`**: hasta 4 preguntas por llamada, cada una con 2-4 opciones concretas ya pensadas (la recomendada primero, con «(Recomendado)» y su porqué en la descripción). Usar `preview` cuando ayude a comparar (mockup ASCII, ejemplo de texto o de dato). Hacer tantas rondas como hagan falta, sin tope, pero sin preguntar lo que el código, la cascada o una convención del proyecto ya responden: eso se asume y se dice.

Cubrir, como mínimo, lo que aplique:
- **Para qué**: qué problema resuelve y qué objetivo o requerimiento de PMSK cumple; cómo se nota que funcionó.
- **Quién**: roles/permisos que lo usan, ven o no deben verlo.
- **Qué hace**: flujo principal paso a paso, entradas, salidas, textos visibles.
- **Errores**: qué pasa si falla, si falta un dato o si no hay permiso (el «SI… ENTONCES» que la IA suele olvidar).
- **Casos límite**: vacíos, duplicados, muchos datos, concurrencia, fechas/zonas horarias, móvil.
- **Datos**: qué se guarda, migraciones y compatibilidad con datos existentes.
- **Fuera de alcance**: qué NO se hace en esta iteración.
- **Verificación**: cómo se comprueba cada requisito (qué se prueba sin navegador y qué queda para prueba visual).
- **Responsive** (obligatorio si el pedido es construir o cambiar un componente o una pantalla; decisión del usuario 2026-10-10): no se asume, se pregunta. Por cada punto de quiebre del proyecto (los reales del repo, no de memoria): qué cambia de la composición (columnas, orden, qué se apila), qué se oculta o se reemplaza (menú, slider en vez de grilla, texto recortado), tamaños de imagen y proporción, y cómo se comporta lo interactivo en táctil (hover, arrastre, flechas). Si hay diseño móvil o de tablet en las fuentes, manda ese; si solo hay escritorio, proponer el comportamiento con `preview` (mockup ASCII por tamaño) y confirmarlo. Las respuestas van a la spec como RF verificables por ancho.

### Plantilla

```
# Especificación NNN — <Título de la tarea>

Estado: borrador | aprobada | implementada

| | |
|---|---|
| Proyecto | <nombre del proyecto> |
| Tarea | <título de la tarea> |
| Fase | <nombre de la fase> |
| Ver en PMSK | <BASE_URL>/projects/<projectId>/tasks/<taskId> |
| Ids internos | tarea `<taskId>` · proyecto `<projectId>` |

(Modo chat: la tabla es solo `| Origen | Pedido por chat, <fecha> |` y en vez de «Trazabilidad (cascada PMSK)» va «Pedido original»: el texto de la persona citado tal cual, más lo que se acordó en la entrevista.)

## Trazabilidad (cascada PMSK)
- Objetivo(s): <título> — <descripción breve>
- Requerimiento(s): <título> — <descripción breve>
- Fase: <nombre>
- Tarea: <título> — <descripción original resumida>

## Fuentes
- <nombre del archivo, enlace o conversación> (<dónde está: Insumos de la tarea / archivos del proyecto / conversación>) — <qué se tomó de ahí>
- <archivo que no se pudo leer> — no se pudo leer: <por qué>; se preguntó en la entrevista

## Contexto y objetivo
## Usuarios
## Historias de usuario
- HU-1. Como <rol>, quiero <acción> para <beneficio>.
## Definiciones (solo si hay términos ambiguos)
## Requisitos funcionales (EARS)
- RF-1: CUANDO <evento>, EL SISTEMA <respuesta>.
- RF-2: SI <condición no deseada>, ENTONCES EL SISTEMA <respuesta>.
- RF-3: MIENTRAS <estado>, EL SISTEMA <respuesta>.
- RF-4: EL SISTEMA <comportamiento permanente>.
## Requisitos no funcionales
## Casos límite
## Fuera de alcance
## Criterios de finalización
## Decisiones tomadas en la entrevista
- <pregunta> → <respuesta> (por qué)
## Cambios (solo si la spec cambió después de aprobada)
- <fecha> — <qué cambió: RF nuevos/modificados/retirados> (<motivo o quién lo pidió>)
## Dudas abiertas
- [NECESITA ACLARACIÓN] <duda>
```

**Al usuario, en español:** «spec» es el término interno (carpetas, `spec.md`, conversación con el usuario); en todo lo que se ve en PMSK —título del documento, nombre del archivo subido, descripción, checklist y comentarios— se dice «Especificación» (regla del usuario, 2026-10-01).

Nombres antes que ids: en la spec y en todo documento que se suba a PMSK, proyecto, tarea, fase, requerimientos y personas se nombran como se ven en la app; los ids van solo como dato técnico secundario (regla del usuario, 2026-10-01).

La spec es el QUÉ y el POR QUÉ: nada de archivos, stack ni arquitectura. Cada RF debe poder verificarse: nada de «rápido», «bonito» o «claro» sin un criterio medible.

### Clarificación (autorrevisión antes de mostrarla)

Revisar la spec como QA: ambigüedades, contradicciones, casos límite sin cubrir, conflictos con la constitución y RF sin traza a la cascada. Lo que salga se pregunta (otra ronda de `AskUserQuestion`) y se corrige. **No presentar la spec con un solo `[NECESITA ACLARACIÓN]`.**

⏸ **Aprobación 1**: mostrar la spec resumida (RF en una lista) y pedir aprobación con el formulario (ver «Cómo se pide una aprobación»). Aprobada → `Estado: aprobada`.

## 3. Plan — `plan.md`

Leer el código que se toca, de punta a punta.

**Inventario de impacto (obligatorio, va primero en el plan):** por cada entidad o comportamiento que cambia, buscar en el repo (`grep` de modelo, campos, helpers de consulta) **todos** sus consumidores y listarlos uno por uno: pantallas y listas, buscador, filtros, reportes y métricas, API, chat/bot, exportaciones y backups, permisos y visibilidad, y los **invisibles**: tareas programadas, colas, resúmenes y avisos (WhatsApp, notificaciones, correo). Cada uno queda marcado ✅ «se ajusta» (con el RF que lo cubre) o ➖ «no aplica, porque…». Si aparece un consumidor que la spec no contempla, se pregunta y va a la spec antes de seguir. Motivo (2026-10-03): al archivar proyectos quedó afuera la cola de alertas de WhatsApp al grupo por no inventariar los consumidores invisibles.

Resto del contenido: archivos que se crean o modifican y su responsabilidad; **qué se reutiliza** de lo existente (buscar antes de crear y decir explícitamente si algo se construye desde cero); lógica principal en pseudocódigo; interfaz; decisiones técnicas con su alternativa descartada y por qué; migraciones/datos; estrategia de verificación con las herramientas **reales** del repo (tsc, lint, scripts `verify:*`, tests existentes; si no hay tests, un chequeo ejecutable mínimo). Al lado de cada parte, qué RF cubre: ningún RF puede quedar sin parte del plan. Si algo resulta inviable al leer el código, decirlo ya y volver a la spec, no seguir.

⏸ **Aprobación 2**: mostrar el plan resumido y pedir aprobación con el formulario.

## 4. Tareas — `tasks.md` (+ PMSK solo en modo PMSK)

```
- [ ] **T1. <Descripción>.** RF-1, RF-2
  - Hecho cuando: <comprobación verificable>.
```

Pequeñas (20-30 min), en orden de dependencia. Si salen más de 10, proponer dividir la spec.

Al crearlas, en modo PMSK, registrar en PMSK (decisión del usuario 2026-10-01; en modo chat, solo `tasks.md`):
- **Estado** → `IN_PROGRESS` (`PATCH /tasks/:id {status}`), si no lo está ya.
- **Checklist** = `tasks.md`: un `POST /tasks/:id/steps {description}` por tarea, con el texto «T1. <Descripción>». Antes, `GET /tasks/:id/steps`: no duplicar pasos que ya existan; si ya hay checklist propio de la persona, dejarlo y agregar solo los de la spec. Guardar el `stepId` de cada T en `tasks.md` (`<!-- step:<id> -->`) para marcarlo después.
- **Descripción**: agregar al final de la existente (nunca reemplazarla) una sección HTML `<h3>Especificación</h3>` con objetivo, criterios de aceptación (los RF en lenguaje simple) y fuera de alcance. Sin listas de pasos (eso es el checklist).
- **Insumos** (ver «Archivos en PMSK»): subir los archivos usados como fuente que **todavía no estén en PMSK** — los que la persona compartió por el chat o señaló (documentos, imágenes, maquetas, datos de ejemplo); lo leído en 0.5 ya está ahí y no se duplica — y la `spec.md` aprobada (se sube como `.md`; el visor la muestra con formato). Tras subirla, `GET /tasks/:id/attachments` y guardar el id de ese insumo en `historial.md` (`<!-- spec-attachment:<id> -->`): con él se reemplaza en su lugar cuando la spec cambie.

Textos que van a PMSK: de usted, tercera persona o impersonal, cordiales, sin jerga técnica (los lee el equipo y a veces el cliente); rótulos en negrita (reglas de la skill `pmsk`).

## 5. Implementación

Una tarea a la vez y en orden. Primero la comprobación (test o chequeo ejecutable que falle), luego el código, y correr la verificación del plan. Al cerrar cada T:
- marcarla `[x]` en `tasks.md`;
- en modo PMSK, `PATCH /tasks/:id/steps/:stepId {done:true}`;
- anotarla en `historial.md`.

Si aparece un archivo fuente nuevo (la persona comparte otra imagen o documento), subirlo también a Insumos. Prohibido avanzar con la verificación en rojo. Si aparece algo que la spec no cubre, **parar y preguntar**. Si se decide cambiarlo, el cambio va primero a la spec, luego al plan y a las tareas, y recién después al código (spec viva): seguir «Cambios de alcance». Browser: solo con autorización del usuario (regla global).

## 6. Validación

Recorrer la spec RF por RF en una tabla (y repasar el inventario de impacto: cada consumidor ✅ verificado, no solo planeado): RF · cómo se verificó (comando, test o lectura de código) · resultado (✅ / ❌ / ⚠️ sin probar visualmente). Luego los criterios de finalización. Veredicto honesto: «spec cumplida» solo si todos los RF están en ✅. Lo que no se pudo verificar se dice como tal, nunca se da por bueno. Si hay ❌, se corrige (vuelve a 5) antes de cerrar, o se reporta si requiere una decisión del usuario.

Spec cumplida → `Estado: implementada`.

**Capturas de las pruebas en Chrome** (si la persona autorizó el navegador): `take_screenshot` con `filePath` en el scratchpad, una por RF de interfaz o por estado relevante, nombradas `RF-n-<que-muestra>.png` (ej. `RF-2-racha-tras-registrar.png`). Antes de capturar, que la pantalla no muestre datos sensibles ni de otros clientes (las ve el cliente). Se suben a Evidencias en el cierre.

## 7. Registro de cierre en PMSK (solo modo PMSK)

Modo chat: el cierre es el reporte en el chat — tabla de validación, inventario de impacto, qué quedó sin probar y pendientes. Nada se commitea sin pedido.


Orden: evidencias → comentario de cierre → estado (el último, porque completar la tarea bloquea subir archivos y desactiva el link).

- **Evidencias** (`kind: "RESULTADO"`, ver «Archivos en PMSK»), según el tipo de entregable (regla del usuario, 2026-10-06):
  - **Documento** (informe, guía, acta, análisis, propuesta…): el documento mismo va a Evidencias, en `.md`. Es el resultado de la tarea. Se sube **siempre y sin preguntar**, en especial en tareas tipo **Entregable** (`MILESTONE`): la app no deja completarlas sin al menos una Evidencia.
  - **Código**: el código queda en el repo (no se sube). A Evidencias van las capturas de la validación, solo si se autorizó el navegador; si no hubo prueba en navegador, no se inventan capturas: decirlo en el comentario.
- **Comentario de cierre**: `POST /tasks/:id/comments {scope:"task", body}`, en texto plano con rótulos `*así:*`. Contenido: *Qué se hizo*, *Validación* (cada RF en una línea con ✅/⚠️), *Decisiones tomadas* y *Pendiente* (si hay algo). Sin `mentions` (avisan por WhatsApp). Ojo: el `scope:"task"` lo ve el cliente por su link, así que nada interno ni técnico.
- **Estado** → `COMPLETED` **solo** si el veredicto es «spec cumplida». Si la API responde 409 (checklist incompleto, falta evidencia, ronda de QA), informar el motivo exacto y no forzarlo.
- Si la tarea es de tipo QA/ACCEPTANCE/ADJUSTMENT, su cierre lo deciden las rondas o el cliente: no cambiar el estado; solo comentar.

## Modo Prueba (link de una tarea de tipo Prueba)

Para que el revisor tenga presente la funcionalidad pedida, no solo lo genérico. Solo cuando el link pegado es de la propia tarea de Prueba (decisión del usuario 2026-10-04); en el SDD de una tarea de desarrollo no se toca ninguna Prueba.

Flujo: **Conexión → Fuentes → Spec de la prueba → Clarificación → ⏸ aprobación → Plantilla → Registro**. Sin constitución, plan, `tasks.md` ni implementación (no hay código).

1. **Tarea que se prueba**: la predecesora de la Prueba (dependencias del JSON del link). Varias → preguntar cuál o si son todas; ninguna → preguntar qué se prueba. Su **Especificación** es la fuente principal: `specs/*/spec.md` del repo con su `taskId`, o el insumo `especificacion-*.md` de esa tarea (`GET /tasks/:id/attachments`, descargarlo y leerlo). Si no tiene, sirven su descripción, checklist e insumos, y se pregunta lo que falte.
2. **Spec de la prueba** (`specs/NNN-prueba-<slug>/spec.md`, misma plantilla): «Trazabilidad» apunta a la tarea probada y a su Especificación. Cada **RF de la tarea probada** se convierte en una prueba verificable: título corto (lo que se prueba) + criterios, un punto por línea, con el resultado esperado observable (qué se hace y qué se tiene que ver). También los casos límite y los «SI… ENTONCES» de errores y permisos. Nada genérico acá (responsive, navegadores…): eso viene de la plantilla General.
3. ⏸ **Aprobación**: mostrar la lista de pruebas que saldrán (título + criterios) junto con las de la General que se suman.
4. **Plantilla** (API de plantillas de la skill `pmsk`). Exige que el dueño del link sea revisor en alguna tarea, PM o admin (misma regla que en la web); si la API responde 403, decirlo y pedir que lo haga alguien con ese permiso o que se le asigne el rol; no seguir sin plantilla. Borrar ítems o plantillas es solo de admin.
   - `GET /api/v1/test-templates` → buscar la plantilla llamada **«General»** (sin distinguir mayúsculas). Si no existe, decirlo y seguir solo con las de la spec; nunca crearla por cuenta propia (sus ítems los define en Configuración → Pruebas un revisor, PM o admin; un miembro sin ese permiso solo la ve).
   - `POST /api/v1/test-templates` con `name: "Pruebas — <título de la tarea probada>"` e `items`: primero los de la General (copiados tal cual, con su categoría), después los de la spec con `category: "Funcionalidad pedida"`. Guardar en `historial.md` `<!-- template:<id> -->` y los ids de los ítems junto al RF que los originó.
   - Si la Prueba **no tiene ronda todavía**: `PUT /api/v1/tasks/:id/review/default-template {templateId}` → se copia sola a la ronda 1 cuando el ejecutor la envíe a revisión. Si quien hace el SDD crea él mismo la tarea de Prueba, mejor pasarle `defaultTestTemplateId` al crearla. Enviar a revisión ya no exige entregable (desde 2026-10-06): la Prueba puede quedar lista con su plantilla antes de que el ejecutor la envíe.
   - Si la **ronda 1 ya existe y está abierta**: además `POST /api/v1/rounds/:roundId/apply-template {templateId}` (idempotente).
5. **Registro**: subir la spec de la prueba a Insumos de la Prueba (`especificacion-NNN-prueba-<slug>.md`) y un comentario `scope:"task"` con *Pruebas preparadas*: cuántas vienen de la General y cuántas de la funcionalidad pedida, en lenguaje simple. El estado de una Prueba lo deciden sus rondas: no cambiarlo.
6. **Cambios** (spec de la tarea probada o de la prueba): editar la spec de la prueba (como en «Cambios de alcance») y la plantilla de la tarea: ítem nuevo `POST /test-templates/:id/items`, cambiado `PATCH /test-template-items/:itemId`, retirado → `DELETE` solo si es admin; si no, reescribirlo con el título «(Retirada) …». Si la ronda ya existe, reaplicar con `apply-template` (solo agrega lo nuevo; lo cambiado en una ronda abierta se edita con `PATCH /checks/:checkId`).

## Cambios de alcance (spec viva)

Cuando aparecen requerimientos nuevos, adiciones o cambios sobre una spec ya montada (al retomar, a mitad de la implementación o después de la validación). Se edita lo existente; nunca se crea otra spec ni otra copia del `.md` para la misma tarea.

1. **Entender el cambio**: leer las fuentes nuevas (0.5, solo lo nuevo) y entrevistar con `AskUserQuestion` **solo sobre lo que cambia** y su impacto (qué RF toca, qué T ya hechas se ven afectadas, si algo queda fuera de alcance).
2. **Spec**: editar `spec.md` en su lugar. RF nuevos con el siguiente número libre (no se renumeran los existentes); RF modificados se reescriben; RF retirados se tachan (`~~RF-3: …~~ (retirado <fecha>)`), no se borran, para no romper la traza. Una línea en «Cambios» con fecha y motivo. `Estado: aprobada` vuelve a ser `borrador` hasta la aprobación. Hacer la clarificación (autorrevisión) sobre lo cambiado.
3. ⏸ **Aprobación del cambio**: mostrar solo la diferencia (RF nuevos / modificados / retirados). Si cambia el plan, actualizar `plan.md` y pedir su aprobación en la misma ronda.
4. **`tasks.md`**: T nuevas al final con el siguiente número; T cuyo texto cambia se reescriben; T que ya no aplican se tachan. Una T ya hecha que el cambio invalida no se desmarca: se agrega una T nueva que la corrija.
5. **Sincronizar PMSK** (solo modo PMSK; todo con la API; ver «Archivos en PMSK»):
   - **Especificación (.md)**: subir la nueva versión a `/api/upload` con el mismo nombre (`especificacion-NNN-slug.md`) y `PUT /tasks/:id/attachments/<spec-attachment> {url,name,mimeType}` → reemplaza el archivo en su mismo lugar (no se duplica). Si no se tiene el id, buscarlo por nombre en `GET /tasks/:id/attachments`. Si responde 403 (lo subió otra persona) o 404, subirla como insumo nuevo y avisarlo; nunca borrar archivos ajenos.
   - **Descripción**: `GET /tasks/:id`, reemplazar **solo** la sección `<h3>Especificación</h3>` (desde ese título hasta el siguiente `<h3>` o el final) por la versión actualizada y `PATCH /tasks/:id {description}`. El resto del texto de la persona queda idéntico; si la sección no existe, se agrega al final.
   - **Checklist**: T nuevas → `POST /tasks/:id/steps`; T con texto cambiado → `PATCH /tasks/:id/steps/:stepId {description}`; T retiradas sin hacer → `DELETE /tasks/:id/steps/:stepId`. Solo pasos con `<!-- step:<id> -->` en `tasks.md`: los pasos propios de la persona y los ya hechos no se editan ni se quitan.
   - **Comentario**: `POST /tasks/:id/comments {scope:"task"}` con *Cambio en la especificación:* qué se agregó, cambió o retiró, en lenguaje simple.
   - Si la tarea está `COMPLETED`, el link de «Conectar IA» ya no sirve y la API rechaza cambios de archivos (409): pedir que la persona la reabra desde la app (estado «En curso») y pegue un link nuevo; no forzarlo.
6. **Historial**: una línea por cada paso anterior (qué cambió, aprobación, qué se actualizó en PMSK). Luego seguir con Implementación sobre las T nuevas o cambiadas.

## Archivos en PMSK (Insumos y Evidencias)

**Documentos de texto siempre en `.md`** (regla del usuario, 2026-10-01): todo documento que Claude redacte y suba a PMSK (specs, informes, actas, guías, notas, instructivos) va como `.md` — nunca `.txt` ni `.docx` generado. El visor de la app muestra `.md` con formato (títulos, listas, tablas). Los archivos que aporta la persona se suben tal como vienen, sin convertirlos.

1. Subir cada archivo: `curl -s -H "Authorization: Bearer $T" -F "file=@<ruta>" <BASE>/api/upload` → `{ url, name, mimeType }`.
2. Asociarlos a la tarea: `POST /api/v1/tasks/:id/attachments {kind, files:[{url,name,mimeType}]}` — `kind: "INSUMO"` (Insumos) o `"RESULTADO"` (Evidencias); hasta 20 archivos por llamado.

- Tipos aceptados: png, jpg, jpeg, webp, gif, pdf, doc(x), xls(x), ppt(x), txt, csv, md; máx. 20 MB. La spec va con un nombre que la identifique: `-F "file=@spec.md;filename=especificacion-NNN-slug.md"`. El visor de la app muestra `.md` con formato, `.csv` como tabla y `.txt` como texto.
- **Los ve el cliente** por el link compartido de la tarea: nunca subir `.env`, claves, tokens, credenciales, precios internos ni datos de otros clientes. Nada de `plan.md`, `tasks.md` ni `historial.md` (son internos/técnicos y el checklist ya refleja las tareas).
- **Archivo de más de 20 MB** (o la subida responde 413): protocolo «Archivo demasiado grande» de la skill `pmsk` (link en vez de archivo, se recomienda Drive).
- Una tarea `COMPLETED` rechaza archivos (409): subir antes de completarla.
- Antes de subir, `GET /api/v1/tasks/:id/attachments` para no duplicar un archivo con el mismo nombre (al retomar).
3. Reemplazar o quitar un archivo propio: `PUT /api/v1/tasks/:id/attachments/:attachmentId {url,name,mimeType}` (lo reemplaza en su mismo lugar) / `DELETE` (lo quita). Solo funciona con archivos que subió el mismo usuario del token (403 si no).
- Anotar en `historial.md` qué se subió y a dónde.

## Historial — `specs/NNN-slug/historial.md`

Bitácora con fecha, una línea por evento: preguntas y respuestas clave, aprobaciones, cada T cerrada, verificaciones corridas con su resultado, cambios de spec y qué se registró en PMSK. Sirve para retomar en otra sesión. Además, actualizar `MEMORY.md` del repo (si existe) al cerrar cada fase, solo con decisiones o restricciones que valgan más allá de esta spec.

## Retomar

Con la spec existente: leer `spec.md` (Estado), `plan.md`, `tasks.md` y `historial.md`, decir en 3 líneas en qué fase está, cuántas T van hechas de cuántas y el siguiente paso, y continuar desde ahí. Si la tarea en PMSK cambió desde la última vez (descripción, cascada, insumos o comentarios nuevos), mostrar la diferencia y preguntar si cambia la spec; si cambia, seguir «Cambios de alcance».

## Nunca

- Escribir el token en un archivo o mostrarlo.
- Implementar sin las dos aprobaciones, o algo que no esté en la spec.
- Commit o push sin pedido explícito.
- Reemplazar la descripción de la tarea, borrar pasos del checklist de la persona, o marcar `COMPLETED` con RF en ❌ o sin verificar.
- Subir a Insumos o Evidencias algo sensible, o capturas que no salgan de una prueba real.
