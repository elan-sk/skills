---
name: wp-basic-component-builder
description: Maqueta y publica secciones con el componente "Básico" de este tema WordPress — un layout de Flexible Content (`basic`/`layout_basic`) que es un LIENZO LIBRE de HTML + Tailwind sin campos SCF fijos, editado desde un editor visual propio en wp-admin (js/admin/basic/, components/basic.php). A diferencia de wp-scf-component-builder (que crea componentes con campos tipados), acá no hay que definir ningún campo: se genera HTML libre con las clases del core Tailwind del proyecto y se compila su CSS escopado. Úsalo con "hazme esto con el componente Básico", "maquetá esto en el lienzo libre", "agregá esto como sección libre/HTML", "insertá este diseño sin crear campos SCF", a partir de una imagen de referencia. Dos modos: (1) dentro de este repo (WP+SCF real accesible) — compila el CSS con Node y lo inserta en la página vía WP-CLI, sin abrir el navegador; (2) en un entorno externo (sin este WP/SCF accesible) — genera solo el fragmento HTML+Tailwind para pegar a mano en el campo "Contenido" del editor Básico de destino, con imágenes placeholder. Requiere Claude Code con filesystem local; en modo local además necesita Node (ya instalado en el tema) y WP-CLI (`ddev wp` en este proyecto).
---

# WP Basic Component Builder

Skill para maquetar secciones con total libertad usando el componente **"Básico"** de `hello-elementor-depura` — un layout de Flexible Content llamado `basic` (`layout_basic`) que NO tiene campos con forma fija: son 4 subcampos genéricos (`basic__title` solo para el admin, `basic__content` = HTML libre, `basic__section` = clases del `<section>` que envuelve todo, `basic__compiled` = `{version, source, css}` con el CSS Tailwind ya compilado y escopado a esa instancia). El editor real vive en `js/admin/basic/editor.js` (reemplaza a TinyMCE, panel de estilos visual, inserción de medios/YouTube, plantillas reutilizables).

**Skills complementarios:**
- `tw-design-system` — cargarlo siempre en modo local: el HTML libre igual tiene que usar los tokens/utilidades propias del proyecto (`bg-primary`, `text-h2`, `flex-grid-*`, `btn-primary`…), nunca colores literales ni clases base de Tailwind cuando exista equivalente semántico.
- `frontend-design` — para interpretar la imagen de referencia cuando da margen de criterio.
- `wp-scf-component-builder` — **no se usa para crear campos** (acá no hacen falta), pero su `references/seed-example-content.md` documenta el patrón WP-CLI + `update_field()` que este skill reutiliza para escribir la fila en el Flexible Content, incluyendo el gotcha de shell `fish` (escribir el script PHP a archivo, nunca `wp eval` inline con `$variables`).

---

## Decidir el modo antes de maquetar nada

1. Si el directorio de trabajo actual (o el que indique el usuario) contiene `js/admin/basic/compiler.js` **y** `components/basic.php` **y** hay WP-CLI accesible (`which wp`, o `which ddev`/`which lando` + contenedor corriendo del proyecto — ver detección en `wp-scf-component-builder/SKILL.md`) → **Modo A: local**.
2. Si no hay ese filesystem/WP-CLI accesibles (el usuario pide código para otro sitio, o pega solo una referencia sin repo abierto) → **Modo B: externo**.
3. Si es ambiguo (hay filesystem del tema pero el usuario dice explícitamente "es para otro sitio", o no está claro si hay WP-CLI) → **preguntar**, no asumir.

### Estado conocido de este proyecto (CAFEXPORT)

- WP-CLI: `ddev wp` (el binario `wp` no está en el PATH del host, ver nota de `wp-scf-component-builder`).
- Node + `tailwindcss`/`postcss` ya están instalados en `wp-content/themes/hello-elementor-depura/node_modules` — el script de este skill corre con el `node` del host, sin DDEV.
- Campo Flexible Content: `page-builder` (key `field_06c38531978a8`), layout `basic` con subcampos `basic__title`, `basic__content`, `basic__section`, `basic__compiled`.
- Location rules de ese field group: `page_template == templates/flexible-page.php` o `post_type == historia` — el componente Básico solo se puede insertar en páginas que usan esa plantilla (o el CPT `historia`). Si la página destino no cumple ninguna, avisar antes de seguir (no forzar el guardado).

---

## Modo A — Dentro del repo (WP + SCF reales)

### Paso 1 — Inputs mínimos

1. **Imagen de referencia** (o descripción detallada) de lo que hay que maquetar.
2. **Página/post destino.** Si no lo da el usuario, preguntar.
3. **Dónde insertarlo** dentro del `page-builder` de esa página (al final, antes/después de un layout concreto, en una posición numérica). Si no lo especifica, **preguntar** — no asumir una posición.

### Paso 2 — Buscar plantillas/snippets ya guardados antes de generar desde cero

El propio componente Básico tiene su sistema de reuso (ver `templates/basic-snippets/*.json` + opción `depura_basic_snippets` en la BD). Antes de maquetar desde cero:

1. Listar snippets de archivo: `ls templates/basic-snippets/*.json` y leer sus `name`/`html`.
2. Listar snippets de BD: `ddev wp option get depura_basic_snippets --format=json` (puede no existir todavía → lista vacía, no es error).
3. Si alguno se parece por nombre o estructura a lo que pide la imagen de referencia, **proponerlo como punto de partida** (adaptar/extender ese HTML) en vez de generar todo desde cero. Si ninguno encaja, generar libre.

### Paso 3 — Maquetar el HTML libre

- Total libertad de estructura (no hay campos que respetar) — cualquier etiqueta HTML válida, con las clases Tailwind del core propio del proyecto (cargar `tw-design-system` antes de escribir clases).
- Reglas del core que siguen aplicando igual que en cualquier componente de este proyecto: `flex-grid`/`flex-grid-*`/`flex-grid-gap-*` en vez de `grid`, nunca colores literales (siempre los roles semánticos `bg-primary`/`text-on-primary`/etc.), botones con `btn-primary`/`btn-secondary`/`btn-tertiary` en vez de reconstruirlos a mano.
- El HTML que se genera acá es **solo lo que va DENTRO del `<section>`** (eso es `basic__content`). Las clases del `<section>` mismo (fondo, padding general del bloque) van aparte, en `basic__section` — no las repitas dentro del HTML de contenido.
- Revisar `design.md` del proyecto si existe, antes de reusar cualquier átomo/clase existente (mismo criterio que `wp-scf-component-builder`).

### Paso 4 — Imágenes: siempre placeholder

Decisión explícita del usuario para este skill (diverge del default de `wp-scf-component-builder`, que prioriza buscar medios reales): usar siempre imágenes placeholder por rendimiento, nunca buscar/matchear en la Media Library. Usar `https://placehold.co/{ancho}x{alto}` con un texto corto describiendo el rol (ej. `https://placehold.co/800x600?text=Hero+Cafexport`). Dejar explícito en el mensaje final al usuario que son placeholders — se reemplazan después seleccionando la imagen y usando el botón "▣ Cambiar imagen" del editor Básico (o el botón "▣ Insertar medios" si es una imagen nueva suelta).

### Paso 5 — Compilar el CSS (sin abrir el navegador)

Usar `scripts/compile-basic.mjs` de este skill — reimplementa exactamente `compileClasses()`/`scopeCSS()` de `js/admin/basic/compiler.js` con el mismo `tailwindcss` y el mismo `theme.json` del tema, así que el resultado es idéntico byte a byte al que produciría el editor visual:

```bash
node ~/.claude/skills/wp-basic-component-builder/scripts/compile-basic.mjs \
  --theme wp-content/themes/hello-elementor-depura \
  --content /ruta/al/contenido.html \
  --section "clases-del-section" \
  > /ruta/compiled.json
```

- `--content` apunta a un archivo con el HTML del Paso 3 (usar la herramienta de escritura de archivos para crearlo, nunca `echo`/heredoc si la shell es `fish`).
- `--section` son las clases del Paso 3 para el `<section>` (puede ir vacío).
- La salida (`compiled.json`) es exactamente el JSON que va en `basic__compiled`.
- Si tira `El CSS supera el límite de 600 KB`, dividir el contenido en más de un componente Básico (mismo límite que aplica en `basic-editor.php`).

### Paso 6 — Insertar la fila en el Flexible Content vía WP-CLI

Seguir el patrón de `wp-scf-component-builder/references/seed-example-content.md` (WP-CLI + `update_field()`, script a archivo si la shell es `fish`), con dos diferencias clave respecto a "sembrar contenido de ejemplo":

1. **Leer primero las filas existentes** de `page-builder` en esa página (`get_field('page-builder', $post_id, false)`) — nunca sobreescribir el array completo con solo la fila nueva, se perderían los layouts que ya estaban. Insertar la fila nueva en el array PHP en la posición pedida en el Paso 1 (`array_splice`) o al final si no se especificó posición.
2. La fila nueva tiene esta forma exacta (nombres de subcampo, no keys):
   ```php
   [
     'acf_fc_layout'   => 'basic',
     'basic__title'    => 'Nombre corto para identificarlo en el admin',
     'basic__content'  => $contentHtml,   // el mismo string que --content
     'basic__section'  => $sectionClasses, // el mismo string que --section
     'basic__compiled' => wp_slash($compiledJson), // ver gotcha de abajo — SIN wp_slash() se guarda vacío
   ]
   ```
3. **Gotcha confirmado en la práctica (CAFEXPORT, 2026-09-18) — `wp_slash()` obligatorio en `basic__compiled`:** el filtro `acf/update_value/key=field_basic_compiled` de `functions/settings/basic-editor.php` asume que `$value` llega con las barras de `wp_magic_quotes()` (como sale de `$_POST` en un guardado real desde el navegador) y hace `wp_unslash($value)` antes de `json_decode()`. Si se llama `update_field()` directo pasando el JSON del Paso 5 tal cual (limpio, sin slashear), ese `wp_unslash()` interno le come los backslashes reales del JSON (`\n`, `\"`, `\uXXXX` de acentos) — `json_decode()` falla, `depura_basic_payload()` devuelve `false`, y el filtro guarda `''`: el campo queda vacío en silencio (`update_field()` igual puede devolver `true`, no tira error). El fix es **pre-aplicar `wp_slash()`** al string del JSON antes de meterlo en la fila — así el `wp_unslash()` del filtro lo deja exactamente como estaba. **Verificar siempre** después de guardar con `json_decode($fila['basic__compiled'])` + chequear `json_last_error() === JSON_ERROR_NONE`, no asumir que `update_field()` devolviendo `true` significa que el campo compilado quedó bien.
4. Escribir el script PHP completo (lectura + splice + `update_field()`) a un archivo dentro del árbol del proyecto (para que DDEV lo vea), correrlo con `ddev wp eval-file <archivo>`, y borrarlo apenas termine — es de un solo uso, no se commitea. Para pasarle el HTML/JSON grandes sin inflar el propio script ni el contexto de la conversación, copiar `compiled.json` y el archivo de contenido a una carpeta temporal dentro del árbol del tema (ej. `_tmp-basic-demo/`) y leerlos con `file_get_contents()` desde el script — no embeber el HTML/CSS completos como string literal ni en base64 dentro del PHP (por tamaño), y no leerlos de vuelta con la herramienta de lectura de archivos salvo que haga falta depurar algo puntual (el CSS compilado de un componente con varias clases fácilmente pasa las decenas de miles de caracteres). Borrar esa carpeta temporal junto con el script al terminar.

### Paso 7 — Verificar

1. Sanity check rápido: `ddev wp eval 'var_dump(get_field("page-builder", <post_id>));'` — confirmar que la fila nueva aparece, que `basic__compiled` decodifica como JSON válido (`json_last_error() === JSON_ERROR_NONE`) y que su `source` normalizado coincide con `basic__content` normalizado (ver gotcha de `wp_slash()` en el Paso 6).
2. Chrome DevTools **solo si hay una duda real** (mismo criterio que el resto de los skills de este proyecto: no abrir el navegador por protocolo). Si se abre, comparar contra la imagen de referencia — mismo chequeo de fidelidad al detalle que `wp-scf-component-builder` (alineaciones, esquinas, espaciados, nada copiado de memoria que la referencia no pida).
3. Reportar al usuario: página y post_id donde quedó insertado, posición dentro del `page-builder`, y que las imágenes son placeholder a reemplazar desde el editor.

---

## Modo B — Entorno externo (sin este WP/SCF accesible)

El objetivo acá no es tocar SCF ni compilar nada — es entregar el **fragmento HTML+Tailwind listo para pegar** en el campo "Contenido" del editor Básico de destino (al pegar, el propio editor lo compila solo — ver `applyTextarea()`/`schedule()` en `editor.js`).

1. Preguntar si el sitio de destino comparte el **mismo core de tokens** que este proyecto (roles `bg-primary`, escalas `text-h1`..`text-h6`, `flex-grid-*`, etc.). Si sí, maquetar igual que en el Modo A (Paso 3). Si no, o no se sabe, **usar utilidades estándar de Tailwind** (`bg-blue-600`, `text-3xl`, `rounded-lg`, `flex`, `gap-4`…) en vez de los tokens propios de este proyecto, que no existirían en el `theme.css` de otro sitio.
2. Imágenes: siempre placeholder (`https://placehold.co/{ancho}x{alto}`), igual que el Modo A — el usuario las reemplaza después desde la herramienta de personalización del destino.
3. Entregar dos bloques separados y claramente etiquetados:
   - El HTML para pegar en **Contenido**.
   - Las clases sugeridas para el **<section>** (contenedor), para que el usuario las pegue aparte si su editor de destino tiene ese mismo campo separado — si no lo tiene, indicar que puede fusionarlas como clases del wrapper raíz del HTML de Contenido.
4. No genera ni intenta compilar CSS — eso lo hace el editor de destino solo al pegar.

---

## Cuándo preguntar vs. cuándo asumir

**Preguntar siempre:**
- Modo A o B, si es ambiguo (Paso 0).
- Página/post destino y posición dentro del `page-builder`, si no los da el usuario.
- Si el sitio destino del Modo B comparte o no el core de tokens propio.

**Asumir con la convención por defecto (avisando que se asumió):**
- Imágenes siempre placeholder en ambos modos (decisión explícita del usuario para este skill).
- Buscar primero en `templates/basic-snippets/` + snippets de BD antes de generar desde cero (Modo A, Paso 2).
- `basic__title` se rellena con un nombre corto descriptivo aunque el usuario no lo pida — es solo para identificar la fila en el admin, no se muestra en la página.
