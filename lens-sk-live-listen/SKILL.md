---
name: lens-sk-live-listen
description: Activa, en ESTA sesión de la IA actual, la conexión en vivo con el puente navegador↔IA de la toolbar Lens-SK (skill dev-inspector-toolbar) — recibe y responde pedidos de 🪄 "Pedir cambio", 📤 "Aplicar"/"Aplicar todos" y 📍 "Código" hechos desde el navegador. Se dispara con comandos/alias conversacionales como `/modo-ia`, `/lens`, `/pedidos`, "respóndeme lo que te mande por Lens-SK", "activá el modo IA", "conectate al puente de Lens-SK", "empezá a escuchar pedidos live", "prendé la Asistencia IA", "modo live de Lens-SK", "por qué no se conecta el modo IA de la toolbar", o cuando el usuario dice que tiene "una conexión abierta" pero el botón 🪄/📤 no aparece. Requiere que el proyecto tenga corriendo `scripts/lens-sk-live-server.js` (normalmente ya levantado por `npm run dev`, ver dev-inspector-toolbar).
---

# Lens-SK — activar el modo live (escuchar pedidos de la toolbar)

## Comandos conversacionales

Estos son alias de chat para no escribir pedidos largos. No son comandos `npm` ni scripts
de terminal; el agente los interpreta como instrucciones directas de esta skill.

- `/modo-ia`: activar o reactivar la escucha live de Lens-SK en esta sesión y atender los
  pedidos que lleguen desde la toolbar.
- `/lens`: revisar el puente, leer cualquier pedido pendiente de Lens-SK y responderlo
  antes de seguir con el chat.
- `/pedidos`: consultar qué está llegando por Lens-SK: estado del puente, pedido activo,
  pregunta pendiente, progreso, selector, archivo sugerido y adjuntos.
- `/ayuda-lens es` / `/ayuda-lens en`: abrir o generar la ayuda de Lens-SK en español o
  inglés usando la ayuda real de la toolbar.

Tener una conversación de la IA actual abierta **no** conecta nada por sí solo. El puente
(`lens-sk-live-server.js`) solo marca "hay alguien escuchando" mientras exista una
conexión `GET /events` (SSE) abierta de verdad — eso es justamente lo que arma este
skill, a pedido explícito, no algo automático ni heredado entre conversaciones.

**Alcance: dura lo que dura ESTA conversación/sesión.** Si se cierra este chat o se abre
uno nuevo, hay que volver a pedirlo ahí — no hay forma de que se active solo.

## Reglas estrictas de prioridad e identidad

**Prioridad total:** mientras el modo live esté activo, cada petición que llegue desde
Lens-SK tiene prioridad sobre cualquier otro trabajo de esta sesión. SIEMPRE responderla
con `/reply` en cuanto sea posible, aunque sea con `ok:false` y una `note` específica si
no se puede completar. No dejar un evento pendiente, no asumir que el usuario ya lo cerró
sin comprobarlo contra el servidor, y no terminar la respuesta al chat hasta haber cerrado
la petición live activa o confirmado que ya no existe como pendiente.

**Interrupción obligatoria de trabajo en curso:** si llega una petición de Lens-SK mientras
la IA está en cualquier otro turno, explicación, análisis, edición, búsqueda, test o tarea
larga, debe suspender ese trabajo inmediatamente en el primer punto seguro, atender la
petición de Lens-SK, enviar `/progress` si va a tardar más de unos segundos y cerrar el
evento con `/reply`. El trabajo anterior solo se reanuda después de confirmar que no queda
pedido live pendiente.

**Antes de responder cualquier mensaje del chat mientras `connected:true`:** comprobar el
stream/monitor de Lens-SK y el estado del servidor. Si apareció un evento nuevo, atenderlo
primero y mandar su `/reply` antes de contestar en el chat. La pregunta del usuario en el
chat no reemplaza ni cancela el pedido live: si hay pedido pendiente, se responde en
Lens-SK primero y recién después se explica en el chat.

**Modo automático obligatorio:** si el usuario pide que Lens-SK responda
automáticamente, mantener el puente vivo como infraestructura prioritaria de la sesión.
Antes de cualquier respuesta final o explicación:
- Comprobar `GET /status`.
- Si el servidor no responde, levantar `npm run live` desde el proyecto/theme donde exista
  `scripts/lens-sk-live-server.js`.
- Si `connected:false` o la sesión SSE anterior ya no existe, abrir de nuevo
  `curl -N -sS http://localhost:<PUERTO>/events | grep --line-buffered "^data:"`
  (el `<PUERTO>` del Paso 1, no `8137` a ciegas).
- Poll-ear el stream/monitor disponible; si hay una línea `data: {...}`, parsearla y
  atender ese evento antes de continuar.
- Si aparece un evento durante una explicación normal del chat, interrumpir la explicación
  y atender Lens-SK primero.
- Durante cualquier tarea larga, poll-ear el stream periódicamente y también justo antes
  de cada bloque de edición, ejecución de tests, respuesta final o cambio de objetivo.

**Límite operativo que no cambia la obligación:** la IA no se despierta sola cuando no
hay turno activo del agente. Por eso, para aproximar automatismo real dentro de la sesión,
cada turno debe arrancar verificando servidor + stream, y todo trabajo largo debe poll-ear
el stream periódicamente. Si se necesita automatismo fuera de turnos del agente, usar o
crear un listener externo persistente; aun así, cuando esta IA vuelva a estar activa debe
asumir la responsabilidad de cerrar cualquier pedido pendiente.

**Nombre de la IA:** en textos visibles, notas, progress, descripciones y documentación
operativa, NO hardcodear un nombre de IA fijo. Usar el nombre real de la IA que atiende la petición
en esta sesión (por ejemplo, Codex, ChatGPT u otra), o "la IA actual" si no hay un nombre
más específico. Solo mantener valores legacy del protocolo si el servidor los exige
literalmente, y marcarlos como legacy para no confundirlos con texto de interfaz.

## Paso 0 — restaurar la toolbar si estaba apagada con `/lens-stop`

Si el proyecto tiene un comando `/lens-stop` (borra `assets/dev-tools/` para
ocultar la barra, ver `dev-inspector-toolbar`), activar el modo live la
reactiva: en el directorio que contiene `scripts/dev-tools-sync.js`, si
`assets/dev-tools/` no existe pero `js/dev-tools/toolbar.js` sí, correr
`node ./scripts/dev-tools-sync.js copy` antes de seguir. Si el proyecto no usa
ese patrón (no existe `dev-tools-sync.js`), saltear este paso sin más.

## Paso 1 — encontrar el puerto (SIEMPRE se corre, nunca se asume)

**Nunca asumir `8137` sin chequear el `.env` primero — este paso no es opcional ni
"solo si hay dudas".** Desde que existe `lens-sk-resolve-ports.js` (hook `predev` de
`npm run dev`, ver skill `dev-inspector-toolbar`), cada proyecto reserva su PROPIO
puerto libre (8137, 8138, 8139...) y lo deja en su propio `.env` como
`LENS_SK_LIVE_PORT` — varios proyectos pueden tener `npm run dev` corriendo en
paralelo al mismo tiempo, cada uno en el suyo. Conectarse al puerto de OTRO proyecto
no da ningún error: ese servidor responde `connected:true` igual, solo que es el
bridge de una página que no es la que se está mirando.

**Bug real, 2026-08-26:** una sesión de un segundo proyecto (localparners) corrió
`/modo-ia` y terminó conectada al `8137` (el bridge de OTRO proyecto, cafexport) en
vez de al `8138` que le correspondía según su propio `.env` — el resultado: el panel
del navegador de ese proyecto decía "conectado" en la sesión del chat, pero el
`toolbar.js` de ESE proyecto (que ya trae su puerto real inyectado al copiarse, ver
`dev-tools-sync.js`) apuntaba al 8138 de verdad, donde no había NADIE escuchando — los
botones 🪄/📤 nunca aparecieron. La causa: este paso decía "si el proyecto define
`LENS_SK_LIVE_PORT`, usar ese valor" pero no daba un comando concreto para chequearlo,
y los pasos 2-4 de abajo tenían el `8137` pegado literal en los ejemplos — fácil de
copiar tal cual sin pensarlo.

Correr esto DESDE la carpeta del tema del proyecto actual (donde está
`scripts/lens-sk-live-server.js`), en cualquier arranque o reactivación del modo live,
sin excepción:

```bash
grep -m1 '^LENS_SK_LIVE_PORT=' .env 2>/dev/null
```

- Si devuelve una línea, **ESE número es el puerto** — usarlo literal en TODOS los
  pasos siguientes (2, 3, 4) y en cualquier `/progress`, `/ask`, `/answer`, `/reply`,
  `/ask-user` de acá en adelante en la sesión.
- Si no devuelve nada (el proyecto no tiene `lens-sk-resolve-ports.js` o nunca corrió
  `npm run dev` con la resolución de puertos activa), recién ahí usar `8137` como
  default.

**No reutilizar un puerto o una conexión de antes en la MISMA conversación sin volver
a correr este chequeo** si cambió el proyecto/carpeta de trabajo, o si pasó tiempo
suficiente como para que otro `npm run dev` se haya levantado o caído mientras tanto —
"ya está conectado" de un turno anterior no reemplaza volver a leer el `.env` actual.

**Regla dura, sin excepción de criterio: CADA vez que se dispare `/modo-ia` (u otro
alias de esta skill) dentro de la MISMA conversación — primera vez o reactivación N —
correr el `grep` del Paso 1 de nuevo, siempre, aunque parezca "la misma sesión de
recién" o aunque un `curl .../status` al puerto ya conocido devuelva `connected:true`.**
Ese `connected:true` NO prueba que el puerto siga siendo el correcto — puede venir de
un servidor de OTRO proyecto que ahora ocupa ese puerto (ver bug de abajo). "Pasó poco
tiempo" o "es la misma conversación" no son excusas válidas para saltear el chequeo: es
un comando de un segundo, más barato que el tiempo perdido si el puerto cambió y no se
detecta.

**Bug real, 2026-08-28 (mismo proyecto, mismo chat, port switch a mitad de sesión):**
un primer `/modo-ia` resolvió `8137` con el Paso 1, confirmó el servidor y quedó
`connected:true` — todo bien. Minutos después, dentro de la MISMA conversación, el
usuario volvió a pedir `/modo-ia` (reactivación). En vez de correr el Paso 1 de nuevo,
se reusó el `8137` ya conocido y se lo validó con `curl status`, que respondió
`connected:true` — parecía correcto, así que no se investigó más. El problema real: en
el medio, `lens-sk-resolve-ports.js` había reasignado este proyecto a `8138` en su
propio `.env` (porque `8137` quedó tomado por OTRO proyecto corriendo en paralelo) —
el `toolbar.js` del navegador YA estaba sirviendo con `8138` inyectado, pero la IA
seguía escuchando en `8137` (el bridge de ese otro proyecto, que coincidentemente
también respondía con el mismo `project` en su JSON). El usuario tuvo que avisar
manualmente que los botones no aparecían. Se detectó recién al comparar el `.env` real
contra el puerto hardcodeado en `assets/dev-tools/toolbar.js` (`grep -n
"LIVE_HELPER_PORT" assets/dev-tools/toolbar.js`) — ese grep puntual es una forma rápida
de confirmar qué puerto tiene inyectado el navegador de verdad, útil como chequeo
cruzado si después de re-correr el Paso 1 todavía hay dudas de que el puerto usado
coincida con lo que sirve el navegador.

## Paso 2 — confirmar que el servidor está arriba

Reemplazar `<PUERTO>` por el número exacto que dio el Paso 1 (no dejarlo literal):

```bash
curl -sS http://localhost:<PUERTO>/status
```

Si falla (connection refused): el servidor puente no está corriendo — avisar al usuario
que haga falta `npm run dev` (o el proceso `node scripts/lens-sk-live-server.js` suelto) y
NO seguir a ciegas con el paso 3. Si responde pero el campo `project` no coincide con lo
esperado para este proyecto, es la señal de que el puerto resuelto en el Paso 1 está
mal — no seguir, volver a chequear el `.env`.

## Paso 3 — abrir la conexión (Monitor)

Mismo `<PUERTO>` del Paso 1/2:

```
Monitor({
  command: 'curl -N -sS http://localhost:<PUERTO>/events | grep --line-buffered "^data:"',
  description: 'Pedidos live de Lens-SK (🪄 Pedir cambio / 📤 Aplicar) desde la toolbar',
  persistent: true,
  timeout_ms: 3600000
})
```

`persistent: true` es necesario — sin eso el monitor se corta solo por timeout. Cada línea
`data: {...}` que llegue es una notificación con el evento completo.

## Paso 4 — confirmar

```bash
curl -sS http://localhost:<PUERTO>/status
```

Debe devolver `"connected":true` y, si el servidor ya expone `project`, que coincida con
el proyecto actual. Avisarle al usuario que ya puede probar 🪄/📤 desde el
navegador (el botón puede tardar hasta 15s en aparecer solo, o aparece al instante si
recarga la página).

## Protocolo del servidor puente — resumen de endpoints

Todos son HTTP contra `http://localhost:<PUERTO>` (`lens-sk-live-server.js`, el mismo
`<PUERTO>` resuelto en el Paso 1). Detalle de
cada uno en su sección correspondiente más abajo.

| Endpoint | Quién lo llama | Para qué |
|---|---|---|
| `GET /status` | IA | Ver si hay una conexión `/events` activa (`connected:true/false`) |
| `GET /events` (SSE) | IA | Abrir con `Monitor` — cada línea `data:` es un evento nuevo (`suggest`/`commit`/`commit-all`/`locate`/cancelación) |
| `POST /progress` | IA | Mandar una actualización de "en qué voy" mientras resuelve un pedido en curso |
| `POST /ask` | IA | Preguntar algo A MITAD de un pedido en curso (tiene `id` activo) |
| `POST /answer` | navegador | El usuario responde esa pregunta — llega a la IA por el mismo `/events` |
| `POST /ask-user` | IA | Preguntar algo SIN pedido en curso (queda abierta hasta que respondan) |
| `GET /ask-user` | navegador | Poll liviano para saber si hay pregunta standalone pendiente |
| `POST /answer-user` | navegador | El usuario responde (o cancela) esa pregunta standalone |
| `POST /cancel` | navegador | El usuario cortó el pedido en curso desde el botón "Cancelar" |
| `POST /reply` | IA | Cerrar un pedido (`suggest`/`commit`/`commit-all`/`locate`) — obligatorio siempre |

## Qué hacer con cada evento que llega

Cada línea viene como `data: {json}` — sacar el prefijo `data: ` y parsear el JSON.
**Si el JSON viene truncado en la notificación**, usar `TaskOutput`/`Read` sobre el archivo
de salida del monitor para leer la línea completa — nunca actuar sobre un JSON cortado.

**La captura (`screenshot`, dataURL PNG) va SIEMPRE adjunta a cada evento — ya no es
opcional ni depende de ningún switch del panel — y es la fuente de verdad de la IA actual sobre
lo que está pasando de verdad en la página, no una ayuda extra.** Antes de responder,
aplicar nada, o pedirle al usuario que describa algo: mirar la captura primero, siempre —
lo que se ve ahí es lo que hay, no lo que se supone que debería haber según la clase o el
override mandado (bug real de esta sesión: se le preguntó "¿seguís viendo mal?" habiendo
una captura ya adjunta sin abrir — el usuario, con toda razón, no entendió por qué se le
preguntaba algo que ya estaba mandando). Extraer y guardarlo así:
```bash
python3 -c "
import json, base64
with open('<archivo de salida del monitor>') as f:
    lines = [l for l in f.read().strip().split(chr(10)) if l.startswith('data:')]
d = json.loads(lines[-1][len('data: '):])
header, b64data = d['screenshot'].split(',', 1)
open('/tmp/lens-sk-live-shot.png', 'wb').write(base64.b64decode(b64data))
"
```
y despúes `Read` sobre ese PNG (la herramienta Read muestra imágenes directo). Si NO hay
`screenshot` en el evento, ahí sí puede hacer falta pedirle al usuario que aclare o adjunte
una — pero nunca preguntar algo que ya vino en el propio evento.

**Regla de payload: primero analizar el `prompt`, después decidir cuánto del resto hace
falta leer — no es lo mismo un cambio real que una pregunta suelta.**

- **Pedido de cambio de verdad** (el `prompt` describe un cambio visual/de contenido sobre
  el elemento, o el `type` es `commit`/`commit-all`/`locate`): seguís obligado a revisar el
  payload completo antes de tocar código o mandar `/reply` — parsear el JSON entero y mirar
  cada campo presente (`currentOverrides`, `descendantOverrides`, `domTree`,
  `computedStyle`, `parent`, `fileHint`, `attachments`, screenshot, etc.), no solo
  `prompt`/`selector`. Es información barata que ya viene en el evento; ignorarla lleva a
  responder con menos contexto del que el usuario ya mandó, o a preguntar algo que el
  payload ya contesta.
- **Pregunta suelta o comentario que NO pide tocar el elemento** (dudas sobre Lens-SK
  mismo, charla, pedidos "dev:" sobre el propio flujo, etc.): leer primero solo `prompt` (y
  `type`/`id` para poder responder). Recién si esa pregunta puntual necesita algo más —
  "¿por qué se ve así?" necesita el screenshot; "¿qué archivo es?" necesita `fileHint`—
  pedir/leer ESE campo específico del mismo JSON ya recibido (no hace falta ni hay
  mecanismo para pedirle más datos al navegador; todo el payload ya llegó de una, elegís
  qué parte procesar). Esto ahorra el procesamiento de campos grandes (`domTree`,
  screenshot) cuando no aportan nada a la respuesta.

**Cancelación (botón "Cancelar" del navegador):** puede llegar un evento
`{"id":"...", "cancelled": true}` — sin `type` ni el resto de los campos comunes. Significa
que el usuario cortó ESE pedido a propósito: el servidor ya le respondió al navegador
(`ok:false, error:"cancelled"`), no hace falta (ni sirve) mandar `/reply` para ese id — si
se llega a mandar de todos modos, el servidor devuelve 404 sin romper nada, pero es
trabajo de más. Si se estaba trabajando en ese id, cortar ahí — no seguir aplicando
cambios para un pedido que el usuario ya descartó.

Campos comunes a todos los tipos: `id`, `type`, `selector` (selector CSS único del
elemento), `tag`, `classes`, `textSnippet`, `componentGuess` (pista de a qué
componente/card pertenece, ver `.lens-sk-cache/project-map.json` del proyecto para
resolver selector→archivo:línea de forma confiable), `twcssMode` (booleano — estado del
switch "TWCSS" del panel al momento del pedido), `breakpointScale` (objeto `{lg: 992,
xl: 1280, ...}` — umbral real en px de cada breakpoint del proyecto, para no tener que
grepear `_containers.css` cada vez que hace falta razonar sobre algo responsive), `parent`
(string, `tag#id.clase` del padre inmediato — o `null` si es `<html>` — en qué contenedor
está metido, ¿flex-item? ¿grid-item?), `computedStyle` (objeto con SOLO 5 propiedades:
`color`, `backgroundColor`, `fontSize`, `display`, `position` — el valor REAL renderizado,
no inferido de las clases; a propósito no es el `CSSStyleDeclaration` completo, ni incluye
`width`/`height` — eso ya se ve en la captura), `fileHint` (`{file, line}` ya resuelto
del lado del navegador con el mismo mecanismo que 📍 Código — usarlo directo en vez de
resolver de nuevo con `componentGuess`/project-map cuando venga; puede ser `null` si el
navegador no pudo resolverlo, ahí sí hace falta el camino de siempre), `currentOverrides`
(objeto `{prop: {value, original, source}}` — cambios en vista previa YA pendientes del
PROPIO elemento del evento, `{}` si no hay ninguno. Revisar esto ANTES de sugerir algo
nuevo: si el elemento ya tiene un override de un pedido anterior, partir de ahí en vez de
chocar o duplicarlo), `descendantOverrides`
(array `[{selector, props}]` — lo mismo pero de los HIJOS del elemento, no del elemento en
sí — para tener el contexto completo del subárbol, no solo el elemento en aislamiento;
`commit-all` trae `fileHint` por item en vez de a nivel evento, ver más abajo), `domTree`
(string — árbol compacto del elemento y sus descendientes, tope real de **300 nodos /
3000 caracteres**, formato pensado para que lo lea la IA, no para que sea "legible" en el
sentido humano de indentación bonita: cada línea es `N:tag#id.clase1.clase2...` — el
número al inicio es la PROFUNDIDAD, no espacios/tabs repetidos (ahorra caracteres en
árboles anidados); las clases se recortan a un máximo de 6 por nodo, con `+N` al final si
había más (ej. `3:div.flex.items-center.justify-between.gap-6+2`); hermanos consecutivos
con la misma firma se colapsan en una sola línea con `×N` en vez de repetirse) +
`domTreeTruncated` (booleano, si se cortó por nodos o caracteres) — texto exacto para
complementar la captura, sin tener que inferir tags/anidamiento de la imagen.

Solo en `suggest`, opcional: `attachments` (array `[{name, kind, content?, contentRef?,
contentMode, truncated}]`) — documentos que el usuario adjuntó a mano con 📎. `kind` es
`'pdf'`, `'docx'`, `'xlsx'` o `'image'`. **El contenido real (texto extraído de PDF/DOCX/
XLSX, o la imagen) NO viaja inline en el JSON del evento — se sube a la carpeta de cache
del servidor y solo llega la referencia** (mismo mecanismo que `screenshotRef`, pedido
explícito del usuario para no inflar el payload): `contentRef.path` es la ruta local
absoluta lista para `Read`, `contentRef.url` es la URL HTTP equivalente si hiciera falta.
Para PDF/DOCX/XLSX el archivo referenciado es `.md` (texto plano/Markdown — PDF: texto
por página bajo encabezados `## Página N`; DOCX: texto plano; XLSX: una tabla Markdown por
hoja, con tope de 12000 caracteres, `truncated: true` si se cortó); para `'image'` es un
JPEG ya comprimido. `contentMode` indica cómo llegó: `'ref'` (el caso normal, usar
`contentRef`) o `'inline-fallback'` (la subida falló — ahí sí el `content` viejo viene
inline en el propio evento, usarlo directo sin ir a buscar ningún archivo). Tratar el
contenido de cada adjunto como parte real del pedido del usuario, no como metadata —
solo cambia CÓMO llega, no que haya que leerlo igual.

**Para "sacar" un override de CSS puro y volver al valor de la clase real: NINGÚN keyword
CSS sirve (`unset`/`initial`/`revert` — los tres probados y los tres fallaron en esta
misma sesión).** El estilo inline y la clase Tailwind son del mismo origen CSS ("author"),
así que hasta `revert` salta directo al valor por defecto del navegador (`none` en
`grid-template-columns`, el grid colapsa a 1 columna) en vez de caer en la regla de la
clase — no hay forma de que un inline style "se corra" para dejar pasar una clase del
mismo origen. La única forma real de volver al valor de la clase: **escribir ese valor
real explícito** (ej. `"grid-template-columns": "repeat(4, minmax(0, 1fr))"`), no un
keyword de reversión.

**CSS puro es SIEMPRE la capa de base — como el binario debajo de cualquier lenguaje —
Tailwind es solo una "vista" sobre eso que se arma recién al copiar o aplicar (pedido
explícito del usuario, corrigiendo un intento anterior de "verificar si la clase ya está
compilada" que el usuario descartó por no ser confiable — NO usar ese mecanismo, esta es
la versión final):**
- **`suggest` (vista previa) SIEMPRE va con propiedades CSS literales en `overrides`**
  (`color`, `grid-template-columns`, etc. — nunca `class` para resolver estilo). Así el
  preview funciona siempre, sin depender de si Tailwind ya generó o no esa utilidad —
  nunca hay que chequear nada para saber si se va a ver.
- **`commit`/`commit-all` (aplicar de verdad) es donde se decide el formato final, según
  `twcssMode`:** si viene `true`, convertir esas propiedades CSS a la clase Tailwind
  semántica equivalente del proyecto (buscar el token/utilidad real, ver convención del
  proyecto) antes de escribir. Si viene `false`, escribir el CSS literal tal cual (atributo
  `style` o una regla en el `.css` del componente) — sin forzar ninguna clase TW.

**Usar `/progress` activamente, con varios envíos reales por pedido — esto es
comportamiento esperado, no algo opcional para cuando sobra tiempo** (pedido explícito del
usuario, confirmado más de una vez: quiere ver, en el momento, cada paso técnico real que
tome más de un par de segundos — leer un archivo, correr un comando, un grep no trivial,
una investigación con herramientas — no solo las conclusiones. El chat/transcripción de la
IA es invisible para el usuario que trabaja desde el navegador: si un paso no se manda por
`/progress`, para él no existió, aunque yo lo tenga clarísimo en mi propia sesión.**Nunca
volver a la regla vieja de "solo conclusiones, no narrar cada paso interno" — quedó
descartada explícitamente.**). Cada `/progress` tiene que ser una mini-respuesta real, en
el mismo tono que la nota final — "Reviso el archivo cards/impact-stats-card.php…",
"Corriendo un grep sobre los componentes…", "Encontré el token, no había uno literal…",
"Aplicando el cambio…" — nunca relleno genérico tipo "trabajando" o "procesando" sin decir
qué. El navegador ya anima puntos (`.`/`..`/`...`) solo detrás de lo último que mandaste,
así que la ausencia de update no se nota como "colgado" — pero si hay algo real que
contar, se manda apenas se arranca ese paso o se llega a esa conclusión, no se guarda para
el final.

**Falla real ya cometida en esta sesión, no repetir:** una investigación de ~30s con
varios pasos (Chrome DevTools, greps, lectura de archivos) se hizo mandando UN SOLO
`/progress` al principio y nada más — el usuario solo vio puntos animados todo ese rato,
sin ninguna pista de qué se estaba revisando, aunque yo sabía perfectamente qué estaba
haciendo (visible en mi propia transcripción, invisible para él). El box es el ÚNICO
mecanismo de comunicación que el usuario tiene — no puede ver "por Chrome" lo que reviso,
así que cualquier paso que tome más de un par de segundos (abrir DevTools, correr un
grep no trivial, leer un archivo largo) necesita su propio `/progress` en el momento,
no un resumen recién al final.

**Falla real repetida en otra sesión (2026-08-13):** una IA distinta atendiendo un pedido
live encadenó varios `Bash`/`Read`/`Thought` (extraer referencia de captura, leer el
archivo real, etc.) sin mandar un solo `/progress` intermedio — todo eso quedó visible
solo en su propia transcripción de chat, caja negra total para el usuario del navegador.
Cada uno de esos pasos era exactamente el tipo de paso que tenía que generar su propio
`/progress` en el momento.
```bash
curl -X POST http://localhost:<PUERTO>/progress -H "Content-Type: application/json" \
  -d '{"id":"<id del evento>","text":"Leyendo cards/impact-stats-card.php…"}'
```

## Nunca cerrar con "sigo en el chat" — el usuario no ve el chat desde el navegador

**Regla dura, corrige un error real de esta sesión.** Un pedido `suggest` que resultó ser
un cambio de lógica/código real (no un estilo aplicable como preview) se cerró con
`/reply {ok:false, note:"sigo la conversación en el chat"}` — **mal**: mientras el
usuario trabaja desde el navegador/toolbar, NO tiene el chat de VSCode a la vista ("hace
de cuenta que no puedo ver el chat aunque te hable por Lens-SK", palabras del usuario).
Cerrar el evento y seguir en un canal que el usuario no está mirando lo deja sin ninguna
notificación real — mismo síntoma que no mandar `/progress`.

**Cómo seguir en su lugar:**
1. **NO** mandar `/reply` todavía solo porque el pedido no es un estilo simple.
   `activeCommand` sigue vivo (el navegador sigue esperando) — usalo.
2. Investigar/trabajar mandando `/progress` seguido con lo que se va encontrando (ver
   arriba), y `POST /ask` si hace falta preguntar algo — todo por el mismo `id`.
3. Recién mandar `/reply` cuando el trabajo esté REALMENTE terminado, con un `note` que
   resuma qué se hizo (no un "segui en el chat").

**Límite real del servidor — `REPLY_TIMEOUT_MS` = 5 minutos:** pasado ese tiempo sin
`/reply`, el servidor cierra el pedido solo con un error de timeout en el navegador, sin
importar cuántos `/progress` se hayan mandado (`/progress` NO resetea ese timer). Para
cualquier tarea que se sepa de entrada que va a llevar más de eso (una reconstrucción de
componente, una migración, algo de varios archivos):
- Mandar `/progress` mientras dure la ventana de 5 minutos, dejando claro en el texto que
  sigue en curso ("Esto va a llevar más de lo que dura este panel, sigo trabajando…").
- Cuando el servidor lo cierre solo por timeout, no hay `/reply` que mandar (ya se cerró
  del lado del servidor) — al terminar el trabajo de verdad, avisar con un
  `POST /ask-user` nuevo (ver sección de abajo) a modo de aviso ("Terminé: hice X, Y, Z —
  ¿lo revisás?"), no dejarlo sin ningún cierre visible para el usuario.

## Preguntas al usuario — dos protocolos, según haya o no un pedido en curso

**Regla de fondo: si el usuario contactó por Lens-SK, la pregunta va por Lens-SK, nunca
por el chat de VSCode** (salvo prefijo `dev:`, ver `feedback_preguntas_via_protocolo_ask_answer`
en memoria) — el usuario puede estar mirando el navegador, no esa ventana. Elegir el
protocolo según el contexto:

### A mitad de un pedido en curso (`/ask` ↔ `/answer`)

Hay un `id` de evento activo (`suggest`/`commit`/`commit-all`/`locate` sin `/reply`
todavía) y hace falta algo del usuario para resolverlo:

1. `POST /ask {"id": "<id del evento>", "question": "..."}` — el servidor la guarda en
   `activeCommand.question`.
2. El navegador la recibe en el mismo poll que ya usa para el progreso
   (`GET /progress?id=...` ahora también trae `question`) y la muestra en un cuadro
   propio (`.live-question`) con un input — distinto de `liveStatus`/`liveLastResultBox`.
3. El usuario responde ahí mismo; el navegador manda `POST /answer {id, answer}`.
4. El servidor reenvía la respuesta por el MISMO stream SSE que la IA ya tiene abierto en
   `/events` (evento `{id, answered:true, answer:"..."}`), igual que ya hace con
   `{id, cancelled:true}` para las cancelaciones — no hace falta abrir un poll nuevo.

### Sin pedido en curso (`/ask-user` ↔ `/answer-user`)

Ya se cerró el evento con `/reply` (o la duda surgió sola, sin que haya llegado ningún
pedido) y aun así hace falta preguntar algo — no caer en el chat por default:

```bash
curl -X POST http://localhost:<PUERTO>/ask-user -H "Content-Type: application/json" -d '{
  "question": "texto de la pregunta",
  "options": [{"label": "Opción 1"}, {"label": "Opción 2"}],
  "multiSelect": false
}'
```

**Bug real cometido:** mandar `"options": ["Opción 1", "Opción 2"]` (strings planos)
renderiza el modal CON los radio buttons pero SIN texto — `toolbar.js`
(`renderAskUserOptions`) lee `opt.label`, así que cada opción tiene que ser un objeto
`{"label": "..."}`, no un string suelto. `options` es opcional (si se omite, el modal
solo muestra el campo de texto libre).

Esta llamada queda ABIERTA (no responde el HTTP) hasta que el usuario conteste desde el
modal o pasen 30 minutos — lanzarla con `run_in_background: true` (Bash) y seguir
trabajando; la respuesta llega como notificación de background task cuando el usuario
responde. Si hace falta cancelarla antes (ej. se mandó con un bug, como options mal
formateadas), primero `GET /ask-user` para conseguir el `id` pendiente, después
`POST /answer-user {"id": "...", "cancelled": true}` para liberar el slot único antes de
volver a preguntar.

**Excepción de canal — prefijo `dev:`:** si el `prompt` (o la respuesta a una pregunta)
empieza con `dev:`, es el usuario probando el mecanismo a propósito — responder donde el
propio mensaje lo pida, típicamente en el chat, no por el protocolo live.

**Regla de oro del panel — dos elementos, dos roles, SIEMPRE los dos, nunca mezclados
(pedido explícito del usuario, confirmado más de una vez):**
- `liveStatus` (el "encabezado"): mientras se espera, es un título fijo + puntos animados
  (`Aplicando cambio…`, `Aplicando cambios…`, o el de Sugerir). Apenas llega la respuesta
  — éxito O error, cualquier tipo — se pisa por el encabezado final correspondiente
  ("✅ Cambio aplicado", "📤 Se aplicaron N cambios", "💬 Tu respuesta:", "❌ Error"). Este
  elemento NUNCA queda vacío al terminar un pedido.
- `liveLastResultBox` (el "detalle"): SOLO el contenido de `note` — nunca un encabezado
  ni un prefijo pegado adelante, eso va en `liveStatus`. **Mandá `note` siempre, tanto en
  éxito como en error** — se te va a pasar en algún momento (ya pasó en esta misma sesión),
  así que el propio cliente ahora tiene un texto de respaldo (`liveNoteFallbackOk`/
  `liveNoteFallbackFail`) si `note` viene vacío, para que este elemento NUNCA quede en
  blanco pase lo que pase. Eso es la red de seguridad, no una excusa para no mandar `note`
  — un texto de respaldo genérico es peor que uno real y específico.

Esto aplica a los CUATRO tipos de evento por igual, no solo a `suggest`.

**Siempre** hay que cerrar el pedido con `POST /reply` (si no, el navegador queda
esperando y el slot único del servidor queda trabado para el próximo pedido):
```bash
curl -X POST http://localhost:<PUERTO>/reply -H "Content-Type: application/json" -d '{...}'
```

**"💬 Tu respuesta" (línea de estado del panel) es el ÚNICO canal de texto libre de
la IA actual — para cualquier tipo de pedido, no solo Sugerir.** `note` (en éxito o en error)
siempre termina ahí, sea cual sea el `type`. Nunca en otro lado: el HISTORIAL es una
bitácora (qué se pidió + link al archivo + si se aplicó), no un lugar para explicaciones —
no le mandes prosa aparte, ni inventes otro canal.
- Con `ok:true`: `note` es opcional pero recomendado si hay algo que valga aclarar (qué
  elegiste y por qué, corto). Si no mandás nada, la línea queda solo con la etiqueta.
- Con `ok:false`: `note` es donde va la explicación de qué salió mal — no lo dejes vacío.

(Nota histórica: se probó un mecanismo de "verificar con grep si la clase ya está
compilada" para el bug de `lg:grid-cols-3` — el usuario lo descartó por no ser confiable.
La solución final es la de arriba: `suggest` siempre en CSS puro, sin necesitar verificar
nada. No reintroducir el grep.)

### `type: 'suggest'` (🪄 Pedir cambio — SOLO vista previa, no toca archivos)

Extra en el evento: `prompt` (texto libre del usuario), `screenshot?` (dataURL PNG).

Responder (CSS literal siempre, ver regla de arriba — nunca `class` para resolver esto):
```json
{"id":"...", "ok": true, "overrides": {"color": "#67800E"}, "note": "No hay un amarillo literal en la paleta, usé el hex de --color-tertiary directo.", "childOverrides": [{"selector": "...", "props": {...}}]}
```
`note` acá es opcional pero recomendado — es lo único que el usuario ve como respuesta
directa a su pedido en lenguaje natural, no lo dejes vacío si hay algo que valga aclarar
(ej. por qué elegiste ese valor en vez de otro). `overrides` es un mapa prop→valor CSS
real (`grid-template-columns`, `color`, etc. — no `class`; `text:N` sigue existiendo aparte
para el N-ésimo nodo de texto directo, eso no es estilo). El navegador lo aplica como
preview en `localStorage` — **no escribir nada a disco en este tipo de evento**, es
intencional (recién se escribe cuando el usuario aprieta 📤 Aplicar).
Si falla: `{"id":"...", "ok": false, "note": "por qué"}`.

### `type: 'commit'` (📤 Aplicar — un solo elemento, YA escribe a disco)

Extra en el evento: `overrides` — **OJO, acá viene en formato distinto a `suggest`/
`commit-all`**: cada prop es un objeto `{"value": "...", "original": "...", "source":
"claude"|"manual"}`, no el valor plano directo (es el registro completo del store interno;
`"claude"` es un valor legacy del protocolo, no texto visible ni nombre obligatorio de la IA)
del navegador, sin aplanar). Usar `overrides[prop].value`, no `overrides[prop]` a secas.
Localizar el archivo real (usar `componentGuess` + `.lens-sk-cache/project-map.json`,
o buscar por selector/clases si el mapa no alcanza). **Antes de escribir, chequeo barato:**
comparar el tag/clase del último tramo del `selector` contra la línea real de `fileHint`
(ver detalle y bug real en la sección `commit-all` más abajo) — si no coincide, resolver
por clase en vez de confiar ciego en `fileHint`.

**Con `twcssMode:true`, cada `overrides[prop]` trae además `class`: la clase Tailwind YA
RESUELTA por el navegador** (`valueToTailwindClass`, contra el CSS realmente compilado del
proyecto — el mismo mecanismo que usa el ícono 📋 de cada fila del panel para copiar, no
una reconstrucción a mano). **Usar `overrides[prop].class` directo cuando no sea `null` —
no grepear archivos fuente para adivinar la escala del proyecto, el navegador ya hizo ese
trabajo contra el estado real.** Solo si `class` viene `null` (el navegador no encontró
ninguna clase que matchee ese valor exacto) hay que resolverlo del lado de la IA: buscar
una clase semántica equivalente en el proyecto o, si no existe, usar sintaxis arbitraria
de Tailwind (`prop-[valor]`) — **ojo, las utilidades numéricas propias del proyecto tipo
`mt-px-*`/`p-px-*` (ver `tailwindcss/utilities/_sizes-rem.css`) NO aceptan decimales en
`--value(number)`** (`mt-px-14.4` no compila) — para un valor con decimales sin clase
exacta, usar la sintaxis arbitraria con corchetes (`mt-[14.4px]`), que sí los acepta.
Con `twcssMode:false`, `overrides[prop]` no trae `class` — escribir el CSS literal tal
cual, como siempre.

**Ojo con clases "combo" al combinar varios `class` resueltos en un mismo elemento** —
caso real: 4 props de tipografía resueltas dieron `text-h6` (font-family), `text-large`
(font-size), `text-h2` (font-weight) y `text-large` (line-height) — apilar las 4 en el
`class` habría sido un error: son clases MULTI-propiedad (cada una trae su propio
font-size/weight/etc. por `@apply` en cascada), así que combinarlas genera conflicto de
cascada (la última en el ORDEN DEL STYLESHEET gana por propiedad, no la que "se quería").
Antes de aplicar, revisar si UNA sola de las clases resueltas ya cubre varias/todas las
props a la vez (achá `text-large` sola resolvía las 4) — encontrarlo es rápido: mirar la
definición de esa clase en el `.css` fuente del proyecto. Preferir la clase más chica que
cubra todo, no la unión de todas las que matchearon cada propiedad por separado.

Responder `{"id":"...", "ok": true, "note": "opcional"}` o `{"id":"...", "ok": false,
"note": "por qué"}`.

**NUNCA compilar nada a mano — regla dura, corrige una demora real reportada por el
usuario.** `npm run dev` (lo que ya deja corriendo el modo live, ver `dev-inspector-toolbar`)
tiene Vite y el CLI de Tailwind en modo `--watch` — cualquier archivo que se edite
(`.php`, `.js`, clases nuevas incluidas) se recompila SOLO, en cuanto se guarda. Para
`commit`/`commit-all` eso significa: **el único paso real es escribir el archivo con la
línea/clase que corresponde. Nada de `npx @tailwindcss/cli build`, nada de `npx vite
build` — eso ya lo hace el watcher, correrlo a mano es trabajo repetido y es la fuente
principal de la demora reportada por el usuario.**

- **Clase reusada** (`overrides[prop].class` no es `null`, tal cual o combinada según la
  regla de arriba) **o clase arbitraria nueva** (`class` vino `null`): en los dos casos,
  escribir el archivo y `/reply`. El watcher se encarga de que exista en el CSS servido
  — no hay diferencia de proceso entre los dos casos, la única diferencia es qué clase se
  escribe.
- **Lint PHP** (`ddev exec php -l`): solo si se tocó lógica real (un `if`, una función,
  un loop) — no por un cambio de atributo `class` en una línea existente.

**Cero verificación por default — pedido explícito y final del usuario.** El pedido que
llega por Lens-SK ya está validado: el usuario lo está viendo funcionando en vista previa
en su propio navegador ANTES de mandarlo (así arma cualquier `commit`/`commit-all`) — no
hace falta `curl`, Chrome DevTools MCP, ni `ddev logs` para confirmar que el cambio "se
ve bien" o "se aplicó". Escribir el archivo y `/reply` es el flujo completo.
**Usar Chrome DevTools/curl/logs SOLO si el usuario dice explícitamente que algo no se
aplicó** (o un `/reply {ok:false}` genuino por un error real al escribir) — nunca como
paso de rutina "por las dudas".

### `type: 'commit-all'` ("Aplicar todos" — TODOS los cambios pendientes de la página)

Extra en el evento: `items: [{selector, overrides, fileHint}]`, `twcssMode`. **Payload
recortado a propósito (pedido explícito del usuario)**: NO trae `label`, `viewportWidth`
ni `breakpoint` — nunca se usaban (`fileHint` ya da archivo+línea directo, y el override
siempre se escribe como clase base sin prefijo de breakpoint, nunca `md:`/`lg:`). Cada
item de `items[]` es autosuficiente — "Aplicar todos" puede juntar cambios de componentes
distintos en un solo pedido, y cada uno trae su propio `fileHint`, no hace falta agrupar
ni adivinar a qué archivo pertenece cada uno. Acá `overrides[prop]` es plano
(`{"margin-top": "14.4px", ...}`) salvo con `twcssMode:true`, donde cada prop viene como
`{"value": "...", "class": "..."}` (mismo mecanismo que `commit`, ver arriba — usar
`class` directo si no es `null`). `fileHint` ya viene resuelto por item, no hace falta
recalcularlo con `componentGuess`.

**Chequeo de seguridad barato antes de escribir (pedido explícito del usuario, no
contradice "cero verificación por default" de arriba — esto no es un build/lint/curl, es
leer el archivo que de todos modos hay que abrir para editar):** el último tramo del
`selector` (después del último `>`) ya trae el `tag.clase` real del elemento editado — ej.
`h3.card__title.min-h-[...]`. Al leer la línea de `fileHint` para aplicar el cambio,
confirmar de un vistazo que el tag/clase coincide con lo que hay ahí. **Bug real ya
cometido:** un `fileHint` apuntó a `components/posts-slider.php:46` (el wrapper del
componente) para un `h3.card__title` que en realidad vivía en
`cards/posts-slider-card.php:72` — el navegador tenía cacheado un mapa de componentes
viejo (ver "Recargar el navegador..."). Si no coincide, NO escribir ahí a ciegas — buscar
el archivo real por esa clase (grep rápido o `.lens-sk-cache/project-map.json`) antes de
aplicar, y devolver en `files` el `file`/`line` real usado, no el de `fileHint`.

Aplicar cada item a su archivo real (mismo criterio que `commit`). Responder:
```json
{"id":"...", "ok": true, "note": "opcional", "files": [{"file":"components/x.php", "line": 14}]}
```
**`files` va en el MISMO ORDEN que `items` — una entrada por item, siempre, sin saltarse
ninguno** (si algún item ya estaba aplicado de un intento anterior, igual incluir su
entrada `{file, line}` en la posición que le toca, no hace falta reescribirlo, pero no se
omite del array). El navegador ya NO matchea por `selector` para limpiar el pendiente —
usa la posición contra los `selectors` que él mismo guardó al armar el pedido (más robusto
que confiar en un `selector` devuelto, que puede haber cambiado del lado del navegador
entre que se mandó el evento y llegó esta respuesta — bug real: una clase de estado de
Swiper que se mueve sola dejaba el pendiente huérfano para siempre). Por eso: **`selector`
en `files` ya no es necesario** (se puede seguir mandando por compatibilidad, pero el
navegador lo ignora para esto) — lo único que importa es `file`/`line` correctos, EN
ORDEN. Si el orden no coincide con `items`, el file/line queda asociado al item
equivocado en el historial.
Si falla completo: `{"id":"...", "ok": false, "note": "por qué"}`.

### `type: 'locate'` (📍 Código — cuando el navegador no pudo resolverlo solo)

Sin campos extra más allá de los comunes. Responder `{"id":"...", "ok": true, "file":
"components/x.php", "line": 14}` o `{"id":"...", "ok": false}` si no se puede ubicar.

## Recargar el navegador tras crear/refactorizar componentes o tocar el sistema de color/tipografía

**Regla dura.** Mientras el modo live está activo, si en esta misma conversación se crea, refactoriza o modifica un componente (archivos nuevos, `get_template_part` movido, líneas desplazadas) — sea a pedido de un evento live o de un pedido normal del usuario en el chat mientras el modo sigue activo —, o si cambia el sistema de color/tipografía (`tailwindcss/plugins/variables.js`, `_typography.css`, tokens `--color-*`), **recargar la pestaña del navegador conectada antes de dar el trabajo por terminado o de seguir atendiendo pedidos live sobre ese componente.**

**Why:** `toolbar.js` cachea dos cosas UNA SOLA VEZ por carga de página, asumiendo que no cambian en runtime:
- `componentMapCache`/`elementIndexCache` (`ensureComponentMap()`) — el mapa clase→archivo:línea que resuelve 📍 Código/`componentGuess`. El archivo en disco (`.lens-sk-cache/project-map.json`) SÍ se regenera solo (el propio `lens-sk-live-server.js` levanta `lens-sk-project-map.js --watch` como proceso hijo), pero el navegador ya abierto no lo vuelve a pedir — sigue resolviendo con el mapa viejo (archivo/línea que ya no corresponden) hasta que se recarga.
- `projectColorVarsCache` (`getProjectColorVariables()`) — los tokens `--color-*` para el selector de color de la vista previa en vivo. Mismo criterio: una sola lectura por carga de página.

**How to apply:** si tengo Chrome DevTools MCP conectado a esa pestaña, recargarla yo mismo (`navigate_page` tipo `reload`) apenas termino el cambio. Si no tengo esa conexión (el usuario prueba en su propio navegador, fuera de mi control), avisarle explícitamente que recargue la página antes de seguir probando — no asumir que el archivo/línea o los colores que ve son los actuales sin decirlo.

**Bug real ya cometido, no repetir:** en una misma sesión se renombró/partió un componente (`stories-slider` → `posts-slider`, con la card movida a un archivo `cards/` aparte) sin pedir recarga en el momento. Pedidos live posteriores sobre ese componente llegaron con `fileHint` apuntando al archivo/línea VIEJOS (el wrapper del componente, no la card real donde vivía el elemento) — se detectó a tiempo comparando el selector contra el contenido real del archivo antes de escribir, pero podría haberse escrito en el lugar equivocado sin darse cuenta. Cualquier refactor de componentes en la sesión, aunque parezca chico, dispara esta regla — no esperar a que el `fileHint` "se vea raro" para recordar recargar.

## Cortar la escucha

`TaskStop` sobre el task del `Monitor`. También se corta sola si termina la sesión/el
contexto de esta conversación.
