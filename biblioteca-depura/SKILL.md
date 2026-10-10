---
name: biblioteca-depura
description: 'Memoria documental y procedimental de Depura Creatividad (biblioteca.depura-creatividad.com): Componentes (código reutilizable: PHP/ACF/SCF, Drupal, React, SCSS/Tailwind, por proyecto) e Instructivos (normas, convenciones, procedimientos, conceptos, soluciones). CONSULTARLA EN SILENCIO, sin pedir permiso, ANTES de crear o maquetar un componente, sección, slider, formulario, header/footer, filtro, plugin o snippet, y antes de decidir naming, estructura, deploy o convenciones — para reutilizar patrones y respetar las normas de la empresa. También cuando el usuario diga "biblioteca", "librería de componentes", "instructivo", "manual de la empresa", "¿ya tenemos un X?", "documentá/subí este componente", "actualizá el instructivo", "borrá esa entrada". Crear/editar/eliminar SIEMPRE va por propuesta con link de aprobación de un administrador; puede subir imágenes y archivos, y toda entrada nueva debe llevar portada (imagen destacada) siempre que sea posible.'
---

# Biblioteca Depura

Sitio WordPress con dos tipos documentales, servidos por el plugin propio **Biblioteca Depura** (`wp-content/plugins/biblioteca-depura` del repo `~/Documentos/DEPURA/DEPURA-SITE-DEV/library-components`). Esta skill **no depende de Novamira**: usa la API `biblioteca/v1` con el script `scripts/bd`.

| Tipo API | Qué documenta | Clase (`clase`) |
|---|---|---|
| `component` (Componente) | Código reutilizable | Banner, Carousel, Filtro, Formulario, Grid, Layout, Mosaico, Slider, Tipo de contenido, Utilidades… |
| `handbook` (Instructivo) | Normas y conocimiento | Norma, Procedimiento, Concepto, Solución, Referencia (únicas clases válidas) |

Cada entrada se clasifica en 3 ejes: **`stack`** (WordPress, Drupal, React, Tailwindcss…), **`clase`** y **`proyecto`** (Cafexport, Hidrotecno, Palmas, Racafe, Dts Solar, Sanitex, Hisense, Alfa Laval). Además tiene una **ficha**: `resumen`, `cuando_usar`, `estado` (vigente | revision | obsoleto), `relacionados` (IDs) y, en instructivos, `obligatoriedad` (obligatorio | recomendado | informativo).

**Proyecto** (hasta 2026-10-10 se llamaba `cliente`; esa clave ya no existe en la API): para qué proyecto se hizo la entrada. Una entrada puede pertenecer a **varios** proyectos. Cada proyecto tiene nombre, detalle (descripción) e imagen, que se editan en wp-admin (no por la API).

Cada eje tiene su archivo en el sitio, con todas sus entradas (solo visible para el equipo):

| Eje | URL |
|---|---|
| Todos los proyectos | `/proyectos/` |
| Un proyecto | `/proyecto/{slug}/` (ej. `/proyecto/cafexport/`) |
| Un stack | `/category/{slug}/` |
| Una clase de componente | `/component_type/{slug}/` |
| Una clase de instructivo | `/handbook_type/{slug}/` |

## Conexión (incluida en la skill)

Por decisión del usuario (2026-10-07), la conexión viaja dentro de la skill: quien la tiene es porque él se la dio. `scripts/bd` la toma de aquí si no hay `config`.
```bash
BD_URL=https://biblioteca.depura-creatividad.com
BD_TOKEN=ltOrwNuk14p71sD1sFkJoIb15MS9vowtGS4XT1qu
```
Orden en que `scripts/bd` busca la conexión: variables de entorno → `config` de esta carpeta → `~/.config/biblioteca-depura/config` → este bloque del `SKILL.md`. Si da 401, el token se regeneró: pedirle al usuario el nuevo (wp-admin → menú Biblioteca IA → «Conexión de la skill») y actualizar **este bloque y el `config`**. No mostrar el token en el chat.

## Consultar (invisible: no pedir permiso ni anunciarlo largo)

El script es `scripts/bd`, relativo a la carpeta de esta skill (la ruta base que informa el agente al cargarla, p. ej. `~/.claude/skills/biblioteca-depura` o `~/.codex/skills/biblioteca-depura`).

```bash
B="<carpeta de esta skill>/scripts/bd"
$B indice | jq -c '.[] | {id,tipo,titulo,stack,clase,proyecto,resumen,estado,portada}'   # barrido barato de todo
$B indice | jq -c '.[] | select(.portada|not) | {id,titulo}'   # entradas sin imagen de portada
$B indice component "slider"        # filtrar por tipo y texto
$B entrada 714                      # detalle: ficha, contenido (markdown), archivos[] con código, campos[], descargas[]
$B taxonomias                       # términos existentes antes de clasificar algo (+ `proyectos_sin_imagen`, `proyectos_sin_descripcion`)
$B url https://biblioteca.depura-creatividad.com/proyecto/cafexport/   # TODAS las entradas de esa URL
```

**Si el usuario pasa la URL de un archivo** (un proyecto, un stack, una clase de componente o de instructivo), no pedirle las entradas una por una: `$B url URL` devuelve `{eje, termino, descripcion, entradas[]}` con las mismas filas del índice. Con eso se elige qué abrir con `entrada ID` (en serie). Si la URL es la de una entrada, devuelve esa entrada completa. Para «todo lo de X» sin URL, filtrar el índice: `$B indice | jq -c '.[] | select(.proyecto | index("Cafexport"))'`. Con un link «Conectar IA» de PMSK, ese X es el proyecto del link: empezar el barrido por lo que ese proyecto ya tiene documentado.

Flujo: 1) `indice` y filtrar con jq por stack/clase/resumen; 2) abrir con `entrada` solo los 1–3 candidatos; 3) reutilizar su código/estructura. Respetar los instructivos con `obligatoriedad: obligatorio` del stack en uso. Ignorar `estado: obsoleto` salvo como referencia histórica. Al usar algo, mencionarlo en una línea ("Basado en *Banner Main (Hidrotecno)*, #714").

**Alcance acotado por un enlace en el proyecto de PMSK** (decisión del usuario 2026-10-10): con un link «Conectar IA» en la sesión, antes de revisar la biblioteca leer los enlaces del **proyecto** en PMSK (`links` de `GET /projects/:id`; en un link de tarea el id es `projectId`, y los enlaces del proyecto no vienen en el contexto de la tarea: hay que pedirlos). El usuario pone ahí el enlace una sola vez, no en cada tarea.
- Si alguno es el archivo de un eje de la biblioteca (`/proyecto/{slug}/`, o `/category/…`, `/component_type/…`, `/handbook_type/…`): `$B url <enlace>` y la revisión se limita a **esas entradas**. No se hace `$B indice` de toda la biblioteca ni se abren entradas de otros proyectos. Con varios enlaces, se suman.
- Ese proyecto es además el `terminos.proyecto` de lo que se documente: el enlace manda sobre el emparejamiento por nombre.
- Si el enlace es de una entrada suelta, se lee esa entrada (no acota el resto).
- Lo único que se consulta fuera de ese alcance son las normas obligatorias: `$B indice handbook | jq -c '.[] | select(.obligatoriedad=="obligatorio" and .estado!="obsoleto") | {id,titulo,stack}'` (una llamada, son pocas) y abrir solo las del stack en uso.
- Sin ningún enlace de la biblioteca en el proyecto: flujo de siempre (barrido corto por stack y palabras clave).

## Crear / editar / eliminar (siempre con aprobación)

Nunca escribir directo (ni por Novamira ni por SQL) para cambiar contenido de la biblioteca: se envía una **propuesta** y un administrador la aprueba desde un link.

0. Antes de enviar, revisar el contenido contra «Comandos y enlaces siempre copiables» (más abajo): comandos de una línea con la clase `copy`, código de varias líneas con Enlighter, nada de `<em>` para énfasis.
1. Mostrar al usuario en texto qué se va a proponer y por qué (lo pide su AGENTS.md), incluyendo qué imagen se usará de portada (o por qué no hay).
2. Escribir el JSON en el scratchpad y enviarlo con `$B proponer archivo.json`.
3. Darle al usuario el link `aprobar` (vence en 24 h). Él lo abre logueado como admin (menú Biblioteca IA, con contador de pendientes), ve el diff y aprueba o rechaza.
4. Confirmar con `$B estado ID` antes de decir que quedó aplicado.

```jsonc  // los comentarios son aclaraciones: no van en el JSON real
{
  "accion": "crear | editar | eliminar",
  "tipo": "component | handbook",          // solo en crear
  "id": 714,                                // en editar/eliminar
  "motivo": "Qué cambia y por qué (obligatorio, lo lee el admin)",
  "datos": {                                // en editar: SOLO lo que cambia
    "titulo": "Banner Main",
    "contenido": "<h2>Qué es</h2><p>…</p>",  // HTML completo; para editar partir de `entrada ID html`
    "estado_post": "publish | draft",        // crear publica por defecto
    "terminos": {"stack": ["WordPress"], "clase": ["Banner"], "proyecto": ["Hidrotecno"]},  // reemplazan los del eje
    "ficha": {"resumen": "…", "cuando_usar": "…", "estado": "vigente", "relacionados": [712], "obligatoriedad": "obligatorio"},
    "archivos": [{"nombre": "banner-main.php", "lenguaje": "PHP", "ruta": "components/banner-main.php", "tipo": "Component", "codigo": "<?php …"}],
    "campos": [{"nivel": 1, "etiqueta": "Banner main", "machine": "banner-main", "tipo": "Layout/Group"}],
    "adjuntos": [{"ref": "portada", "archivo": "/ruta/portada.png", "alt": "Banner main en escritorio"}, {"ref": "acf", "archivo": "/ruta/acf-banner-main.json"}],
    "imagen_destacada": "portada",
    "imagenes_proyecto": {"Hidrotecno": "icono"},  // opcional: imagen para un proyecto que no tiene (ref de un adjunto imagen)
    "descripciones_proyecto": {"Hidrotecno": "Uno o dos párrafos…"},  // opcional: detalle para un proyecto que no tiene (texto plano)
    "descargas": [{"texto": "Campos ACF (JSON)", "adjunto": "acf"}]
  }
}
```
- **Imágenes y archivos** (`adjuntos`): cada uno con `ref` única, `archivo` (ruta local; el script lo convierte a base64) y `alt` si es imagen. Tipos: jpg, jpeg, png, gif, webp, pdf, zip, json; máx. 5 MB c/u y 10 por propuesta. Se usan así:
  - `"imagen_destacada": "ref"` → imagen destacada de la entrada.
  - `{{adjunto:ref}}` dentro de `contenido` → se reemplaza por la imagen (tamaño large, centrada) o por un link si no es imagen.
  - `"descargas": [{"texto": "Campos ACF (JSON)", "adjunto": "ref"}]` → sección Descargas/Anexos. Reemplaza la lista completa: para conservar las existentes, incluirlas como `{"texto": "...", "id": <id de la entrada descargas[].id>}`.
  Hasta la aprobación los archivos quedan en una carpeta protegida; nada entra a la biblioteca de medios sin aprobación.
- Si alguien edita la entrada después de enviar la propuesta, la aprobación queda bloqueada (conflicto): volver a leer la entrada y reenviar.
- `archivos` y `campos` reemplazan la lista completa: en editar, enviar la lista entera. `codigo` va como texto plano (el plugin lo envuelve en el resaltador).
- `lenguaje`: HTML, JavaScript, PHP, React, SCSS, Twig, YML, Otro. `tipo` de archivo: Component, Block, Card, Field, Filter, Form, Function, Include, Layout, Library, Logic Frontend, Loop, Template, Styles, View, Otro.
- `campos.tipo` usa el formato de la tabla ACF (`Basic/Text`, `Content/Image`, `Layout/Repeater`…); en Drupal, el de Drupal (`Texto/Texto (sin formato)`…).
- Eliminar manda a la papelera (recuperable).
- Términos nuevos se crean al aprobar: preferir los existentes (`taxonomias`).
- **Proyecto en toda entrada que salga de un proyecto concreto**: `terminos.proyecto` es una lista y admite varios (`["Cafexport", "Racafe"]`) cuando el mismo código o norma se usó en más de uno. En editar, la lista reemplaza la anterior: para sumar un proyecto, enviar los que ya tenía más el nuevo. La clave vieja `cliente` se ignora. Un proyecto nuevo se crea al aprobar, sin imagen ni detalle: avisarle al usuario para que los complete en wp-admin → Proyectos.
- **Con link «Conectar IA» de PMSK en la sesión** (`/api/v1/claude-link/…`, skills `pmsk`/`sdd`): el proyecto de ese link es el `proyecto` de lo que se documente, sin preguntarle al usuario. Tomar el nombre tal como se ve en PMSK (en un link de tarea, el del proyecto al que pertenece la tarea) y compararlo con `$B taxonomias`: si ya existe un proyecto que es claramente el mismo (mismo nombre, o el de la biblioteca es la forma corta: «Cafexport» para «Cafexport — Sitio web»), usar el existente tal cual está escrito; si no existe, usar el nombre de PMSK y decir en el resumen de la propuesta que se creará un proyecto nuevo. Si hay dos candidatos posibles, preguntar. Nunca inventar el nombre. Si la tarea del link trata de **otro** proyecto que ya existe en la biblioteca (lo nombran su título, su descripción o el repo; ej. una tarea de «Crecer», que es de Racafe, dentro del proyecto de PMSK «Depura Creatividad»), la entrada lleva **los dos** proyectos, sin preguntar (decisión del usuario 2026-10-10). El ícono de PMSK es solo para el proyecto de PMSK, nunca para el otro.
- **Imagen del proyecto desde PMSK** (decisión del usuario 2026-10-10): si el proyecto de la entrada no tiene imagen en la biblioteca —aparece en `proyectos_sin_imagen` de `$B taxonomias`, o es un proyecto nuevo— y el proyecto de PMSK tiene ícono (`iconUrl` en `GET /projects/:id`), descargarlo al scratchpad, sumarlo a `adjuntos` (`{"ref": "icono", "archivo": "/ruta/icono.png", "alt": "Ícono de <proyecto>"}`) y enviar `"imagenes_proyecto": {"<nombre del proyecto>": "icono"}` en la misma propuesta de la entrada. Se aplica al aprobar y **solo si el proyecto sigue sin imagen** (nunca pisa la que alguien cargó a mano), así que no adjuntarlo cuando el proyecto ya tiene. Solo jpg, png, gif o webp: si el ícono es SVG u otro formato, o PMSK no tiene ícono, no se envía y se le dice al usuario. Única fuente válida para esto: el ícono de PMSK o una imagen que entregue el usuario; nunca una de terceros. No hay propuesta que cambie solo la imagen de un proyecto: va siempre dentro de la de una entrada (crear o editar).
- **Detalle del proyecto desde PMSK** (decisión del usuario 2026-10-10): al crear una entrada de un proyecto, o al editarla o revisarla, si ese proyecto no tiene detalle en la biblioteca —aparece en `proyectos_sin_descripcion` de `$B taxonomias`, o es nuevo— y el proyecto de PMSK tiene descripción (`project.description` del link; es HTML y suele ser larga), enviar en la misma propuesta `"descripciones_proyecto": {"<nombre del proyecto>": "…"}`. El texto es un **resumen propio de uno o dos párrafos concisos** (qué es el proyecto, para quién y qué se construyó; unas 40–90 palabras en total), en texto plano, con una línea en blanco entre párrafos; nunca pegar la descripción completa de PMSK, ni fechas, precios, credenciales o datos internos. Solo con lo que diga PMSK: si la descripción está vacía, no se inventa y se le dice al usuario. Se aplica al aprobar y solo si el proyecto sigue sin detalle (no pisa el que alguien escribió). Igual que la imagen, viaja siempre dentro de la propuesta de una entrada.

## Imágenes: portada como mínimo

La API **sí puede subir imágenes y archivos** (ver `adjuntos` arriba). Usarlo:

- **Toda entrada nueva lleva portada (`imagen_destacada`) siempre que sea posible.** Sin portada la tarjeta y la entrada muestran un placeholder gris.
- **De dónde sacar la imagen**, en este orden:
  1. La que entregó el usuario (diseño, captura, mockup, Figma exportado).
  2. Una captura del componente funcionando (sitio local o real del proyecto). Pedir autorización antes de abrir el navegador si la regla del usuario lo exige.
  3. Para instructivos sin elemento visual: una captura de la pantalla o herramienta que se explica (panel, admin, terminal).
  4. Si no hay ninguna fuente real: decirlo y preguntar al usuario. **Nunca inventar** ni usar imágenes de terceros sin permiso.
- **Al editar** una entrada sin portada (`portada: false` en el índice), proponer agregarla si se tiene una imagen adecuada.
- **Imágenes dentro del contenido** con `{{adjunto:ref}}` cuando ayuden a entender (pasos de un instructivo, variantes de un componente). Siempre con `alt` descriptivo.
- **Archivos útiles para reutilizar** (JSON de campos ACF/SCF exportado, zip de assets, PDF de referencia) van en `descargas`.
- Formato recomendado para portada: webp o png, horizontal (~1200×675), menos de 1 MB.

## Comandos y enlaces siempre copiables (regla del usuario, 2026-10-10)

Todo lo que un desarrollador vaya a copiar debe copiarse con un clic. La Biblioteca tiene dos métodos y se usan los dos, según el tamaño:

| Qué | Método | Marcado |
|---|---|---|
| Comando o valor de **una sola línea** | Clase `copy` del tema (`js/utils/copy.js`): agrega un ícono que copia el texto | `<p class="copy"><code>npm run dev</code></p>` |
| **Código de varias líneas** (una clase, una plantilla, varios comandos seguidos) | Resaltador Enlighter, el mismo de la sección de archivos: trae su botón de copiar | `<pre class="EnlighterJSRAW" data-enlighter-language="shell">…</pre>` |

- **Nunca** un comando solo dentro de una imagen o un diagrama, ni en un `<pre>` sin clase.
- **La clase `copy` es de una sola línea** (el tema le pone `white-space: nowrap`): un comando por elemento. Si varios se corren seguidos, cada uno va con `copy` y además se da el bloque completo con Enlighter.
- **Lenguajes de Enlighter:** `shell`, `python`, `php`, `js`, `html`, `css`, `scss`, `json`, `sql`, `yaml`, `generic`. Plantillas Django o Twig van como `html`. El contenido del `<pre>` va con las entidades escapadas (`&lt;`, `&gt;`, `&amp;`).
- **Direcciones que se copian** (rutas locales, repositorios para clonar): `<p class="copy"><a href="URL">URL</a></p>`. Las demás son enlaces normales (`<a href>`).
- **`<em>` no se usa para énfasis:** el tema también lo convierte en copiable. Sirve para un valor suelto dentro de un párrafo; para énfasis va `<strong>`.
- **Los diagramas explican, no reemplazan:** si un gráfico muestra comandos o direcciones, el texto los repite en forma copiable.

## Plantillas de contenido (legibles para humanos)

**Componente**: `## Qué es` → `## Cómo usarlo` (dónde se incluye, dependencias, pasos) → `## Variantes y notas`. El código va en `archivos` y los campos en `campos`, no en el contenido.

**Instructivo**: `## Propósito` → `## Regla` (norma) o `## Pasos` (procedimiento) o `## Explicación` (concepto/solución) → `## Ejemplo` (correcto / incorrecto) → `## Excepciones`.

Ficha: `resumen` en 1–2 líneas concretas (qué hace + stack), `cuando_usar` con casos y cuándo NO.

## Errores comunes
- 401 → token faltante o regenerado. 404 → el ID no es componente/instructivo.
- 400 → falta `motivo`, `tipo` o `datos.titulo`; leer `message`.
- Estado `vencida` → reenviar la propuesta.
- 500 al hacer varias consultas en paralelo: el hosting limita concurrencia. Consultar en serie.
