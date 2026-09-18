# Editar un field group SCF/ACF que ya existe (no crearlo de cero)

Esta referencia es para cuando el pedido es **modificar** un campo/field group que el proyecto ya tiene importado (cambiar tipo de campo, choices, labels, agregar una opción) — no para el flujo de creación inicial (Paso 5-6 del flujo completo, o `json-field-group-generation.md`). Gotchas reales, encontrados editando el campo compartido `bg-color` de CAFEXPORT (2026-07-24).

## 1. Editar el `.json` en `field-groups-json/` NO cambia nada por sí solo — verificar el mecanismo de sync antes de asumir

Esta skill ya usa `field-groups-json/` como carpeta de **exportación para importación manual** (ver `SKILL.md` Paso 5.3), no como `acf_json` de auto-carga — pero es fácil, en medio de una tarea de edición puntual, olvidar esa distinción y asumir que el archivo "ya está conectado" porque se usó antes para crear el campo.

**Antes de editar un `.json` existente esperando que el cambio se refleje solo:**
1. Buscar en `functions.php` (o donde corresponda) un filtro `acf/settings/load_json` que apunte a esa carpeta. Si no existe, el archivo es un snapshot de exportación — editar el JSON **no tiene ningún efecto** en el sitio real hasta que se re-importe.
2. Si existe WP-CLI en el entorno: editar el `.json` y correr `wp acf json import <archivo>` (actualiza por `key`, no duplica) — mismo patrón ya documentado en `seed-example-content.md` paso 5. **En DDEV, `ddev wp acf json import <ruta>` exige la ruta ABSOLUTA dentro del contenedor** (`/var/www/html/wp-content/themes/.../field-groups-json/archivo.json`, obtenible con `ddev wp eval 'echo ABSPATH;'`) — una ruta relativa al `cwd` del host da `Error: File not found` aunque el archivo exista de verdad (el comando corre dentro del contenedor, no en el host). Además, `ddev wp acf json status`/`sync` (los subcomandos "de mantenimiento") NO sirven para verificar `field-groups-json/`: apuntan al path por defecto de ACF Local JSON (`acf-json/` en la raíz del tema), que en un proyecto sin `load_json` configurado (punto 1) está vacío — esos comandos van a reportar "todo sincronizado" sin haber leído el archivo real. La única confirmación válida es re-consultar el campo después del import (`ddev wp eval 'echo json_encode(acf_get_field_group("group_key")["location"]);'` o similar).
3. Si NO hay WP-CLI accesible (o no se puede confirmar), **editar el campo directo en el admin** (`/wp-admin/edit.php?post_type=acf-field-group`, con Chrome DevTools MCP si hay sesión logueada) — ver sección 3 más abajo para las trampas de UI al hacerlo así. El `.json` del repo queda desactualizado en ese caso; avisar al usuario que conviene re-exportarlo a mano después (Tools → Export) si quiere mantenerlo como referencia versionada.

**Nunca decirle al usuario "esto se sincroniza solo" sin haber confirmado el punto 1** — fue exactamente el error real: se asumió sync automático tipo ACF Local JSON estándar, y el campo en el sitio siguió mostrando la versión vieja varias vueltas hasta notar que no había ningún `load_json` configurado.

## 2. El textarea de "Opciones"/"Choices" (`select`, `radio`, `checkbox`, `button_group`) exige el separador exacto `" : "`

Confirmado leyendo `acf_decode_choices()` en el código fuente del plugin (`wp-content/plugins/secure-custom-fields/includes/api/api-helpers.php`): cada línea se busca con `acf_str_exists(' : ', $line)` — un espacio, dos puntos, un espacio, **literal**. Si no aparece esa substring exacta, la línea entera (sin partir) se usa como `key` Y como `value` a la vez.

Esto rompe silenciosamente el caso de querer una opción con **valor vacío** (ej. "Sin elegir nada" / "usa el valor por defecto"): escribir `: Mi etiqueta` (sin nada antes de los dos puntos) NO tiene el espacio requerido ANTES del `:`, así que el parser no lo reconoce como separador, y la opción sale con label Y value = `": Mi etiqueta"` literal (dos puntos incluidos, visible en el admin).

**Fix real (probado, robusto): no usar valor vacío para "ninguno" — usar el valor `0`.**
```
0 : Sin color (usa el fondo por defecto)
primary-dk : Verde muy oscuro
...
```
`0 : Mi etiqueta` sí tiene el separador exacto `" : "` (hay un carácter antes del `:`), así que parsea bien: `value="0"`, `label="Sin color..."`. Y en PHP, `"0"` es uno de los pocos strings **falsy** — cualquier código que ya use el patrón `get_sub_field('campo') ?: 'default'` (común en esta skill, ver `code-patterns.md` #1.6) sigue funcionando sin tocar ni un archivo PHP, porque `"0" ?: 'default'` cae en `'default'` igual que si el campo estuviera vacío. Preferir siempre este truco sobre agregar lógica PHP nueva para tratar un "ninguno" explícito.

Si de verdad hace falta un valor vacío real (no `"0"`) por algún motivo, un espacio ANTES de los dos puntos (` : Mi etiqueta`, con espacio inicial) sí cumple el patrón — pero es frágil: varios editores/guardados intermedios (textarea del navegador, saneamiento de WordPress al guardar) pueden trimear ese espacio líder sin avisar. **Preferir el truco del `"0"` por sobre depender de un espacio inicial que sobreviva el roundtrip de guardado.**

## 3. Verificar un cambio de field group compartido (clone) directo en el admin, sin WP-CLI

Cuando hay que editar a mano vía Chrome DevTools MCP (sin WP-CLI) un campo que después se clona en muchos layouts de Flexible Content:

1. Ir a `/wp-admin/edit.php?post_type=acf-field-group`, abrir el field group FUENTE (donde vive el campo original, no una de las páginas que lo clonan) — clonar en SCF/ACF resuelve el campo por `key` en tiempo real desde la fuente, así que un solo edit ahí se propaga a todos los layouts que lo clonan, sin tener que tocarlos uno por uno.
2. Para el selector "Tipo de campo" (un Select2 estilizado, no un `<select>` nativo): un `.click()` simple de JS **no dispara los handlers internos de Select2**. Hace falta disparar `mouseup` sobre el `<li class="select2-results__option">` correcto (buscarlo por texto exacto, ya que suele estar en el idioma del admin — ej. "Grupo de botones", no "Button Group" en un admin en español).
3. Los ajustes de un campo (`Allow Null`, `Layout` horizontal/vertical, etc.) suelen vivir en pestañas separadas (`Validation`, `Presentation`) dentro del mismo panel del campo — no asumir que todo está en la pestaña `General` visible por defecto.
4. **Para verificar que el cambio realmente se propagó a un layout específico** (no solo confiar en que "clone debería funcionar"): abrir el field group grande (ej. "Página Flexible"), expandir el campo `flexible_content`, expandir el layout puntual (cada uno tiene su propio toggle/chevron — clickear el correcto, no el de "expandir todo" que a veces no despliega los sub-campos), y confirmar que la fila del campo clonado (tipo `Clone`) muestra el campo fuente actualizado entre paréntesis (ej. "Color de fondo (button_group)") — es la prueba más confiable, más que revisar una página de contenido real que puede estar en una pestaña vieja sin refrescar (ver punto 4).
5. **Pestaña vieja = falso negativo muy común.** Si el usuario reporta "no veo el cambio" después de confirmar que el campo fuente sí se actualizó, sospechar primero de una pestaña del editor de contenido abierta desde ANTES del cambio (el HTML del formulario ya se generó con la versión vieja) — pedir refresco forzado (Ctrl/Cmd+Shift+R) antes de asumir que el fix falló.

## 4. Cuadrito de color en un selector de admin (`button_group` + CSS puro, sin JS)

Si se pide un preview visual de color junto a cada opción de un campo de fondo/color (sin cambiar el valor guardado, que debe seguir siendo el slug semántico del rol, nunca el hex):

1. Cambiar el tipo de campo de `select` a `button_group` (leer primero `includes/fields/class-acf-field-button-group.php` del plugin real para confirmar el markup exacto que genera esa versión de SCF/ACF, no asumirlo de memoria — ver el HTML real: `<div class="acf-button-group"><label><input type="radio" value="...">Label</label>...</div>`, sin `data-value` en el `<label>`).
2. Un CSS admin-only (enqueued solo en `admin_enqueue_scripts`, nunca en el bundle del frontend) puede pintar un círculo con `label:has(input[value="ROL"])::before { background-color: #HEX }` — cero JS, cero cambio al valor guardado. Requiere navegador con soporte a `:has()` (Chrome/Edge/Firefox modernos; asumible en un entorno de wp-admin normal).
3. Sincronizar el listado de hex de ese CSS con `plugins/variables.js` a mano — no hay forma de generarlo dinámicamente desde un archivo `.css` puro; dejar un comentario en el CSS recordando actualizarlo si cambia la paleta.
4. Para una opción de "sin color"/"ninguno" (valor `"0"`, ver sección 2), un círculo vacío con línea diagonal (`background: linear-gradient(to top right, transparent ..., rgba(0,0,0,.35) ..., transparent ...)`) comunica visualmente "no hay color" sin necesitar un hex real.

## 5. Consumir un campo `bg-color` clonado en ~20 componentes: distinguir "el editor lo eligió" de "es el fallback nativo del PHP"

Cuando este mismo campo `bg-color` se usa en el frontend para armar la clase `bg-{rol}` de cada componente, el patrón típico es `$bg_color = get_sub_field('bg-color') ?: 'surface';` — pero eso hace indistinguible en el HTML final un rol elegido a propósito por el editor de uno que solo aparece porque el componente no tiene fondo asignado. Si algún mecanismo de CSS reacciona a la sola presencia de `.bg-{rol}` (ver `tw-design-system/references/philosophy.md §18.1`), termina disparándose también en el estado nativo/por defecto del componente, pisando su diseño propio.

La solución (implementada como `resolve_bg_color_class()` en `functions/utils.php` de CAFEXPORT) es agregar una clase indicadora adicional (`bg-color-selected`) SOLO cuando el valor crudo del campo (antes del `?:`) es verdadero — nunca cuando viene del fallback PHP. El detalle completo del mecanismo (código del helper, cómo lo consume el plugin de Tailwind, y qué hacer con los componentes cuyo fallback nativo ya es un fondo oscuro) está documentado en `tw-design-system/references/philosophy.md §18.7` — leerlo ahí antes de repetir el patrón `?: 'rol-por-defecto'` a mano en un componente nuevo que use este campo clonado. **Si el componente además incrusta markup de un plugin de terceros (Contact Form 7, WooCommerce, etc.) con su propio CSS aparte, ver `philosophy.md §18.8`** — ese CSS no pasa por `get_sub_field()` para nada y es un punto ciego real para este mismo mecanismo.

## 6. Un campo tipo `clone` (`"type": "clone"`, `"display": "seamless"`) top-level en un field group SIN Flexible Content puede no resolver — usar el campo directo en su lugar

Caso real CAFEXPORT, 2026-08-13: clonar el campo fuente `bg-color` (`field_36019dfbce18a` en su propio grupo "fuente para clonar") dentro de un field group normal (ubicaciones `post_type`/`taxonomy`/`options_page`, sin repeater ni Flexible Content de por medio) hizo que `get_field_object($name, $post_id)` devolviera `false` — el campo no se encontraba, aunque el JSON se importó bien y `acf_get_fields($group_key)` sí lo listaba con el `name` correcto. Probado con nombre único (sin colisión con el campo fuente) y el problema persistió, así que NO es un problema de nombre duplicado — es el mecanismo de clone `seamless` en sí, fuera de un contexto de sub_field (`get_sub_field()` dentro de `have_rows()`), el que no resuelve de forma confiable en esta versión de SCF.

**Nota rara detectada de paso, no confirmada como causa:** en un momento `get_field_object()` seguía devolviendo `false` incluso DESPUÉS de que `update_field()`/`get_field()` ya funcionaran bien para ese mismo campo — en un proceso `wp eval` nuevo y limpio, los tres (`get_field_object`, `get_field`, `update_field`) volvieron a coincidir (todos "encontrado"/con el valor correcto). Puede haber sido un cache transitorio entre comandos `wp eval` encadenados en el mismo bloque de shell, no algo confirmado a fondo — si vuelve a pasar, no asumir que el campo está roto solo por un `get_field_object()` negativo aislado; reconfirmar con `get_field()`/`update_field()` en un proceso separado antes de descartar el enfoque.

**Fix que sí funcionó, confiable:** en vez de `"type": "clone"` con `"clone": ["field_36019dfbce18a"]`, definir el campo DIRECTO con el mismo `type`/`choices`/`return_format` que el campo fuente (duplicar la definición, no clonarla por referencia). Más líneas de JSON, pero resuelve siempre — y si la fuente cambia sus choices, hay que actualizar cada copia a mano (documentar ese costo al usuario si elige este camino). Reservar `clone` para los casos ya probados que SÍ andan bien en este proyecto: subcampos dentro de un `repeater`/`flexible_content` (ver `field-groups-json/flexible-page.json`, decenas de usos ahí, todos dentro de `sub_fields`).

## 7. Dos options pages sin `post_id` propio comparten el MISMO storage — colisión silenciosa de campos con el mismo nombre

`acf_add_options_page()`/`acf_add_options_sub_page()` sin el parámetro `post_id` caen las dos en el post_id genérico `'options'` — significa que `get_field('mi_campo', 'option')` en la options page A y `get_field('mi_campo', 'option')` en la options page B (dos páginas de opciones DISTINTAS, cada una con su propio `menu_slug`) leen y escriben literalmente el MISMO valor si el nombre del campo coincide, aunque estén en field groups distintos con `location` distinta (la `location` solo decide qué campos se MUESTRAN en cada pantalla de admin, no dónde se GUARDAN). Rompe en silencio apenas hay una segunda options page en el proyecto que reutiliza un field group compartido (ej. un mismo componente "CTA banner" con opciones page para dos post types distintos).

**Fix:** apenas se registre una SEGUNDA options page en el proyecto, darle un `post_id` propio y explícito:
```php
acf_add_options_sub_page([
    'menu_slug' => 'mi-segunda-options-page',
    'parent_slug' => 'edit.php?post_type=mi-cpt',
    'post_id' => 'mi-segunda-options-page', // string único, cualquier valor sirve
]);
```
Y leer/escribir sus campos con ESE `post_id` como contexto (`get_field('campo', 'mi-segunda-options-page')`), nunca con el string genérico `'option'`. La PRIMERA options page del proyecto puede quedarse sin `post_id` (cae en `'options'` por default) sin problema — el riesgo aparece recién con la segunda en adelante, si comparte algún nombre de campo con la primera (típico si ambas usan el mismo field group reusable, como el caso de un CTA/prefooter compartido entre post types).
