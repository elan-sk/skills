---
name: sdd-pmsk
description: 'Desarrollar una tarea de ProjectManagerSK (PMSK) con Spec-Driven Development: al pegar un link de tarea `/api/v1/claude-link/<token>` (botón "Conectar IA") para DESARROLLARLA, o con `/sdd-pmsk`, arma en el repo actual `docs/constitution.md` + `specs/NNN-nombre/` (spec, plan, tareas, historial) a partir de la cascada objetivos → requerimientos → fase → tarea, entrevista con opciones hasta no tener dudas, implementa, valida RF por RF contra la spec y registra el resultado en la tarea de PMSK (descripción, checklist, comentario de cierre, estado). También para retomar una spec a medias ("seguí con la spec 003", "en qué va la tarea X").'
---

# SDD con tareas de PMSK

La spec manda. Nada se implementa si no está en la spec; si falta una decisión, se para y se pregunta. Flujo:

**Conexión → Constitución (1 vez por repo) → Spec → Clarificación → ⏸ aprobación → Plan → ⏸ aprobación → Tareas → Implementación → Validación → Registro en PMSK**

Solo se para a pedir aprobación en los dos ⏸ (decisión del usuario 2026-10-01). Lo demás sigue solo, pero toda duda real que aparezca en cualquier fase se pregunta igual.

Endpoints y reglas de la API: skill `pmsk` (y `.claude/skills/project-manager-sk/SKILL.md` del repo de PMSK, fuente de verdad). Esta skill no los repite.

## 0. Conexión y contexto

1. Abrir el link con `curl -s "<link>"`. El token del link es la credencial de la API: guardarlo **solo en memoria**, nunca en archivos, specs, historial ni salida visible. El link es reutilizable (reabrirlo trae el estado actualizado de la tarea) y vale hasta que la tarea se completa o pasan 7 días sin uso; `410`/`401` → pedir uno nuevo.
2. La respuesta trae la tarea en JSON con la cascada: `phase.requirements[].objectives[]`, más `project`, asignados, checklist (`steps`), dependencias y descripción. Si la fase no tiene requerimientos vinculados, decirlo y preguntar el "para qué" en la entrevista; no inventarlo.
3. Raíz del repo = `git rev-parse --show-toplevel`. Buscar si ya existe una spec de esta tarea: `grep -rl "<taskId>" specs/*/spec.md`. Si existe, **retomar** (ver "Retomar") en vez de crear otra.
4. Pasar la tarea a `COMPLETED` desactiva el link: hacerlo como **último** llamado del cierre. En otra sesión (retomar), pedir que la persona pegue de nuevo el mismo link; sigue sirviendo si no pasaron 7 días sin uso.

## 1. Constitución (solo si falta `docs/constitution.md`)

Leer `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `package.json`/manifiestos y una muestra del código. Proponer 6-8 principios innegociables, cortos y **verificables**, sacados del proyecto real (stack, cómo se verifica —tsc/lint/scripts/tests existentes—, reutilizar antes de construir, datos del usuario, idioma, reglas del CLAUDE.md global que apliquen). Máx. 20 líneas. Escribir el archivo solo después de la aprobación. Agregar en `AGENTS.md` una línea: «Leer `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.»

## 2. Spec — `specs/NNN-slug/spec.md`

`NNN` = siguiente número libre en `specs/` (001, 002…); `slug` = título de la tarea en kebab-case corto.

### Entrevista: no quedarse con ninguna duda

Antes de escribir, cruzar la cascada con el código y listar lo que falta. Preguntar **siempre con `AskUserQuestion`**: hasta 4 preguntas por llamada, cada una con 2-4 opciones concretas ya pensadas (la recomendada primero, con «(Recomendado)» y su porqué en la descripción). Usar `preview` cuando ayude a comparar (mockup ASCII, ejemplo de texto o de dato). Hacer tantas rondas como hagan falta, sin tope, pero sin preguntar lo que el código, la cascada o una convención del proyecto ya responden: eso se asume y se dice.

Cubrir, como mínimo, lo que aplique:
- **Para qué**: qué problema resuelve y qué objetivo o requerimiento de PMSK cumple; cómo se nota que funcionó.
- **Quién**: roles/permisos que lo usan, ven o no deben verlo.
- **Qué hace**: flujo principal paso a paso, entradas, salidas, textos visibles.
- **Errores**: qué pasa si falla, si falta un dato o si no hay permiso (el «SI… ENTONCES» que la IA suele olvidar).
- **Casos límite**: vacíos, duplicados, muchos datos, concurrencia, fechas/zonas horarias, móvil.
- **Datos**: qué se guarda, migraciones y compatibilidad con datos existentes.
- **Fuera de alcance**: qué NO se hace en esta iteración.
- **Verificación**: cómo se comprueba cada requisito (qué se prueba sin navegador y qué queda para prueba visual).

### Plantilla

```
# Spec NNN — <Título de la tarea>

Estado: borrador | aprobada | implementada
PMSK: tarea <taskId> · proyecto <projectId> · <BASE_URL>/projects/<projectId>/tasks/<taskId>

## Trazabilidad (cascada PMSK)
- Objetivo(s): <título> — <descripción breve>
- Requerimiento(s): <título> — <descripción breve>
- Fase: <nombre>
- Tarea: <título> — <descripción original resumida>

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
## Dudas abiertas
- [NECESITA ACLARACIÓN] <duda>
```

La spec es el QUÉ y el POR QUÉ: nada de archivos, stack ni arquitectura. Cada RF debe poder verificarse: nada de «rápido», «bonito» o «claro» sin un criterio medible.

### Clarificación (autorrevisión antes de mostrarla)

Revisar la spec como QA: ambigüedades, contradicciones, casos límite sin cubrir, conflictos con la constitución y RF sin traza a la cascada. Lo que salga se pregunta (otra ronda de `AskUserQuestion`) y se corrige. **No presentar la spec con un solo `[NECESITA ACLARACIÓN]`.**

⏸ **Aprobación 1**: mostrar la spec resumida (RF en una lista) y pedir aprobación. Aprobada → `Estado: aprobada`.

## 3. Plan — `plan.md`

Leer el código que se toca, de punta a punta. Contenido: archivos que se crean o modifican y su responsabilidad; **qué se reutiliza** de lo existente (buscar antes de crear y decir explícitamente si algo se construye desde cero); lógica principal en pseudocódigo; interfaz; decisiones técnicas con su alternativa descartada y por qué; migraciones/datos; estrategia de verificación con las herramientas **reales** del repo (tsc, lint, scripts `verify:*`, tests existentes; si no hay tests, un chequeo ejecutable mínimo). Al lado de cada parte, qué RF cubre: ningún RF puede quedar sin parte del plan. Si algo resulta inviable al leer el código, decirlo ya y volver a la spec, no seguir.

⏸ **Aprobación 2**: mostrar el plan resumido y pedir aprobación.

## 4. Tareas — `tasks.md` + PMSK

```
- [ ] **T1. <Descripción>.** RF-1, RF-2
  - Hecho cuando: <comprobación verificable>.
```

Pequeñas (20-30 min), en orden de dependencia. Si salen más de 10, proponer dividir la spec.

Al crearlas, registrar en PMSK (decisión del usuario 2026-10-01):
- **Estado** → `IN_PROGRESS` (`PATCH /tasks/:id {status}`), si no lo está ya.
- **Checklist** = `tasks.md`: un `POST /tasks/:id/steps {description}` por tarea, con el texto «T1. <Descripción>». Antes, `GET /tasks/:id/steps`: no duplicar pasos que ya existan; si ya hay checklist propio de la persona, dejarlo y agregar solo los de la spec. Guardar el `stepId` de cada T en `tasks.md` (`<!-- step:<id> -->`) para marcarlo después.
- **Descripción**: agregar al final de la existente (nunca reemplazarla) una sección HTML `<h3>Especificación</h3>` con objetivo, criterios de aceptación (los RF en lenguaje simple) y fuera de alcance. Sin listas de pasos (eso es el checklist).

Textos que van a PMSK: de usted, tercera persona o impersonal, cordiales, sin jerga técnica (los lee el equipo y a veces el cliente); rótulos en negrita (reglas de la skill `pmsk`).

## 5. Implementación

Una tarea a la vez y en orden. Primero la comprobación (test o chequeo ejecutable que falle), luego el código, y correr la verificación del plan. Al cerrar cada T:
- marcarla `[x]` en `tasks.md`;
- `PATCH /tasks/:id/steps/:stepId {done:true}` en PMSK;
- anotarla en `historial.md`.

Prohibido avanzar con la verificación en rojo. Si aparece algo que la spec no cubre, **parar y preguntar**. Si se decide cambiarlo, el cambio va primero a la spec, luego al plan y a las tareas, y recién después al código (spec viva). Browser: solo con autorización del usuario (regla global).

## 6. Validación

Recorrer la spec RF por RF en una tabla: RF · cómo se verificó (comando, test o lectura de código) · resultado (✅ / ❌ / ⚠️ sin probar visualmente). Luego los criterios de finalización. Veredicto honesto: «spec cumplida» solo si todos los RF están en ✅. Lo que no se pudo verificar se dice como tal, nunca se da por bueno. Si hay ❌, se corrige (vuelve a 5) antes de cerrar, o se reporta si requiere una decisión del usuario.

Spec cumplida → `Estado: implementada`.

## 7. Registro de cierre en PMSK

- **Comentario de cierre**: `POST /tasks/:id/comments {scope:"task", body}`, en texto plano con rótulos `*así:*`. Contenido: *Qué se hizo*, *Validación* (cada RF en una línea con ✅/⚠️), *Decisiones tomadas* y *Pendiente* (si hay algo). Sin `mentions` (avisan por WhatsApp). Ojo: el `scope:"task"` lo ve el cliente por su link, así que nada interno ni técnico.
- **Estado** → `COMPLETED` **solo** si el veredicto es «spec cumplida». Si la API responde 409 (checklist incompleto, falta evidencia, ronda de QA), informar el motivo exacto y no forzarlo.
- Si la tarea es de tipo QA/ACCEPTANCE/ADJUSTMENT, su cierre lo deciden las rondas o el cliente: no cambiar el estado; solo comentar.

## Historial — `specs/NNN-slug/historial.md`

Bitácora con fecha, una línea por evento: preguntas y respuestas clave, aprobaciones, cada T cerrada, verificaciones corridas con su resultado, cambios de spec y qué se registró en PMSK. Sirve para retomar en otra sesión. Además, actualizar `MEMORY.md` del repo (si existe) al cerrar cada fase, solo con decisiones o restricciones que valgan más allá de esta spec.

## Retomar

Con la spec existente: leer `spec.md` (Estado), `plan.md`, `tasks.md` y `historial.md`, decir en 3 líneas en qué fase está, cuántas T van hechas de cuántas y el siguiente paso, y continuar desde ahí. Si la tarea en PMSK cambió desde la última vez (descripción, cascada), mostrar la diferencia y preguntar si cambia la spec.

## Nunca

- Escribir el token en un archivo o mostrarlo.
- Implementar sin las dos aprobaciones, o algo que no esté en la spec.
- Commit o push sin pedido explícito.
- Reemplazar la descripción de la tarea, borrar pasos del checklist de la persona, o marcar `COMPLETED` con RF en ❌ o sin verificar.
