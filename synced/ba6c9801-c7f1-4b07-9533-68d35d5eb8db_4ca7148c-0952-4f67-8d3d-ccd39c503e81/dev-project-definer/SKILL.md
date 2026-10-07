---
name: dev-project-definer
description: 'Asistente para DEFINIR proyectos de software antes (o en paralelo) de escribir código: estudio de viabilidad, requerimientos, análisis de mercado, diseño estructural (diagramas de arquitectura) y planeación con tracker HTML + guías por sprint. Cubre 3 tipos de proyecto (Nuevo / Heredado / Continuación), 2 modalidades de personal (Unipersonal / Equipo) y 3 modos de intervención (Aprendizaje, Desarrollo, Prototipo) que cambian cuánto interviene Claude y el detalle de la documentación. Incluye integración con Google Calendar y Drive para subir cronograma y manuales. Úsala con "define este proyecto", "ayúdame a validar esta idea", "hazme el estudio de viabilidad", "arma el tracker del proyecto", "necesito la guía del sprint N", "modo aprendizaje/desarrollo/prototipo", "conectar esto a mi calendario y drive", o al arrancar cualquier proyecto de software donde lo pedido es planeación/documentación, no código.'
---

# Dev Project Definer

Skill para actuar como asistente de **definición** de proyectos de software: no reemplaza el trabajo de codear, cubre todo lo que pasa *antes* (o en paralelo) — viabilidad, requerimientos, mercado, arquitectura y planeación en tracker + guías: análisis completo en `.docx`, tracker HTML con progreso en localStorage, y una guía HTML por sprint/semana.

**Regla dura de todo el skill:** los ejemplos de `references/ejemplos-base/` (ver sección final) son solo plantillas de **formato**. Nunca copiar en un documento generado el nombre del proyecto de origen de esos ejemplos, ni datos, textos o cifras específicas de él — cada proyecto nuevo lleva su propio nombre y contenido desde cero.

**Fuera de alcance de esta skill:** escribir o revisar código de la aplicación en sí. Una vez cerrada la Fase 5 (Planeación), la implementación sigue las reglas normales de Claude Code para ese proyecto (leer su `CLAUDE.md` si existe, etc.) — esta skill no interviene ahí salvo en modo Prototipo (ver abajo).

---

## Paso 0 — Encuadre inicial (SIEMPRE antes de avanzar)

Antes de tocar cualquier fase, preguntar (con `AskUserQuestion` si hace falta estructurarlo):

1. **Tipo de proyecto (completitud):**
   - **Nuevo** — totalmente desde cero.
   - **Heredado** — proyecto antiguo que se quiere actualizar.
   - **Continuación** — proyecto ya empezado recientemente, donde el rol es ayudar a organizar, documentar y evaluar para mejorar (revisar primero lo que ya existe — código, docs, `CLAUDE.md` — antes de proponer estructura nueva).
2. **Personal:**
   - **Unipersonal** — solo el usuario.
   - **Equipo** — pedir de una vez cuántos son y qué roles va a haber (esto determina cómo se dividen las guías por sprint y a quién se invita en Calendar/Drive).
3. **Modo de intervención** (ver sección siguiente) — determina cuánto documenta y cuánto código escribe Claude.
4. **Infraestructura y servicios tecnológicos ya disponibles:** con qué hosting/servidor, dominio, base de datos, storage, servicios de terceros o licencias ya cuenta el usuario/equipo hoy. Esta respuesta es la línea base contra la que se compara lo que el proyecto necesita en la Fase 2, para saber qué hay que sumar y presupuestar aparte — no asumir ni inventar qué infraestructura tiene disponible.

No avanzar a la Fase 1 sin tener estas cuatro respuestas — cambian la estructura de todo lo que sigue.

---

## Los 3 modos de intervención

### Aprendizaje
Para cuando el objetivo es que el usuario aprenda un lenguaje o tema, no solo tener el producto.
- Documentación **muy detallada**: manuales con fuentes, videos, artículos y guías adicionales.
- Estructurar cada guía como un curso progresivo: cada paso es un módulo con temática práctica, y cada módulo cierra con una prueba/quiz que valida el dominio antes de avanzar.
- Intervención en código **mínima**: actuar como profesor, no como implementador. Dar la semilla, dejar que el usuario complete. En preguntas, responder con preguntas/ejemplos que lo lleven a la conclusión por su propio análisis — no entregar la respuesta directa salvo que esté muy perdido, y en ese caso explicar primero por qué, no solo corregir.
- Insertar cuestionarios de validación en los puntos que tengan sentido (fin de módulo, fin de sprint).

### Desarrollo
Para proyectos profesionales reales, donde ya se presupone cierto nivel de conocimiento previo.
- Foco en eficiencia, velocidad y sobre todo calidad.
- Muy riguroso con pruebas — es un producto real, no un ejercicio.
- Documentación técnica directa, sin andamiaje pedagógico.

### Prototipo
Para cuando la prioridad es sacar el proyecto lo más rápido posible.
- Intervención **total**: se puede hacer todo en una sola sesión si la planeación (Fase 5) ya está clara.
- Documentación se reduce al mínimo: si la planeación fue suficientemente completa, basta con una guía de memoria simple para el propio Claude, más un testimonio breve de lo que se hizo — no se generan tracker/guías por sprint con el nivel de detalle de los otros dos modos.

---

## Fase 1 — Estudio de viabilidad y definición del problema

**Regla dura:** no se pasa a viabilidad sin antes haber ayudado a definir e identificar bien el problema que el proyecto pretende resolver. Es la fase más crítica — si sale mal, todo lo que sigue hereda el error.

- Ser estricto y muy lógico: indagar, hacer preguntas, señalar inconsistencias o vacíos en la idea del usuario en vez de aceptarla tal cual.
- Solo cuando el problema está bien delimitado, evaluar la viabilidad real (técnica, de tiempo, de recursos).

## Fase 2 — Requerimientos

- **Desde la vista del usuario:** ser ágil detectando vacíos — qué necesitaría, qué le facilitaría hacer su trabajo. Principio guía: *"la calidad de un producto depende de cuánto satisface las necesidades del cliente"*.
- **Desde la vista técnica:** delimitar bien el alcance y, sobre todo, los límites tecnológicos y de infraestructura, para no generar expectativas no realizables. Ser pragmático, ir al punto raíz del problema.
  - **Elementos/servicios tecnológicos requeridos (obligatorio, entra al presupuesto):** enumerar explícitamente qué necesita el proyecto para poder desarrollarse y correr, más allá del código — hosting (compartido vs. VPS vs. dedicado), dominio, certificado SSL, base de datos gestionada, storage/CDN, servicio de email transaccional, APIs de terceros de pago, licencias de software. Contrastar cada ítem contra la infraestructura ya disponible relevada en el Paso 0 (punto 4) antes de asumir que está cubierto — lo que el stack elegido requiera y no esté en esa línea base es costo adicional a presupuestar, no algo que se da por incluido.
  - Para cada ítem no cubierto por lo ya disponible, investigar un costo real de mercado (no inventar cifras) y dejarlo documentado como precio aproximado/rango — este listado con costos alimenta directo el presupuesto del Plan de Trabajo (Fase 5).

## Fase 3 — Análisis de mercado

- Comparar la idea contra productos similares para definir oportunidades y amenazas.
- Explotar/optimizar las ventajas propias y buscar cómo suplir las desventajas frente a la competencia.
- Tomar inspiración de diseño o estructura de la competencia cuando algo ya probado funcionó — no es copiar, es no reinventar lo que ya se validó en el mercado.

## Fase 4 — Diseño estructural (diagramas)

Graficar la arquitectura y estructura del proyecto en los diagramas que apliquen — no todos son obligatorios en todos los proyectos, elegir según lo que haga falta visualizar:
- **C4** — arquitectura general del sistema.
- **BPMN** — para los puntos críticos de proceso/flujo de negocio.
- **Modelo entidad-relación** — para la base de datos.
- **Diagrama de clases** — para la abstracción de clases del dominio.
- Cualquier otro diagrama pertinente al caso (flujo de usuario, diagrama de estados, etc.) si con los anteriores no queda claro algún aspecto.

El objetivo es que cualquiera pueda entender la estructura y los criterios técnicos de la aplicación viendo estos gráficos, sin tener que leer el código.

### Mockups de interfaz (si el proyecto tiene UI)

- Aplica solo si el proyecto tiene interfaz de usuario (web, desktop, mobile). Proyectos puramente backend/API/librería no lo necesitan — preguntar si no queda claro.
- **No asumir un formato/resolución fijo**: usar el que corresponda a la plataforma objetivo real definida en la Fase 2 (desktop, mobile-first, web responsive, etc.).
- Si el proyecto ya tiene identidad visual definida (paleta, tipografía, logo), aplicarla en los mockups. Si todavía no existe, usar la skill `brandkit` para generar propuestas de identidad (logo, paleta, tipografía) antes de los mockups, en vez de dejarlos en boceto neutro — avisar al usuario que la identidad generada es propuesta, no definitiva, hasta que la confirme.
- Apoyarse en la skill `impeccable` para las decisiones de diseño que no son de identidad pura (jerarquía visual, contraste, composición, anti-patrones, densidad de información): leer sus reglas generales como criterio antes de generar los mockups, y si está instalada, correr `/impeccable critique` sobre las imágenes/HTML resultantes antes de darlas por definitivas — mismo apoyo que ya usa la skill `tw-design-system` en su propio flujo.
- Generar las referencias visuales de las pantallas principales del flujo de usuario (las claves, no exhaustivo pantalla por pantalla) con la skill de generación que corresponda a la plataforma:
  - Web / responsive / landing / marketing → `imagegen-frontend-web` (una imagen horizontal por sección).
  - Mobile (iOS/Android/cross-platform) → `imagegen-frontend-mobile` (pantallas dentro de mockup de teléfono).
  - Desktop u otra plataforma sin skill de imagegen específica → seguir con el flujo HTML directo, usando `references/ejemplos-base/ejemplo-mockups.html` como plantilla de formato.
- Si el entregable de esta fase necesita ser HTML navegable (no solo imagen de referencia), usar `image-to-code` para implementarlo a partir de las imágenes generadas, en vez de escribir el HTML a mano desde cero — mantiene consistencia entre lo diseñado y lo entregado. Esto sigue siendo mockup/boceto de la Fase 4, no código de la aplicación (fuera de alcance de esta skill salvo modo Prototipo).
- **Generar `design.md` junto con los mockups**: documento que consolida las reglas de estilo fijadas en esta fase — identidad (paleta por rol, tipografía), tratamiento de forma/esquinas mostrado en los mockups, componentes recurrentes (botones, cards) y su estado normal/hover si aplica, y un checklist corto para antes de construir un componente nuevo. Mismo contenido/formato que produce la skill `tw-design-system` en su propio paso de generación de `design.md`, para que sirva de referencia directa cuando el proyecto pase a implementación real — sea en esta misma skill (modo Prototipo) o en quien continúe el código tras la Fase 5. Guardarlo junto a los demás entregables de esta fase (ej. `./documentation/design.md`).
- **Página de Ayuda / Acerca de (si el proyecto la tiene o la va a tener)**: usar `references/patron-seccion-acerca-de.md` como plantilla de formato para la sección de créditos, contacto y donaciones — jerarquía visual, qué información va en cada fila (contacto, PayPal, métodos locales), y de dónde sacar íconos de marcas de terceros sin inventar el path de memoria (Simple Icons vía jsdelivr, licencia CC0). Incluye el error real ya detectado de `justify-between` vs `justify-center` en filas de contacto/donación, y la regla de no exponer datos personales (ej. número de celular) sin preguntar primero.

**Entregable obligatorio de las Fases 1–4** (salvo modo Prototipo, ver arriba): un **documento de Análisis** en `.docx` que consolide problema, requerimientos, análisis de mercado y los diagramas de arquitectura — ver `references/ejemplos-base/ejemplo-analisis.docx` como plantilla de formato — más los **mockups de interfaz** y su `design.md` de consistencia visual, si el proyecto tiene UI. Ver sección "Generación de documentos .docx" para el flujo técnico y la regla del logo.

## Fase 5 — Planeación

Con base en tipo de proyecto (Paso 0.1), personal (Paso 0.2), horas semanales disponibles y roles (si es equipo), generar:

1. **Tracker general en HTML** — el orquestador del proyecto. Patrón validado (ver `references/ejemplos-base/ejemplo-tracker.html` como plantilla de formato):
   - Progreso general marcado y persistido (ej. vía `localStorage`), visible de un vistazo.
   - Sprints con sus fechas y tiempos.
   - **Dependencias entre tareas/sprints, siempre explícitas** (regla dura, no opcional): para cada tarea que no pueda arrancar sin que otra haya cerrado (del mismo bloque o de un bloque anterior), declarar de qué ID depende. No alcanza con que el orden de fechas lo insinúe — si el documento de origen no trae esto modelado en una columna, inferirlo del sentido lógico del trabajo (ej. un sprint de desarrollo depende del diseño aprobado; un despliegue depende de QA/UAT cerrado; una tarea de contenido depende de que el copy esté aprobado) y dejarlo escrito como tal, no omitirlo por comodidad ni asumir que "se entiende por el calendario". Esto es lo que después permite mover fechas en cascada y detectar cuellos de botella reales en vez de solo atrasos de calendario.
   - Cada sprint/bloque **debe** tener su tabla de criterios de aceptación (ID, descripción, método de verificación, checkbox) — mismo nivel de detalle en todos los bloques. Cobertura inconsistente entre sprints no es aceptable.
2. **Una guía HTML por sprint** — si hay varios desarrolladores, dividida por rol.
   - Si el modo es **Aprendizaje**: guía tipo curso, con fuentes/videos/artículos, instrucciones de práctica numeradas (sub-pasos en monospace), y quiz de cierre — ver `references/ejemplos-base/ejemplo-guia-sprint.html` como plantilla de formato.
   - Si el modo es **Desarrollo**: guía técnica directa, sin andamiaje pedagógico.
   - Si el modo es **Prototipo**: se omite este artefacto — ver sección Prototipo arriba.
3. Antes de generar tracker/guías, **revisar si el proyecto ya tiene su propio `CLAUDE.md`** con convenciones de documentación propias — esas convenciones locales tienen prioridad sobre el patrón por defecto de esta skill.

### Colchón de cronograma por cambios de alcance del cliente

**Regla dura:** el criterio de éxito de un proyecto es entregarlo **a tiempo** con lo pactado — no "se entregó todo pero tarde". Un proyecto completo y tarde se percibe como incumplido; uno a tiempo, aunque haya requerido gestionar cambios en el camino, se percibe como bien ejecutado. El cronograma se construye para proteger esa percepción, no solo para reflejar el esfuerzo técnico puro.

Por qué: aun con requerimientos bien definidos desde el Paso 0/Fase 2, el cliente casi siempre termina agregando o modificando funcionalidad ya avanzado el proyecto, y suele asumir que ese cambio es rápido. En la práctica, un cambio pedido tarde con frecuencia toca estructura ya construida (parchar, reestructurar) en vez de construirse limpio desde el diseño — sale mucho más caro en tiempo que si se hubiera contemplado desde el inicio.

Cómo aplicarlo al construir tracker y Plan de Trabajo:
- No usar el estimado técnico optimista como cronograma final. Sumar un margen explícito para "cambios de alcance sobre lo ya definido", separado del buffer normal por imprevistos técnicos — mayor cuanto menos historial haya con ese cliente.
- Reservar ese margen como bloque(s) visibles en el tracker (no diluido silenciosamente dentro de cada sprint), para que si se usa, se vea como parte del plan y no como atraso.
- Al revisar requerimientos en la Fase 2, marcar cuáles son más costosos de modificar después de construidos (tocan base de datos, arquitectura central, integraciones) — esos sprints llevan más colchón que los de funcionalidad aislada/periférica.
- Dejar explícito en el Plan de Trabajo (`.docx`) que el cronograma ya incorpora margen para cambios razonables de alcance, y qué tipo de cambio se sale de ese margen y dispara reestimación — así la expectativa del cliente queda fijada desde el inicio, sin tener que renegociar plazo cada vez que pide algo nuevo.

**Entregable obligatorio de la Fase 5** (salvo modo Prototipo): un **Plan de Trabajo** en `.docx` con sprints, cronograma, roles y el presupuesto de infraestructura/servicios tecnológicos identificado en la Fase 2 — ver `references/ejemplos-base/ejemplo-plan-trabajo.docx` como plantilla de formato. Ver sección "Generación de documentos .docx".

---

## Integración con Google Calendar y Google Drive

La cuenta de Google del usuario ya está conectada a Claude (Calendar, Drive, Gmail). Antes de invocar estas herramientas, cargar sus esquemas con `ToolSearch` (ej. `"select:mcp__claude_ai_Google_Calendar__create_event"`, `"select:mcp__claude_ai_Google_Drive__create_file"`) — son tools diferidas.

Flujo:
1. Subir el cronograma del tracker como serie(s) de eventos recurrentes en Google Calendar — preferir varias series simples (una por bloque de horario) sobre un único evento con reglas complejas.
2. Subir los manuales/guías generados a Google Drive y anexarlos donde corresponda.
3. **Si es proyecto en equipo:** pedir el correo de cada miembro/rol para:
   - Agregarlo a los eventos del calendario general.
   - Darle permisos de lectura en Drive sobre los materiales.
   - Asignarle su rol correspondiente, con sus recordatorios y las guías que ese rol requiere.

**Regla de confirmación:** crear eventos de calendario que invitan a otras personas, o compartir archivos de Drive con correos de terceros, son acciones visibles para otros / que afectan sistemas compartidos — confirmar con el usuario antes de enviar invitaciones o compartir permisos, igual que con cualquier acción de ese tipo. Subir archivos propios a su propio Drive o crear eventos solo para él no requiere esa confirmación adicional.

---

## Conexión con ProjectManagerSK (PMSK)

Al cerrar la Fase 5 (o cuando el usuario lo pida antes), ofrecer subir la definición
completa del proyecto a **ProjectManagerSK** (la app propia de gestión de proyectos del
usuario) vía su API v1, para no dejar toda esta planeación viviendo solo en `.docx`/HTML
sueltos. Es una integración más, igual de opcional que Calendar/Drive — no asumir que el
usuario siempre la quiere, preguntar si no lo pidió explícitamente.

**Para el mecanismo de conexión (URL del servidor, login, endpoints), usar la skill `pmsk`**
— ahí está el flujo real y actualizado (login por usuario/contraseña de la persona, NUNCA
una API key fija guardada en ningún `.env` ni archivo). No repetir acá ese detalle para no
desincronizarlo con la fuente real de la API.

**Regla dura, sin excepción una vez que se decide crear el proyecto en PMSK — "llenar
todas esas definiciones" no es opcional aunque crear solo fases+tareas sea más rápido:**
objetivos, requerimientos (vinculados a esos objetivos y a las fases), descripción completa
del proyecto y dependencias entre tareas se completan siempre que la información ya exista
en las Fases 1-4 de esta skill — no es "si el usuario lo pide", es parte de la subida.
Punto 3.1 del pedido original: no perder información solo porque no encaja en un campo
específico — todo lo de las Fases 1-4 que no sea un objetivo, un requerimiento o una fase
entra en la `description` del proyecto (HTML, vía PATCH).

**Checklist obligatorio al crear el proyecto en PMSK, en este orden** (cada `POST`/`PATCH`
va contra `{PMSK_URL}/api/v1/...` — ver `pmsk` para la URL y el token):

1. **Resolver personas** — `GET /api/v1/users` y mapear cada responsable/rol definido en el
   Paso 0.2 a un `userId` real por nombre/email. Si alguien no existe todavía en PMSK, avisar
   al usuario — esta skill no crea usuarios nuevos ahí.
2. **Crear (o localizar) el proyecto** — `POST /api/v1/projects` con `name`, `clientName`,
   `startDate`, `pmId`. Si el proyecto es tipo Continuación/Heredado y ya podría existir en
   PMSK, preguntar antes si hay que reusar ese `id` (`PATCH`/tareas nuevas sobre lo existente)
   en vez de crear uno nuevo — esta subida es siempre **aditiva**, nunca borra ni reemplaza
   nada ya cargado. Borrar la fase "General" que PMSK crea sola y vacía si no se va a usar.
3. **Fases** (los sprints/bloques del tracker de Fase 5) — un
   `POST /api/v1/projects/{id}/phases` por fase, en el orden del tracker. Van antes que
   objetivos/requerimientos porque los requerimientos necesitan sus `phaseId`.
4. **Objetivos** (Fase 1 de esta skill) — un `POST /api/v1/projects/{id}/objectives` por
   objetivo real de negocio/producto (`title`, `description`) — nunca dejar esto vacío
   habiendo ya un estudio de viabilidad hecho.
5. **Requerimientos** (Fase 2) — un `POST /api/v1/projects/{id}/requirements` por
   requerimiento, con `objectiveIds` (qué objetivo(s) atiende) y `phaseIds` (en qué fase(s)
   del cronograma se cumple) ya resueltos de los pasos 3 y 4 — un requerimiento sin esos dos
   vínculos queda huérfano en la vista de PMSK.
6. **Archivos y enlaces** — un `POST /api/v1/projects/{id}/links` por recurso importante:
   repositorio, carpeta de Drive, archivo Figma, y los propios `.docx` de Análisis/Plan de
   Trabajo si quedaron en Drive (paso previo de la integración de Drive). Preferir siempre
   el link al archivo — no subir binarios a PMSK.
7. **Tareas** — un `POST /api/v1/projects/{id}/tasks` por cada tarea/criterio de aceptación
   del tracker. Punto 3.3 del pedido original, regla dura: cada tarea debe quedar
   suficientemente detallada para que el responsable la ejecute sin ambigüedad —
   - `title`: corto, orientado a la acción (verbo + qué).
   - `description`: HTML claro y preciso — qué hay que hacer, con qué criterio se da por
     terminado, y un link relevante (Figma del mockup, doc de referencia) cuando ayude a
     ejecutar sin tener que ir a buscarlo aparte.
   - `phaseId`: el sprint al que pertenece (del paso 3).
   - `type`: `SIMPLE` por defecto; `MILESTONE` para hitos/entregables del cronograma (en
     PMSK exige evidencia cargada antes de poder cerrarse); `QA` para bloques de
     revisión/aceptación; `ADJUSTMENT` para bloques de cambios ya acordados con el cliente
     que todavía no se ejecutaron.
   - `assigneeIds`: resueltos en el paso 1.
   - `plannedStart` + `durationDays` (en días hábiles).
   - `dependsOnTaskIds`: **obligatorio revisar en cada tarea, no solo cuando el tracker ya
     lo dejó explícito.** Si el tracker de la Fase 5 modeló bien las dependencias (ver esa
     sección), acá es solo resolver esos IDs a los de PMSK; si no las modeló todas, este es
     el último punto de control antes de perderlas — no crear la tarea "suelta" solo porque
     el documento de origen no traía una columna de dependencias.
   - `meetingUrl`: si esa tarea del tracker es en sí una reunión/ceremonia con link fijo
     (ej. una demo de sprint ya agendada).
8. **Descripción completa, al final** — `PATCH /api/v1/projects/{id}` con `description`
   (HTML) que consolide introducción, diagnóstico/problema, decisiones de arquitectura y
   su razón, qué queda fuera de alcance y por qué, y cualquier otro punto de las Fases 1-4
   que no haya quedado cubierto por un objetivo, requerimiento o fase — más `targetEndDate`
   si el Plan de Trabajo definió una fecha de cierre comprometida. Va al final porque recién
   ahí se sabe con certeza qué información ya quedó en campos estructurados y cuál no.

**Confirmar antes de disparar la subida:** son varias decenas de llamadas a una API real,
visibles después para todo el equipo del proyecto en PMSK — mostrarle al usuario un resumen
de qué se va a crear (cuántos objetivos/requerimientos/fases/tareas, a quién queda asignado
cada bloque) antes de ejecutar, mismo criterio que ya aplica para Calendar/Drive.

---

## Generación de documentos .docx (análisis completo, plan de trabajo)

Los dos `.docx` de la Fase 1–4 (Análisis) y la Fase 5 (Plan de Trabajo) son entregables obligatorios salvo modo Prototipo (ver "Los 3 modos de intervención"). Flujo que ya funcionó:
- Python (`cairosvg`, `PIL`) para preparar assets/imágenes.
- Node.js con la librería `docx` (npm) para ensamblar el documento final.
- Guardar el output en la carpeta de documentación propia del proyecto (ej. `./documentation/`), no en una ruta temporal genérica — revisar primero dónde el proyecto ya guarda estos artefactos si es tipo Heredado/Continuación.

**Logo de empresa (regla dura, ambos documentos):** todo `.docx` generado por esta skill debe llevar el logo de Elan SK Soft en la portada/encabezado, usando el SVG guardado en `assets/Logo-Elan-SK-Soft.svg` (dentro de esta misma skill). Reglas de manejo del logo, aplican siempre:
- Usar el SVG **exactamente como está** — cero manipulaciones: no agregar fondos, no recolorear paths, no modificar proporciones, no cambiar colores de ningún elemento interno.
- Para convertir a PNG/embeber en el `.docx`: `rsvg-convert` sin flags de recoloración.
- Si el usuario provee un logo distinto para un proyecto/marca específica, ese logo reemplaza al de Elan SK Soft solo para ese proyecto — preguntar si no está claro cuál aplica.

---

## Capturas de interfaz anotadas en manuales/guías

Cuando un manual, guía de sprint, o página de Ayuda necesita mostrar "cómo se hace" un paso concreto en una interfaz (un panel de admin, un formulario, cualquier UI), y no solo texto:

- **Nunca** flechas que crucen la imagen ni cajas de texto superpuestas sobre el elemento que se señala — se prueba confuso y tapa justo lo que se quiere mostrar (feedback directo de usuario real, repetido).
- Patrón que sí funciona: un contorno fino (sin relleno) alrededor del botón/campo real señalado, con un círculo numerado apoyado en la esquina de ese contorno, siempre **por fuera** del elemento. La explicación de cada número va aparte, debajo de la imagen, como lista numerada normal en HTML — no texto incrustado en la imagen.
- Si no hay forma segura de capturar la pantalla real (login bloqueado, entorno sin acceso), recrear la interfaz en HTML/CSS propio con los mismos colores/proporciones reales antes que inventar un mockup genérico — y aclarar en el texto que es una recreación, no una captura literal.
- Una sección con capturas de interfaz necesita más ancho que el texto de lectura normal de la guía (que puede quedarse angosto, ~700-900px) — no apretar screenshots reales a un ancho de columna de texto, se vuelven ilegibles. Verificar siempre renderizando el documento (no asumir por el CSS solo) y chequear que no aparezca scroll horizontal en mobile.

## Exportar un manual/guía HTML a PDF

Cuando un entregable de esta skill (manual, guía de sprint, análisis) vive como HTML y hay que darlo también en PDF, sin tocar el HTML fuente:

- **Multi-página estándar:** `google-chrome-stable --headless=new --print-to-pdf=archivo.pdf archivo.html`. Por default pagina en Letter y puede cortar tarjetas/imágenes a la mitad entre páginas. Para evitarlo sin alterar la vista en pantalla del documento: agregar un bloque `@media print{ break-inside:avoid; page-break-inside:avoid; }` sobre cada bloque atómico (tarjeta, imagen, fila de tabla) al final del `<style>` — solo aplica al exportar/imprimir, cero impacto en la lectura normal en navegador.
- **Una sola hoja gigante sin ningún corte** (cuando el usuario lo pide explícito, tipo "que no quede nada a medias, todo en una hoja"): el flag CLI no permite tamaño de página custom. Usar el protocolo CDP `Page.printToPDF` directo vía WebSocket (Node ≥18 trae `fetch`/`WebSocket` nativos, sin dependencias nuevas): lanzar chrome con `--remote-debugging-port`, medir `document.documentElement.scrollHeight`/`scrollWidth` del documento ya cargado, convertir a pulgadas (÷96 + margen chico), y pedir `Page.printToPDF` con `paperWidth`/`paperHeight` iguales a esa medida exacta, márgenes en 0, `printBackground:true`. Da una sola página del alto exacto del contenido — más simple y confiable que afinar `break-inside` para que "todo entre justo".
- Verificar siempre el PDF resultante renderizándolo a imagen (`pdftoppm -png -r 100 …`, de poppler-utils) y revisándolo antes de entregarlo — no asumir que salió bien solo porque el comando no tiró error.

## Cuándo preguntar vs. cuándo asumir

**Preguntar siempre:**
- Tipo de proyecto, personal y modo de intervención (Paso 0) si no se dieron explícitamente.
- Si es Continuación/Heredado: qué tanto de las fases 1–4 ya existe documentado, antes de rehacerlo de cero.
- Si es Equipo: correos y roles de cada miembro antes de tocar Calendar/Drive compartido.
- Cualquier vacío o inconsistencia detectado en la idea del usuario durante la Fase 1 — no rellenar con supuestos.
- Si quiere subir la definición a ProjectManagerSK (no asumir que sí) y, si el proyecto es
  Continuación/Heredado, si hay que reusar un proyecto ya existente ahí en vez de crear uno
  nuevo — ver "Conexión con ProjectManagerSK (PMSK)".

**Asumir con el patrón por defecto (avisando que se asumió):**
- Estructura de tracker + guías igual al patrón de `references/ejemplos-base/`, salvo que el proyecto tenga su propio `CLAUDE.md` con reglas de documentación distintas.
- Qué diagramas de la Fase 4 aplican, según lo que el proyecto realmente necesite visualizar (no generar los cuatro tipos si con dos ya se entiende la estructura).

---

## Ejemplos de referencia (`references/ejemplos-base/`)

Cuatro archivos reales de un proyecto anterior, usados **únicamente como plantilla de formato/estructura**:
- `ejemplo-analisis.docx` — formato del documento de Análisis (Fases 1–4).
- `ejemplo-plan-trabajo.docx` — formato del Plan de Trabajo (Fase 5).
- `ejemplo-tracker.html` — formato del tracker general (estructura de sprints, tabla de criterios de aceptación, progreso en localStorage).
- `ejemplo-guia-sprint.html` — formato de guía de sprint en modo Aprendizaje (módulos, fuentes, quiz).

Además, en `references/patron-seccion-acerca-de.md` — patrón de formato para la sección "Acerca de"/contacto/donaciones de una página de Ayuda (jerarquía visual, qué va en cada fila, fuente confiable de íconos de marcas de terceros). Aplica cuando el proyecto en Fase 4/5 vaya a tener una página de Ayuda o Acerca de con esta necesidad. Ícono de PayPal ya listo en `assets/paypal-icon-example.svg`.

**Advertencia dura, sin excepción:** al abrir o consultar estos archivos, copiar solo la **estructura/formato** (secciones, tablas, estilo de las tablas de criterios de aceptación, layout HTML). Nunca copiar al documento del proyecto actual el nombre del proyecto original, su contenido de negocio, cifras, textos de ejemplo ni nada específico de él — cada proyecto se redacta desde cero con su propia información.
