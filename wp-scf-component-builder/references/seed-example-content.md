# Llenar contenido de ejemplo/prueba y verificar visualmente

Capacidad: después de generar e importar un grupo de campos SCF (ver `json-field-group-generation.md`), el usuario puede pedir que se cargue **contenido de ejemplo real** (textos, imágenes, links) en un post/página concreta, para poder armar y ver los componentes PHP con datos reales en vez de campos vacíos. Típicamente se pide junto con "para que cuando armemos los componentes ya existan datos".

## Paso 0 — Confirmar que el grupo ya está importado

No asumir: comprobar que el field group ya existe en la base de datos antes de intentar llenarlo (si el usuario dice explícitamente que ya lo importó desde el admin, confiar en eso y verificar rápido con `wp post meta list <post_id>` — deberían aparecer los meta_key con el patrón `_{campo}` → `field_...`).

## Paso 1 — Elegir el método: WP-CLI + API nativa de SCF, no automatización de UI

Comparar antes de arrancar (y decírselo al usuario si hay ambigüedad):

- **WP-CLI + `update_field()`/`get_field()` (recomendado por defecto):** SCF/ACF exponen su propia API en PHP. Si el entorno tiene WP-CLI accesible (`ddev wp ...`, `wp ...`, o vía SSH), se puede ejecutar un script PHP con `wp eval-file` que llama a `update_field()` una vez por componente. Es rápido, no requiere login, y usa la misma lógica interna de serialización de repeaters/grupos que usa el admin — evita el riesgo de escribir mal el formato interno de postmeta a mano.
- **Chrome DevTools MCP (automatizar la UI del admin):** válido pero mucho más lento y frágil para repeaters con muchas filas (cada fila = varios clicks: "Agregar fila", expandir grupo, abrir modal de medios, elegir imagen, tipear texto). Requiere una sesión ya logueada en el navegador. Reservarlo para cuando el usuario prefiera explícitamente ver el llenado paso a paso, o para la verificación visual final (Paso 5), no para el llenado masivo.

Antes de escribir nada, confirmar que el entorno realmente permite el camino de WP-CLI:
```bash
which ddev wp
ddev wp plugin list   # confirmar que "secure-custom-fields" o "advanced-custom-fields-pro" están "active"
ddev wp eval 'echo function_exists("update_field") ? "SI" : "NO";'
```
Si `update_field`/`get_field` no existen, no asumir que sí — investigar por qué (plugin inactivo, ruta de WP-CLI incorrecta) antes de seguir.

## Paso 2 — Buscar imágenes reales en vez de inventar/descargar placeholders

Si el usuario menciona que ya subió imágenes a la Media Library (o simplemente no dice nada y hay que revisar qué hay disponible):

1. Listar attachments: `wp post list --post_type=attachment --fields=ID,post_title,guid`.
2. **Ver las imágenes candidatas de verdad antes de asignarlas** — no elegir solo por el nombre de archivo. Si hay acceso de filesystem al proyecto (bind mount de `wp-content/uploads/`), usar la herramienta de lectura de imágenes directamente sobre el archivo en disco (más rápido que pedir la URL) para confirmar que el contenido visual encaja con el rol del campo (hero, retrato de testimonio, paisaje de finca, etc.).
3. Nunca generar ni descargar imágenes placeholder de internet sin que el usuario lo pida explícitamente — el objetivo es usar activos reales ya provistos.

## Paso 3 — Escribir el script de siembra

Patrón: un solo `update_field()` por **componente de nivel superior** (no uno por sub-campo) — mucho más simple y menos propenso a errores:

- **Si el patrón de la página es Flexible Content (default, ver `naming-conventions.md` convención B):** un único `update_field('nombre-campo-flexible-content', $rows, $post_id)` para TODA la página, donde `$rows` es un array con **una fila por componente/layout que se quiera mostrar**, cada fila con `'acf_fc_layout' => 'nombre-del-layout'` más sus propios subcampos como keys (mismo patrón de nombres que un `group`, ver abajo). El orden de `$rows` es el orden en que se van a renderizar. Si un layout es a su vez un repeater interno (ej. `hero-slider__items`), va como una key más de esa fila cuyo valor es el array de sub-filas.
- Si el componente es un **repeater de nivel superior** (patrón viejo, sin Flexible Content): pasar un array de filas, cada fila como array asociativo con el **nombre completo del subcampo** (`hero-slider__image`, etc.) como key.
- Si el componente es un **`group`** (patrón viejo): pasar un array asociativo con el nombre de cada subcampo propio como key — **sin** el prefijo del grupo repetido (ej. dentro de `update_field('purpose-banner', [...])`, la key es `purpose-banner__title`, no `purpose-banner_purpose-banner__title` aunque así se vea después en el postmeta crudo). Si el group tiene un repeater anidado, ese repeater es simplemente otra key del array cuyo valor es un array de filas, cada fila con los nombres de los subcampos de la card.
- **Campos de imagen:** el valor a asignar es el **ID numérico del attachment**, nunca el array completo — aunque el `return_format` del campo sea `array`, ACF/SCF arma ese array a partir del ID al leer con `get_field()`.
- **Campos de link:** array `['url' => ..., 'title' => ..., 'target' => '']`.
- Escribir el script en un archivo **dentro del árbol del proyecto** (ej. junto a `field-groups-json/`) para que un contenedor tipo DDEV lo vea en su propio mount — un archivo en `/tmp` del host no es visible dentro del contenedor. Nombrarlo con un prefijo claro (`_seed-...php`) y **borrarlo apenas termine de correr** (es un script de un solo uso, no debe quedar commiteado).
- **Si se está migrando contenido real ya existente** de un patrón viejo (group/repeater) a Flexible Content: leer TODO el contenido viejo con `get_field()` **antes** de tocar el field group (guardarlo en un JSON de respaldo junto con un `wp db export`, no confiar solo en la memoria de la conversación), recién después borrar/reimportar el field group nuevo, y por último reescribir ese contenido guardado con el patrón de filas de arriba. Los campos de imagen que `get_field()` devuelve como array (`return_format: array`) hay que reducirlos al `ID` antes de pasarlos a `update_field()` (recorrer el array recursivamente buscando `isset($valor['ID'], $valor['url'])` es más robusto que mapear campo por campo a mano).

Ejecutar con `ddev wp eval-file <ruta-relativa-a-la-raiz-de-WP>`.

**Si la shell del sistema es `fish` (no `bash`), nunca uses `wp eval "<script con $variables PHP>"` en línea.** Fish intenta expandir `$rows`, `$row`, etc. como si fueran variables de fish ANTES de que el comando llegue al contenedor, y tira `bash: line 1: rows: unbound variable` (u otros errores crípticos) aunque el PHP esté bien escrito — confirmado en la práctica, CAFEXPORT 2026-07-23. La solución no es escapar cada `$` a mano: escribir el script completo a un archivo (con la herramienta de escritura de archivos, no con `echo`/heredoc de shell) y correrlo con `wp eval-file <archivo>` — es exactamente el patrón que ya recomienda este mismo paso, aplicar SIEMPRE que la shell sea fish, incluso para scripts de una sola línea de "verificación rápida".

Confirmado también en la práctica: `wp acf json import <ruta-relativa-a-la-raiz-de-WP-dentro-del-contenedor>` (no relativa a la carpeta del theme) funciona para reimportar `field-groups-json/*.json` después de editarlo a mano — actualiza el field group existente por `key` sin duplicar, sin necesidad de pasar por el admin.

## Paso 4 — Si aparece un campo faltante en el esquema durante el llenado

Al armar el contenido de ejemplo es común notar que el diseño original tenía un elemento (ej. una imagen por tarjeta) que no quedó en el JSON generado. Corregirlo ahí mismo:

1. Agregar el campo faltante al `.json` en `field-groups-json/` con una key nueva generada igual que el resto (`field_` + hex).
2. Reimportar con `wp acf json import <ruta-al-json>` — el import **actualiza por `key`** si el grupo ya existe (no duplica), tanto documentado (`wp acf json import --help`) como confirmado en la práctica.
3. Recién ahí completar el valor de ese campo en el script de siembra.

## Paso 5 — Verificación visual

Un llenado por WP-CLI nunca prueba por sí solo que el admin lo va a mostrar bien — hay que abrir la pantalla real:

1. Confirmar con `get_field()` vía `wp eval` que los valores quedaron accesibles como se esperaba (sanity check rápido antes de abrir el navegador).
2. Abrir con Chrome DevTools MCP la URL de edición (`/wp-admin/post.php?post=<id>&action=edit`) y tomar una captura.
3. **Si redirige a login, no hay sesión activa.** No inventar ni intentar bypasear el login sin que el usuario lo sepa. Preguntar cómo prefiere seguir — las opciones típicas son: que el usuario haga login manualmente en ese mismo navegador y avise, o (solo en entornos locales de desarrollo donde WP-CLI ya tiene control total de la base de datos, nunca en producción) generar una sesión vía WP-CLI, o directamente posponer la verificación visual para cuando ya existan componentes PHP reales renderizando el contenido en el front-end.
4. Una vez logueado, la captura de la pantalla de edición alcanza como chequeo estructural (¿aparecen las filas de cada repeater?, ¿las imágenes muestran thumbnail?, ¿los textos están donde corresponden?) — no hace falta leer cada pixel de texto en la captura si la estructura general coincide con lo esperado.

## Notas

- Esta capacidad asume que ya existe un post/página real de destino (`post_id` conocido) y que el grupo de campos ya está aplicado a esa pantalla — no crea la página ni asigna la location rule.
- El contenido cargado es de **ejemplo/placeholder** (copy tomado del diseño original si lo hay, imágenes reales ya subidas) — dejar explícito qué quedó como placeholder (ej. CTAs con `url: "#"`, campos sin asset disponible que se dejaron vacíos) en vez de inventar datos duros que parezcan finales.
