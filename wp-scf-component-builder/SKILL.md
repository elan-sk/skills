---
name: wp-scf-component-builder
description: Crea y conecta componentes de WordPress con Secure Custom Fields (SCF, fork de ACF) a partir de un diseño (imagen, Figma, HTML), con naming BEM-guion-bajo y el core de Tailwind CSS v4 (tw-design-system). Por defecto arma páginas con varios componentes usando "Flexible Content" (plantilla + field group compartido, layouts reordenables desde el admin). Úsalo con "hazme este componente", "conecta este diseño", "crea el campo SCF para X", "arma esta sección en home/single/categoría", "layout builder"/"bloques reordenables"/"reutilizar componente entre páginas", "color de fondo seleccionable desde el admin", "clone field", campos ACF/SCF, get_field/have_rows/get_row_layout/get_template_part, inspección con Chrome DevTools MCP, o para generar el JSON de un grupo de campos SCF a partir de una imagen anotada a mano. Requiere Claude Code con filesystem local y Chrome DevTools MCP.
---

# WP SCF Component Builder

## REGLA DURA: cero comentarios en el código (usuario, 2026-10-09)

- No escribir **ningún** comentario en el código: ni explicaciones, ni notas de implementación, ni "guías" para la persona o para la IA. Sobre todo en el frontend: plantillas (Django/Twig/PHP/JSX), CSS, JS y config de build. Tampoco en archivos generados por un comando.
- Todo el racional, las decisiones y el contexto van a archivos `.md` del proyecto (`MEMORY.md` de la raíz, `design.md`, `docs/`, `specs/NNN-*/historial.md`), nunca al código.
- Al copiar código de otro proyecto, quitarle los comentarios.
- En plantillas Django/Wagtail, `{# #}` es de **una sola línea**: en varias líneas se imprime como texto en la página. Motivo: así quedaron impresos en la página de Estilos de Racafé.


Skill para crear componentes de temas WordPress personalizados (SCF + TWCSS v4 propio) a partir de un diseño, conectarlos a la plantilla correcta, y verificarlos visualmente con Chrome DevTools MCP.

**Requiere ejecutarse en Claude Code** (o entorno equivalente con filesystem real + MCP local). No funciona en claude.ai web porque necesita acceso al tema en disco y a un navegador apuntando a la instalación local.

**Skills complementarios que SIEMPRE hay que cargar junto a este:**
- `tw-design-system` — para traducir el diseño a clases del core TWCSS v4 propio (nunca usar colores literales, media queries manuales, o utilidades base de Tailwind cuando exista equivalente semántico).
- `frontend-design` — para criterios de dirección visual cuando el diseño da margen de interpretación.

---

## Detectar WP-CLI en el entorno (antes de darlo por no disponible)

Cada vez que este skill necesite confirmar si hay WP-CLI (reimportar un field group, seed de contenido, etc.), **no alcanza con probar `which wp` y concluir que no está**. Muchos entornos locales (DDEV, Lando, Docker Compose) no exponen el binario `wp` directo en el PATH del host — lo envuelven dentro de un contenedor. Antes de decir "WP-CLI no disponible":

1. Probar `which wp` (bare) — si aparece, listo, usarlo directo.
2. Si no aparece, buscar el gestor del entorno local: `which ddev`, `which lando`, o `docker ps` (¿hay contenedores del proyecto corriendo, ej. `ddev-<proyecto>-web`?).
3. Si hay **DDEV**: usar `ddev wp <comando>` en vez de `wp <comando>` — corre dentro del contenedor igual de bien. Análogo con **Lando**: `lando wp <comando>`.
4. Solo después de descartar estas envolturas, confirmar al usuario que WP-CLI no está disponible en el entorno.

### Estado conocido de este proyecto

Este proyecto corre sobre **DDEV** (contenedores `ddev-cafexport-web`/`ddev-cafexport-db`). El binario `wp` no está en el PATH del host — usar siempre `ddev wp <comando>` para cualquier operación de WP-CLI (reimportar field groups, `update_field`, etc.).

---

## Reutilizar antes de construir

Antes de crear un componente, card, loop, campo o clone nuevo, buscar en `components/`, `cards/`, `loops/` y `field-groups-json/` uno ya probado igual o parecido, y reutilizarlo (clone field, `get_template_part` con args, extraer parcial compartido) en vez de duplicarlo desde cero. Crear desde cero solo si no hay nada reutilizable, y decir por qué.

## Flujo completo (7 pasos)

### Paso 1 — Recolectar inputs mínimos

Antes de tocar código, confirmar que tenés estos 4 datos. Si falta alguno, preguntar — no asumir:

1. **Diseño** del componente (imagen, link de Figma, HTML de referencia, o descripción detallada).
2. **Nombre del componente** (si no lo da el usuario, proponer un slug kebab-case descriptivo y confirmar).
3. **Plantilla/página destino** donde se va a insertar (ej: `home`, `single`, `category`, o el nombre de archivo `.php` directo).
4. **Ruta del tema** en el proyecto actual (buscar automáticamente, ver Paso 2).

Si el usuario ya dio los 4 en su mensaje, no volver a preguntar — pasar directo al Paso 2.

### Paso 1.5 — ¿Proyecto nuevo o actualización de uno existente?

Antes de reconciliar el diseño con lo que ya existe en el tema, resolver esto:

- **Proyecto nuevo** (aunque arranque desde un tema/base existente como scaffold, ej. un child theme reutilizado solo para no partir de cero): el diseño que está pasando el usuario **manda siempre**. No hay que detenerse a reconciliar nombres, estructura o campos con componentes que ya estén en el repo — esos son solo el punto de partida técnico, no la fuente de verdad de contenido/diseño.
- **Actualización** de un proyecto ya en producción: si el diseño nuevo entra en conflicto con un componente/campo ya existente (nombre distinto, estructura distinta, etc.), **preguntar** cómo resolverlo (extender lo existente, reemplazarlo, crear uno aparte) — no decidir por cuenta propia.
- **No queda claro** si es proyecto nuevo o actualización: preguntar directamente antes de seguir. No asumir ninguno de los dos casos.

Si el usuario ya aclaró explícitamente el contexto (ej. "es un proyecto nuevo, uso este tema como base"), no volver a preguntar — aplicar la regla que corresponda.

### Paso 2 — Resolver la URL local del sitio

1. Buscar un archivo `.env` en la raíz del tema (mismo nivel que `functions.php`, `style.css`). Si no está ahí, buscar también en la raíz del proyecto WordPress completo.
2. Dentro del `.env`, buscar (en este orden de prioridad) alguna de estas variables: `LOCAL_URL`, `WP_HOME`, `SITE_URL`, `VITE_DEV_URL`, `WP_SITEURL`.
3. Si se encuentra `LOCAL_URL` (o equivalente), usarla como base. Ejemplo real de este usuario: `LOCAL_URL=https://blog-veterinario.lndo.site`.
4. **Si no hay `.env` o ninguna variable coincide, preguntar la URL local directamente** — no inventarla ni asumir `localhost`.

### Paso 3 — Resolver la ruta completa de la página a inspeccionar

Combinar la URL base del Paso 2 con la plantilla/página del Paso 1:

- Si la plantilla es la **home** (`Template Name: Home`, o el usuario dice "home"/"inicio"): la ruta es la raíz del sitio, `{LOCAL_URL}/`.
- Si es un **single de post**, **category**, **archive**, u otra plantilla que depende de un registro específico: **preguntar al usuario el slug o ruta relativa exacta** (ej: `/blog/mi-post-de-ejemplo/` o `/category/veterinaria/`). No adivinar un slug que no existe.
- Si el usuario ya da la ruta completa o el nombre de archivo de plantilla sin ambigüedad, usarla directo.

El resultado de este paso es la URL final de referencia para comprobaciones locales o, si hace falta, para abrir en Chrome DevTools MCP.

### Paso 4 — Inspeccionar el contexto local

1. Resolver la plantilla/página destino leyendo archivos locales, field groups y, cuando haga falta, WP-CLI (`ddev wp ...` en este proyecto).
2. Ubicar dónde se inserta el componente según la plantilla PHP del Paso 1 y los layouts guardados en la página real.
3. Leer el archivo de la plantilla destino (`home.php`, `single.php`, etc.) y **todos los componentes que ya carga**. Si la plantilla ya sigue el patrón Flexible Content (dispatcher `have_rows()`/`get_row_layout()`/`get_template_part()`, ver `code-patterns.md` #1.5), **el orden NO está en el archivo** — está en el orden de los layouts ya guardados en la página real (admin o field-groups-json). Si la plantilla todavía es la vieja (llamadas fijas de `get_template_part()` en secuencia), anotar el orden y wrappers (ej: `decorated-section` que alterna fondo con `nth-child(odd)`) igual que antes.
4. Si la carpeta de componentes tiene un `components/` u otra distinta a la default, usar la que indique el usuario (default: `components/`, cards de repeaters van en `cards/`).
5. **Chrome DevTools MCP / capturas visuales NO son obligatorias por defecto.** Para bajar costo de estas peticiones, solo abrir Chrome, sacar screenshots o hacer verificación visual completa cuando haya una duda real que no se pueda resolver con archivos/HTML/build, cuando el resultado renderizado parezca sospechoso, o cuando el usuario lo pida explícitamente porque algo salió mal. Si el componente es directo, el HTML renderiza y las verificaciones técnicas pasan, no gastar una ronda extra en Chrome solo por protocolo.

No generar código todavía — este paso es solo de reconocimiento.

### Paso 5 — Resolver el grupo de campos SCF

0. **Default desde 2026-07-15: Flexible Content (convención B de `references/naming-conventions.md`)** para cualquier página con más de un componente, salvo que el usuario pida explícitamente la convención C (field group fijo por página, sin reordenar). Antes de decidir, buscar si el proyecto **ya tiene una plantilla + field group compartido de este patrón** (ej. `templates/flexible-page.php` + field group "Página Flexible"):
   - **Si ya existe:** el componente nuevo se agrega como **un layout más** dentro de ESE field group compartido (mismo campo `flexible_content`, mismo `name` único de siempre) — no crear field group ni plantilla nueva. Ir directo al Paso 6 con esto en mente.
   - **Si no existe todavía** y la página va a tener varios componentes: proponer armar el patrón Flexible Content desde cero (plantilla compartida + field group con un `flexible_content`) en vez de un field group fijo por página — confirmar con el usuario antes si es la primera vez que se usa este patrón en el proyecto.
   - **Componente realmente suelto** (una sola sección, sin variantes de orden, ej. un widget de sidebar): sigue aplicando la convención A sin cambios.
1. Buscar en el tema una carpeta `acf-json/` (auto-sync del plugin) **y** `field-groups-json/` (carpeta propia de este proyecto, ver debajo) un archivo cuyo `title`/`key` coincida con el nombre del componente, de la página, o del field group compartido de Flexible Content si ya existe. **Regla dura — no crear grupos de campos nuevos a la ligera:** esta búsqueda no es solo por nombre de componente, también por **contexto/ubicación** (`location`: la misma options page, el mismo archive/plantilla). Si el componente nuevo se inserta en una página/archivo que **ya tiene un field group propio** (ej. una options page como `historia-archive-settings` con su grupo de hero), los campos del componente nuevo se agregan **a ese mismo grupo existente** (mismo `key` de field group, mismo `location`), no se crea un field group aparte solo porque el componente en sí es nuevo — un field group por `location` compartida, no un field group por componente, cuando esa `location` ya está en uso.
2. Si existe, leerlo para conocer los nombres reales de los campos (y los layouts ya definidos, si es Flexible Content) y no inventarlos.
3. Si **no existe**, y el diseño requiere campos (texto, imagen, repeater, etc.):
   - Preguntar al usuario si ya creó el grupo de campos en el admin de WP, o si querés que generes vos el JSON siguiendo la convención de nombres (Paso 6.2 y `references/naming-conventions.md`).
   - Si el usuario no tiene el grupo creado y pide que lo generes, guardar el archivo `.json` en `field-groups-json/` en la raíz del tema (crear la carpeta si no existe) con los field names y keys correctos, **para importación manual** desde Field Groups → Tools → Import — no es la carpeta `acf-json/` de auto-sync del plugin (el proyecto no usa ese mecanismo salvo que el usuario pida lo contrario). Avisar que igual va a tener que revisar en el admin las location rules (dónde se muestra el grupo de campos) porque eso no se puede inferir solo del diseño.

### Paso 6 — Generar el/los archivo(s) del componente

Ver `references/naming-conventions.md` y `references/code-patterns.md` para las reglas exactas (BEM con guion bajo, escaping, patrones de WP_Query, etc.) — son de lectura obligatoria antes de escribir código.

Resumen rápido:

1. Cargar `tw-design-system` y `frontend-design` para traducir el diseño a clases del core propio. Antes de escribir la lista de clases, revisar `tailwindcss/bases/*.css` para no pelear ni duplicar sus defaults por tag (`philosophy.md §12` — ej. `section` ya trae padding propio, así que un componente full-bleed como un slider necesita pisarlo explícito con `p-0`; un `<h2>` ya sale con `text-h2` sin necesidad de repetir la clase). Si el componente usa una librería externa (Swiper, etc.), sus overrides visuales van en `tailwindcss/libraries/{lib}.css`, no repetidos inline (`philosophy.md §13`). **Para cualquier layout de columnas/filas, usar `flex-grid`/`flex-grid-*`/`flex-grid-gap-*` del core propio, nunca `grid`/`grid-cols-*` de Tailwind** salvo que el layout sea genuinamente complejo (ver guardrail de `tw-design-system`) — preferencia explícita y repetida del usuario.
2. **Regla dura, sin excepción de tamaño:** cualquier bloque que se genere dentro de un `foreach`/`while(have_rows())` va en su propio archivo `cards/{componente}-card.php` (o `cards/{componente}-{parte}-card.php` si ese mismo repeater se renderiza en más de un lugar del layout, ej. una lista de ítems en una columna y su contenido asociado en otra — un archivo `cards/` por cada parte visual distinta), llamado con `get_template_part()` pasando `item`/`index`/`class_name` vía `$args` + `extract($args)` (patrón `slider-main` → `cards/slider-main-card.php`). Nunca dejar el markup de una fila inline dentro de `components/{componente}.php`, aunque sea muy corto — el objetivo es que el archivo del componente se lea de un vistazo, sin mezclar layout general con contenido repetido. Preferencia explícita del usuario, CAFEXPORT 2026-08-05: se refactorizó `accordion-gallery.php` (mezclaba layout + 2 bloques de foreach inline) a `components/accordion-gallery.php` + `cards/accordion-gallery-item-card.php` + `cards/accordion-gallery-pane-card.php`.
3. Si el archivo del componente ya existe, **sobrescribirlo** (el usuario lo pidió explícitamente — no generar `-v2` ni pedir confirmación extra salvo que el diseño cambie drásticamente respecto al existente).
4. Seguir el estilo de PHP visto en los ejemplos del usuario: `while(have_rows(...)): the_row(): ... endwhile;` para repeaters, escaping consistente (`esc_html`, `esc_url`, `esc_attr`), `wp_reset_postdata()` después de cualquier `WP_Query` custom. **Guard de sección:** si el componente vive dentro del patrón Flexible Content (default, ver Paso 5), NO lleva wrapper `if (get_field($class_name)):` — usar `get_sub_field($class_name.'__campo')` directo, la presencia del layout en el builder ya es el guard (ver `code-patterns.md` #1.5). Solo los componentes sueltos o de field group fijo (convención A/C) llevan el `if (get_field($class_name)):` tradicional.
5. **Regla dura #1:** cada campo/subcampo individual va envuelto en su propio `if` — nunca imprimir el HTML de un campo vacío o inexistente, ni siquiera dentro de una sección que ya pasó su guard general (ver `references/code-patterns.md` #11).
6. **Regla dura #2:** `$class_name` (y `$class_card` si aplica) se define una sola vez al inicio del archivo, y todo el resto del componente —clases CSS, `get_field`/`have_rows`, prefijo de `get_sub_field`, ruta de la card— se construye a partir de esa variable, nunca repitiendo el slug como string literal (ver `references/code-patterns.md` #12).
7. **Regla dura #3 — campos genéricos, no atados a un proveedor/plugin concreto:** si un campo va a guardar algo intercambiable (shortcode, URL de embed, ID externo), su `name`/label describen **qué es**, nunca **de qué plugin viene hoy** (ver `references/naming-conventions.md` "Principio: campos genéricos"). Y si ese campo queda vacío, nunca cae en un valor hardcodeado como fallback silencioso — se muestra un aviso visible solo para `current_user_can('edit_posts')`, nunca al público.
8. **Color de fondo seleccionable:** si el proyecto ya tiene el campo compartido `bg-color` (Clone field, ver `references/naming-conventions.md`), todo componente nuevo del patrón Flexible Content lo recibe automáticamente por venir clonado en cada layout — solo hay que consumirlo en el PHP con el patrón de `references/code-patterns.md` #1.6 (fallback al color original si el diseño ya tenía uno fijo, sin fallback si no). Si el proyecto NO lo tiene todavía y el usuario pide poder cambiar el color de fondo desde el admin, proponer armarlo (no asumir que quiere esto en cada componente nuevo sin que lo pida).
9. **Prerrequisito — subcampo de título para el admin:** si el layout tiene un campo de encabezado/título real, su `name` tiene que ser exactamente `{layout}__title` (patrón BEM de siempre, no requiere nada extra) — ver `references/naming-conventions.md` sección "Subcampo de título para el admin". Con ese nombre, el filtro genérico ya armado en `functions/utils/utils.php` (`acf/fields/flexible_content/layout_title/name=page-builder`) muestra ese valor real en el título colapsado de la fila del admin en vez del nombre fijo del layout — necesario para distinguir filas repetidas del mismo layout sin abrirlas una por una. No crear un filtro nuevo por componente, ni pedir confirmación para esto — es automático apenas el nombre del subcampo coincide.

### Paso 7 — Conectar y verificar

1. **Si el patrón es Flexible Content (default):** NO tocar la plantilla PHP (el dispatcher ya la recorre sola) — el componente queda "conectado" con solo (a) el archivo `.php` creado en `components/` y (b) el layout agregado al field group compartido e importado a la base. Para verlo en una página real, cargar contenido de ejemplo con `update_field('nombre-campo-flexible-content', $rows, $post_id)` incluyendo `'acf_fc_layout' => 'nombre-componente'` en la fila (ver `references/seed-example-content.md`), o agregarlo a mano desde el builder del admin.
   **Si el patrón es field group fijo (A/C):** insertar el `get_template_part('components/nombre-componente');` en la plantilla destino, en el lugar correcto según lo observado en el Paso 4 (respetando wrappers como `decorated-section`).
2. Verificar técnicamente con el menor costo suficiente: lint PHP, build/sort si aplica, import/sync de field group si se tocó JSON, y una comprobación de HTML/render por `curl` o WP-CLI cuando baste para saber que el componente está conectado.
3. **Chrome DevTools SOLO para creación de un componente nuevo genuinamente complejo — regla dura, explícita, pedido directo del usuario.** Para cualquier otra cosa (aplicar un cambio, ajustar algo simple, editar un componente ya existente, un fix puntual) **NO usar Chrome DevTools MCP, ni por defecto ni "por las dudas"** — el costo de abrir Chrome, recargar y sacar screenshots no se justifica salvo que se esté creando de cero un componente con interacción/estructura genuinamente compleja (ej. un slider con varios estados, un editor visual, algo que no se pueda validar leyendo el HTML/CSS resultante). Ante la duda entre "es simple" o "es complejo": tratarlo como simple y no abrir Chrome. Única excepción real: el usuario dice explícitamente que algo no se aplicó o se ve mal — recién ahí verificar visualmente.
4. Si hay diferencias visuales relevantes, iterar el componente (no la plantilla) antes de dar el trabajo por terminado. **Chequeo de fidelidad al detalle** (falla real ya cometida: se copió `rounded-2xl` de un componente parecido que no estaba en el boceto pasado, y un `<h1>` sin clase perdió la alineación a la izquierda que sí mostraba el boceto): antes de reusar markup de un componente similar existente, verificar cada detalle visual del boceto/imagen recibido (alineación de texto, esquinas redondeadas o no, espaciados) uno por uno contra ese boceto — la similitud estructural entre componentes no autoriza copiar detalles visuales que el boceto actual no mostraba. Si el proyecto tiene un documento de sistema de diseño (`design.md` o similar), leerlo antes de escribir el markup — **regla estricta, sin excepción, incluso si el plan es reutilizar un átomo/clase que ya existe en el core** (que ya esté en el codebase no significa que cumpla la regla vigente; puede ser anterior a ella o pensado para otro contexto). Caso real, CAFEXPORT 2026-08-08: se reusó `.chip` (`rounded-full`, pensado para fondo oscuro) como filtro de categorías sin releer `design.md` primero, violando la regla ya documentada de esquinas rectas — el usuario lo señaló como error directo. Si el boceto resuelve una discrepancia o agrega un patrón nuevo, dejarlo anotado ahí.
5. Reportar al usuario: qué archivos creó/modificó, si generó o no un JSON de campos SCF nuevo, si el field group era compartido o nuevo, y si quedó pendiente algo que solo se puede hacer desde el admin de WP (asignar location rules, cargar contenido real en los campos, etc.).
6. **Si el modo live de Lens-SK está activo en esta conversación** (ver `lens-sk-live-listen`): crear/refactorizar/mover un componente, o tocar el sistema de color/tipografía, deja desactualizado el mapa archivo:línea y los tokens de color que el navegador ya tiene cacheados en memoria — recargar la pestaña conectada (o pedirle al usuario que lo haga) antes de seguir. Detalle completo en la sección "Recargar el navegador..." de `lens-sk-live-listen`.

---

---

## Capacidad alternativa: generar JSON de grupo de campos SCF desde diseño anotado

Cuando el usuario pide **solo** construir/generar el JSON de un grupo de campos SCF para importar (no necesariamente crear ni conectar el componente PHP todavía), y comparte una imagen del diseño con anotaciones a mano (nombre de campo + tipo, ej. `Title: text`, `Cards: Repeater`), seguir `references/json-field-group-generation.md` en vez del flujo completo de 7 pasos. Antes de escribir el JSON final, chequear siempre `references/scf-schema-reference.md` (tabla verificada de qué propiedades acepta cada `type` de campo según el JSON Schema real de SCF). Resumen:

1. Leer las anotaciones de la imagen y la jerarquía visual (qué va dentro de un `group`/`Repeater`).
2. Aplicar el naming BEM (`references/naming-conventions.md`) a cada campo — la anotación es solo para identificar el campo, no es el `name` final.
3. **Regla por defecto:** si la anotación indica un solo tipo (texto O imagen), crear un único campo de ese tipo — es el caso normal. **Solo** si la anotación marca explícitamente ambigüedad de tipo (ej. `text|image` para el mismo campo), armar un `group` con ambos subcampos + un campo `true_false` que decida cuál se muestra. No asumir esto último salvo que esté anotado así.
4. Generar `key` únicas con el patrón `group_`/`field_` + hex, mapear tipos según la tabla de la referencia, y preguntar si aparece un tipo no mapeado.
5. Entregar el JSON como array y guardarlo en `field-groups-json/`. Avisar si el `location` rule quedó como supuesto y hay que confirmarlo a mano.
6. **Si hay WP-CLI accesible en el entorno, importar el JSON directamente a la base de datos uno mismo** (`wp acf json import <archivo>`) — no dejarlo como paso manual del usuario en Field Groups → Tools → Import salvo que WP-CLI no esté disponible ahí. Reimportar es seguro: actualiza por `key` en vez de duplicar.

**Si la imagen NO trae anotaciones de texto**, hay que inferir la estructura solo por lectura visual (repetición de bloques → repeater, indicadores de slider, rol visual de cada elemento para el tipo de campo). En ese caso, **siempre proponer la estructura inferida en texto y esperar confirmación antes de generar el JSON** — nunca generarlo directo de una inferencia sin confirmar. Ver la sección "Inferencia visual" en `references/json-field-group-generation.md` para los casos ambiguos (cantidad fija vs. repeater, repeater vs. flexible content, campos opcionales).

Este flujo puede combinarse con el flujo completo: primero generar el JSON de campos, importarlo, y después seguir con el Paso 6 en adelante para crear el componente PHP que consume esos campos.

---

## Capacidad alternativa: editar un field group que ya existe (cambiar tipo de campo, choices, labels)

Cuando el pedido es modificar un campo ya importado/en uso (no crearlo de cero), seguir `references/editing-existing-field-groups.md` — cubre 4 gotchas reales encontrados editando el campo compartido `bg-color` de un proyecto real: (1) editar el `.json` de `field-groups-json/` no tiene efecto solo, hay que confirmar `acf/settings/load_json` o reimportar con WP-CLI o editar directo en el admin; (2) el textarea de choices exige el separador exacto `" : "`, y una opción de valor vacío ("ninguno"/"sin elegir") se resuelve mejor con el valor `"0"` (falsy en PHP, sin tocar código) que con un string vacío frágil; (3) cómo verificar de forma confiable que un cambio a un campo `Clone` fuente se propagó a todos los layouts que lo clonan, sin caer en el falso negativo de una pestaña vieja del editor sin refrescar; (4) cómo armar un cuadrito de color junto a cada opción de un selector de admin con `button_group` + CSS `:has()`, sin JS ni cambiar el valor guardado.

---

## Capacidad alternativa: llenar contenido de ejemplo/prueba y verificar visualmente

Cuando el usuario pide cargar **contenido de ejemplo real** (textos, imágenes, links) en un post/página concreta después de importar un grupo de campos — típicamente para tener datos con qué armar y ver los componentes PHP en vez de campos vacíos — seguir `references/seed-example-content.md`. Resumen:

1. Confirmar que WP-CLI está disponible y que `update_field()`/`get_field()` existen (plugin SCF/ACF activo) antes de asumir el camino de base de datos.
2. **Preferir WP-CLI + `update_field()` (API nativa de SCF) sobre automatizar la UI del admin con Chrome DevTools MCP** para el llenado masivo — más rápido y confiable, sobre todo con repeaters/grupos anidados. Reservar la UI para la verificación visual final.
3. Buscar imágenes ya subidas por el usuario (Media Library / `wp-content/uploads/`) y **verlas de verdad antes de asignarlas** a un campo — no elegir solo por nombre de archivo, y no inventar/descargar placeholders de internet sin que se pida.
4. Un `update_field()` por componente de nivel superior (no uno por subcampo), con el patrón de arrays anidados que describe la referencia — ojo con el detalle de que las keys dentro de un `group` van sin repetir el prefijo del grupo, y que los campos de imagen se setean con el ID del attachment, no el array completo.
5. Si aparece un campo faltante en el esquema durante el llenado, corregir el `.json` en `field-groups-json/` y reimportar con `wp acf json import <archivo>` (actualiza por `key`, no duplica) antes de seguir.
6. Verificar visualmente al final con Chrome DevTools MCP. Si no hay sesión logueada en el admin, buscar primero `WP_ADMIN_USER`/`WP_ADMIN_PASSWORD` en el `.env` del tema (junto a `LOCAL_URL`) antes de preguntar — si no están ahí, **no intentar bypasear el login sin avisar** — preguntar cómo seguir (login manual del usuario, guardar la credencial en ese `.env` si el usuario la da, sesión vía WP-CLI solo en local/dev, o posponer la verificación). Confirmar siempre que ese `.env` esté en `.gitignore` antes de escribir una credencial ahí — si el proyecto no lo ignora, avisar antes de guardar nada (riesgo de subir la clave al repo/deploy).

---

## Capacidad alternativa: manual de usuario final con instructivo ilustrado del admin

Cuando el usuario pide un manual/documentación para el cliente final que explique **cómo usar el admin de WordPress** (agregar/editar/reordenar secciones de Flexible Content, elegir una plantilla de Elementor, etc.), y quiere capturas del panel de administración con indicadores señalando cada botón:

1. **No perseguir un login real si se traba.** Generar una sesión autenticada por cookie (vía `wp_set_auth_cookie()` en un `wp eval-file`, forzando `$_SERVER['HTTPS']='on'` antes de llamarla si el sitio se sirve por HTTPS local tipo DDEV, para que el scheme de la cookie generada coincida con el que va a validar el request real) puede quedar bloqueado por el clasificador de seguridad de Claude Code, incluso sin exponer el secreto en el comando de shell (pasándolo por archivo). Si eso pasa dos veces, no seguir insistiendo — avisar al usuario y ofrecer la alternativa de abajo, o pedirle credenciales/acceso directo si de verdad hace falta una captura 100% real.
2. **Alternativa que funciona bien igual: recrear la pantalla en HTML/CSS propio**, replicando fielmente los estilos reales de WP-admin/ACF-SCF (barra admin oscura `#1d2327`, botón primario azul `#2271b1`, metabox blanco con borde `#c3c4c7`, fila de Flexible Content con manija de arrastre + íconos duplicar/eliminar/colapsar) y screenshotearla con Chrome headless (mismo mecanismo que capturas normales). Aclarar en el texto del manual que es una recreación fiel, no una captura literal.
3. **Patrón de anotación validado (usar siempre, no improvisar otro):**
   - **Nunca** dibujar flechas cruzando la imagen ni cajas de texto superpuestas sobre el elemento que se está señalando — el usuario lo marcó como error directo dos veces en la misma sesión ("las flechas se cruzan y tapan lo que vas a mostrar").
   - En su lugar: un contorno fino (outline, sin relleno) alrededor del botón/ícono real señalado, y un círculo numerado pequeño apoyado en la esquina de ese contorno, **por fuera** del elemento (nunca lo tapa).
   - El texto explicativo de cada número **no va dentro de la imagen** — va debajo, como una lista numerada normal en HTML (mismo componente visual que ya se use para "campo → descripción" en el resto del manual). Esto evita texto chico ilegible y mantiene la imagen limpia.
   - Ver `wp-content/themes/*/manual-componentes-cafexport/` (o el manual entregado más reciente) como referencia concreta si existe en el proyecto.
4. **Ancho del contenedor:** una sección con capturas de admin necesita más espacio horizontal que el texto de lectura normal del resto del manual (que puede quedarse en ~700-900px). Si el documento tiene un `--ancho-maximo`/contenedor general angosto, agrandarlo (o hacer que esa sección específica rompa el ancho) a algo como 1100-1200px — capturas de UI reales pierden legibilidad si se aprietan a un ancho de columna de texto. Verificar siempre con una captura del manual renderizado (no asumir que "se ve bien" solo por el CSS) y chequear que no aparezca scroll horizontal en mobile (~390px).
5. Si el usuario pide mostrar además "las internas" (páginas de detalle/single de un post type), verificar primero **contra el código real** (`single.php`, location rules del field group) si ese post type realmente soporta agregar las mismas secciones del builder debajo del contenido, o si solo muestra `the_content()` a secas — no asumir. Si hay más de un post type parecido (ej. posts normales vs. un CPT tipo "historias"), puede que solo uno de los dos tenga el campo habilitado: decirlo explícito en el manual en vez de generalizar.
6. **Exportar el manual HTML a PDF, sin tocar el HTML fuente:**
   - **Multi-página estándar** (el caso normal): `google-chrome-stable --headless=new --print-to-pdf=archivo.pdf archivo.html` desde CLI. Por default Chrome pagina en Letter y puede cortar tarjetas/imágenes a la mitad entre páginas. Para evitarlo **sin alterar la vista en pantalla del manual**: agregar al final del `<style>` del HTML un bloque `@media print{ ... break-inside:avoid; page-break-inside:avoid; ... }` sobre los bloques atómicos (cada tarjeta, cada `.captura`/imagen, cada fila de tabla de campos) — esas reglas solo aplican al imprimir/exportar, cero impacto en la lectura normal del manual en el navegador.
   - **Una sola hoja gigante sin ningún corte** (si el usuario lo pide explícitamente, ej. "que no quede texto a medias, una hoja grande donde quepa todo"): el flag CLI `--print-to-pdf` no permite tamaño de página custom. Hace falta ir directo al protocolo CDP `Page.printToPDF` vía WebSocket (Node ≥18 trae `fetch`/`WebSocket` nativos, cero dependencias nuevas): lanzar chrome con `--remote-debugging-port`, medir `document.documentElement.scrollHeight`/`scrollWidth` reales del documento ya cargado, convertir píxeles a pulgadas (÷96, más un margen chico), y llamar `Page.printToPDF` con `paperWidth`/`paperHeight` iguales a esa medida exacta, `marginTop/Bottom/Left/Right:0`, `printBackground:true`. Resultado: 1 sola página del alto exacto del contenido, sin paginar nunca — más simple y más confiable que intentar afinar `break-inside` para que "todo entre justo".
   - Verificar siempre el PDF resultante renderizándolo a imagen (`pdftoppm -png -r 100 …` de poppler-utils) y revisando con la herramienta de lectura de imágenes antes de darlo por entregado — no asumir que "se ve bien" solo porque el comando no tiró error.

---

## Capacidad alternativa: duplicar el sistema de estilos (colores/tipografía/botones) a Elementor

Cuando la página Flexible Content incluye (o va a incluir) un layout de "bloque libre" editable directamente en Elementor (post_object → `elementor_library`, render con `get_builder_content_for_display()`), y el usuario pide que los mismos tokens del core (`tw-design-system`) estén disponibles nativamente en el Design System de Elementor (Variables + Global Classes) para que ese bloque libre se pueda editar en marca sin volver al código: cargar `tw-design-system` y seguir `references/frameworks/elementor.md` de esa skill — no reinventar el mecanismo acá. Resumen de por qué importa: la UI de Elementor (selector de fuentes en particular) no es confiable por automatización de navegador para esto; la vía real es PHP directo contra `_elementor_global_variables` (colores/fuentes) y `Global_Classes_Repository` (tipografía/botones como Global Classes), verificando siempre contra la base de datos real, no contra el estado de la UI.

---

## Cuándo preguntar vs. cuándo asumir

**Preguntar siempre:**
- Si no queda claro si es proyecto nuevo o actualización (ver Paso 1.5) — y si es actualización, cualquier conflicto entre el diseño nuevo y un componente ya existente.
- URL local si no hay `.env` con variable reconocible.
- Slug/ruta de páginas que no sean la home.
- Nombre del grupo de campos si no coincide ni por el nombre del componente ni por búsqueda en `acf-json/` o `field-groups-json/`.
- Carpeta de destino del componente si el proyecto no sigue `components/`/`cards/`.

**Asumir con la convención por defecto (y avisar que se asumió):**
- Carpeta `components/` para el contenedor y `cards/` para las cards de un repeater.
- Carpeta `field-groups-json/` en la raíz del tema para guardar los `.json` de field groups generados para importación manual (crearla si no existe) — **no** `acf-json/` (esa es la carpeta de auto-sync del plugin, no se usa salvo que el usuario pida lo contrario). Ver Paso 5.
- **Patrón Flexible Content compartido** (una plantilla + un field group con todos los componentes de ese tipo como layouts) para cualquier página con más de un componente, en vez de field group fijo por página — ver Paso 5.0 y `references/naming-conventions.md` convención B. Solo usar field group fijo (C) si el usuario confirma que esa página nunca va a necesitar reordenar/reutilizar secciones.
- Nombre del campo `flexible_content` único en todo el proyecto (nunca repetir `page-builder` en dos field groups distintos) — ver el gotcha de SCF en `references/naming-conventions.md`.
- Nombre del grupo de campos = slug del componente (o slug de la página/patrón compartido, ver `references/naming-conventions.md`).
- Naming BEM: `{slug-componente}__{campo}` para subcampos (ver referencia de naming).
