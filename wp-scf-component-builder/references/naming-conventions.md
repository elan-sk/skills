# Convenciones de naming (SCF + BEM adaptado)

Basado en los componentes reales del usuario (`slider-main`, `slider-category`, `featured-product`, `grid-media`, `hero-category`, `related-post`, `post-navegation`).

## Regla general

SCF/ACF permite guiones en los field names, pero el usuario separa así:

- **Guion (`-`)** dentro de un slug compuesto por varias palabras: `slider-main`, `featured-product`, `hero-category`.
- **Doble guion bajo (`__`)** para separar el **componente** de su **campo** (equivalente al `__element` de BEM): `featured-product__title`, `featured-product__model`, `featured-product__image`, `featured-product__description`, `featured-product__footer`, `featured-product__cta`.

Patrón: `{slug-componente}__{nombre-campo}`

## Grupo de campos (field group)

Hay tres convenciones distintas según el alcance del pedido — no mezclarlas:

**A) Componente suelto** (Paso 5 del flujo completo, un componente a la vez, sin plantilla de página compartida): el **nombre del grupo de campos en SCF = el slug del componente**, sin sufijos. Ejemplo: el grupo se llama `featured-product`, y adentro tiene el campo repetidor o los subcampos con el patrón de abajo.

**Excepción — `location` ya ocupada por otro grupo:** esta regla (grupo = 1 componente) aplica cuando el componente es el primero en esa `location` (options page, archive/plantilla). Si esa `location` **ya tiene un field group** (ej. una options page tipo `historia-archive-settings` con su grupo de hero), un componente nuevo que se inserta en esa misma página/archivo **no crea un grupo aparte**: sus campos se agregan al grupo ya existente de esa `location`, con el prefijo BEM del componente nuevo en cada `name` (`{slug-componente}__{campo}`, igual que siempre) para no chocar con los campos del otro componente que ya vive ahí. Un field group por `location` compartida, nunca uno por componente cuando la `location` ya está en uso — ver Paso 5.1 de `SKILL.md`.

**B) Página con varios componentes, reutilizable o reordenable — Flexible Content (DEFAULT desde 2026-07-15):** cuando el pedido es armar una página con varias secciones donde **cualquiera de esas secciones puede reutilizarse en otra página, o el orden puede necesitar cambiar por página** (lo normal salvo que el usuario diga explícitamente lo contrario), usar un **field group compartido entre todas las plantillas de este tipo**, con **un único campo de tipo `flexible_content`** (ej. `page-builder`), donde **cada componente es un "layout"** dentro de ese campo (`layouts[].name` = slug del componente, `layouts[].sub_fields` = los mismos subcampos que llevaría un `group`, con el mismo patrón BEM de abajo). El editor agrega/quita/reordena esos layouts libremente desde el admin de WP (drag-and-drop nativo), sin tocar código ni depender de `menu_order`.

- **Plantilla compartida:** una sola plantilla PHP genérica (ej. `templates/flexible-page.php`, `Template Name: Página Flexible`) sirve para todas las páginas de este tipo — no crear una plantilla nueva por página. El PHP de la plantilla es siempre el mismo loop, ver `code-patterns.md` (patrón "Dispatcher de Flexible Content").
- **Regla dura — nombre del campo `flexible_content` único en todo el proyecto:** nunca reutilizar el mismo `name` (ej. `page-builder`) en dos field groups distintos, ni aunque cada uno tenga su propia location rule apuntando a una plantilla distinta. SCF resuelve `get_field()`/`update_field()` por nombre, y si dos field groups definen un campo con el mismo nombre, la resolución puede pegarse al field group equivocado (guarda una referencia meta cacheada en el post) y el contenido se guarda vacío sin ningún error visible. Si de verdad hacen falta field groups separados por plantilla (location rules distintas), cada uno necesita un nombre de campo distinto (`home-builder`, `about-builder`, etc.) — pero el default, si no hay una razón concreta para separarlos, es UN solo field group + UNA sola plantilla compartida para todas las páginas de este patrón.
- Si el componente ya existe como `group` de un patrón viejo (convención C) y se está migrando a este patrón, ver "Migrar de `group` a `flexible_content`" más abajo.

**C) JSON de página completa con grupos fijos (patrón viejo, solo si el usuario pide explícitamente NO usar Flexible Content):** el **field group = la página** (ej. `home`), con cada componente como **un único campo de tipo `group`** dentro de ese field group, `name` = slug del componente, sub_fields propios. Location rule apunta a la plantilla completa (ej. `page_template == templates/home.php`). Esta convención ya no es el default — solo usarla si el usuario confirma que esa página nunca va a necesitar reordenar ni reutilizar secciones entre páginas (caso raro; si hay duda, preguntar y proponer B).

Si en algún punto se necesita generar el componente PHP a partir de un grupo tipo B o C, `get_field('nombre-componente')`/`get_sub_field('nombre-componente__campo')` siguen funcionando con el mismo patrón BEM — no cambia el naming de subcampos entre convenciones, solo cambia el wrapper (ver `code-patterns.md`).

### Migrar de `group` (C) a `flexible_content` (B)

1. El `group` se convierte en un `layout` dentro del campo `flexible_content` compartido — mismo `name` de componente, mismos `sub_fields` (se pueden copiar tal cual).
2. Si el componente era un `repeater` de nivel superior (ej. `hero-slider` con filas directas), pasa a ser un `layout` con **un solo sub_field repeater anidado** (ej. `hero-slider__items`) — el nombre del layout ya no puede ser también el nombre de un campo repetidor de nivel superior, porque ese nombre ahora lo ocupa el layout en sí.
3. En el componente PHP: sacar el wrapper `$data = get_field($class_name); if ($data): ... endif;` — la sola presencia del layout en el builder ya implica que la sección debe renderizarse. Reemplazar cada `$data[$class_name.'__campo']` por `get_sub_field($class_name.'__campo')` directo. Las cards de repeaters (`cards/*.php`) no cambian, siguen recibiendo el mismo array de filas.
4. Contenido ya cargado en la base: no se migra solo — hay que releerlo con `get_field()` ANTES de tocar el field group, y reescribirlo con `update_field('nombre-campo-flexible-content', $rows, $post_id)` después, donde cada fila de `$rows` lleva `'acf_fc_layout' => 'slug-del-componente'` más sus subcampos. Hacer backup (JSON del field group viejo + `wp db export`) antes de borrar nada.

## Cards de un repeater

Cuando un componente repetidor renderiza una card por fila (patrón `slider-main` → `cards/slider-main-card.php`):

- El **archivo** de la card usa **guion** para el sufijo `-card`: `$class_card = $class_name . '-card'` → `slider-main-card.php`, ubicado en `cards/`.
- Los **subcampos dentro de esa card** heredan el prefijo completo con doble guion bajo: `slider-main-card__titulo`, `slider-main-card__imagen`, `slider-main-card__cta`, etc. — no se acorta el prefijo.
- El template part se llama pasando `class_name` como argumento para que la card sepa qué prefijo de campos usar: `get_template_part('cards/'.$class_card, NULL, ['class_name' => $class_name])`.

## Clases CSS

Aunque el stack usa TWCSS (utilidades), el usuario **igual nombra la clase raíz de la sección con el slug del componente** (ej: `class="<?php echo $class_name ?> animate-fade-in ..."`) para poder hacer debug fácil en devtools, aunque el estilo real venga de las utilidades. Mantener esta práctica en todo componente nuevo: la primera clase del wrapper siempre es el slug del componente.

## Variables PHP típicas al inicio del archivo

```php
$class_name = 'nombre-componente'; // slug, mismo que el grupo de campos
$class_card = $class_name . '-card'; // solo si hay repeater con card
```

## Campos de imagen ACF/SCF (tipo Image, formato Array)

Siempre acceder como array con `url` y `alt`:

```php
<img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr($image['alt']); ?>">
```

## Campos de link (tipo Link)

Array con `url`, `title`, `target`:

```php
<a href="<?php echo esc_url($cta['url']); ?>" target="<?php echo esc_attr($cta['target']); ?>">
    <?php echo esc_html($cta['title']); ?>
</a>
```

## Principio: nombrar por función/características, no por el contenido específico de hoy

El slug de un componente describe **qué es estructuralmente** (tipo de layout, tipo de media, si es repeater o sección fija, cuántas columnas), nunca **de qué habla el contenido en este momento**. Un componente nombrado por su contenido actual deja de encontrarse el día que hace falta el mismo layout para un contenido distinto — la filosofía de este skill es que un componente se arma para reutilizarse, no para resolver solo el caso puntual que lo disparó (mismo principio que "campos genéricos" de arriba, aplicado al nombre del componente entero en vez de a un campo suelto).

- Mal: `manifiesto` para un banner con video de fondo + texto del manifiesto de la empresa — el día que aparece OTRO video sin relación con el manifiesto, no hay forma de encontrar el componente porque el nombre quedó atado al contenido de la primera vez que se usó.
- Bien: `video-banner` (sufijo de tipo `-banner`, ver lista abajo) — describe que es un banner con video de fondo, sin importar de qué hable el texto.

Esto aplica **siempre**, no solo cuando el usuario no da nombre: si el nombre que sugiere el usuario o el diseño está atado al contenido puntual (el título de la sección, un nombre propio, el tema del texto), traducirlo a un nombre por función/tipo de layout antes de crear el componente, y avisar qué nombre se eligió y por qué.

## Idioma de nombres de campos y slugs

Aunque el usuario dé los nombres, anotaciones o el diseño en español, el `name`/slug de cada campo, subcampo y componente (machine name, variables PHP) **siempre se escribe en inglés**. Traducir, no transliterar. El `label` (lo que el usuario ve al cargar contenido en el admin) **siempre queda en español**, salvo que se pida explícitamente lo contrario.

Para elegir el slug de un componente (con o sin nombre dado por el usuario — ver principio de arriba), inventar/ajustar un slug descriptivo en inglés que incluya un **sufijo de tipo** para que se entienda qué es solo con el nombre, siguiendo el patrón `{concepto}-{tipo}`:

- `-banner` — sección destacada con imagen + texto (ej. `purpose-banner`).
- `-slider` — repeater tipo carrusel/swiper (ej. `hero-slider`).
- `-mosaic` — grid de tarjetas cortas sin CTA individual fuerte (ej. `services-mosaic`).
- `-cards` — repeater de tarjetas con CTA propio cada una (ej. `origins-cards`).
- `-steps` — repeater numerado tipo proceso/línea de tiempo (ej. `process-steps`).
- `-stats` — repeater de cifras/KPIs (ej. `impact-stats`).

Si ninguno de estos sufijos describe bien el componente, elegir uno análogo en inglés que cumpla la misma función (dar una pista del tipo de layout solo leyendo el nombre) y avisar qué se eligió.

## Principio: variantes en vez de componentes duplicados

Cuando dos secciones del diseño son visualmente muy parecidas y lo único que cambia es un aspecto de layout/estilo (color de fondo, número de columnas de una grilla, lado de una imagen en un banner) — **no se duplica el componente**. Se resuelve como una *variante* del mismo componente, vía un Clone field compartido que el editor configura desde el admin (mismo mecanismo que `bg-color` de abajo). Solo se separa en un componente nuevo cuando el **modelo de datos difiere de verdad** (campos distintos, no solo el layout visual). Confirmado en CAFEXPORT con tres Clone fields de este tipo: `bg-color` (color de fondo), `columns` (número de columnas de una grilla `flex-grid`) e `image-position` (lado de la imagen en un banner imagen+texto) — ver las tres secciones siguientes.

## Principio: campos genéricos, no atados a un proveedor/plugin concreto

Cuando un campo va a guardar algo que técnicamente es intercambiable (un shortcode, una URL de embed, un ID externo, una clave de API), el `name`, el `label` y las instrucciones **nunca** nombran el plugin/proveedor específico que se usó para resolverlo hoy — aunque el proyecto solo tenga instalado uno en este momento. El campo tiene que poder recibir cualquier alternativa del mismo tipo sin que haya que renombrarlo ni tocar el PHP que lo consume.

- Mal: `contact-form__cf7-shortcode` (label "Shortcode del formulario (Contact Form 7)") — si mañana el proyecto cambia de Contact Form 7 a otro plugin de formularios, o el usuario quiere reusar el mismo layout para insertar CUALQUIER shortcode (no solo un formulario), hay que renombrar el campo y reescribir el `get_sub_field()`.
- Bien: `contact-form__shortcode` (label "Shortcode del formulario") — las instrucciones pueden mencionar el plugin actual como *ejemplo* de formato esperado, pero el nombre del campo describe **qué es** (un shortcode), no **de dónde viene hoy**.

Esto no es un capricho de naming: un campo atado a un proveedor concreto es la definición de un componente de un solo uso. La filosofía por defecto de este skill es que un componente/campo nuevo sirva para reutilizarse en distintos contextos, no solo para resolver el caso puntual que lo disparó — igual que el principio de "variantes en vez de componentes duplicados" de abajo, pero aplicado al nombre/alcance de un campo individual en vez de a la estructura del componente entero.

**Corolario — nunca un valor por defecto fijo silencioso:** si un campo de este tipo (algo que técnicamente podría no aplicar a otro sitio/instalación del mismo tema, como un shortcode/ID que solo existe en ESTE WordPress) queda vacío, el componente PHP **no** debe caer solo en un valor hardcodeado como fallback silencioso — eso oculta si el editor configuró bien el campo o si lo que se ve es "lo que dejó el desarrollador". En vez de eso, mostrar la sección solo si el campo tiene valor, y si está vacío, un aviso visible **solo para usuarios con `current_user_can('edit_posts')`** (nunca para el público) indicando qué campo falta completar. Caso real, CAFEXPORT 2026-08-14: `contact-form.php` tenía `get_sub_field($class_name.'__cf7-shortcode') ?: '[contact-form-7 id="414cb47" ...]'` — el fallback hacía que el componente pareciera "andar" en cualquier sitio nuevo aunque el editor nunca hubiera configurado el campo ahí, con un ID de formulario que solo existe en el sitio original.

## Color de fondo seleccionable por el editor (Clone field compartido)

Cuando el usuario pide que el editor pueda elegir el color de fondo de una sección desde el admin (selector con nombre amigable, ej. "Ámbar", "Verde oscuro"), pero el código reciba el slug real de rol del core TWCSS (`primary`, `secondary-dk`, `background`, etc.) para armar la clase Tailwind directamente — no es un campo por componente, es **un solo campo compartido clonado en todos los componentes** que lo necesiten. Confirmado y funcionando en CAFEXPORT (2026-07-15).

**Estructura:**
1. **Field group fuente, sin location** (ej. título "Color de Fondo (fuente para clonar)", `"location": []`) — nunca se edita como pantalla propia, existe solo para ser clonado. Contiene **un único campo** `select`:
   - `name`: `bg-color` (sin prefijo de componente — ver excepción de naming abajo).
   - `choices`: `{ "slug-del-rol": "Nombre amigable en español" }` — la clave es el rol real del core (leer `tailwindcss/plugins/variables.js` o el archivo de tokens equivalente del proyecto, nunca inventar los roles), el valor es el label que ve el editor.
   - `allow_null: true` (para que sea opcional, ver Paso de código en `code-patterns.md`).
   - `return_format: "value"` (devuelve el string del slug directo, no un array).
2. **Deduplicar `choices` por valor hex, no por nombre de rol.** Los roles de un core de colores por función (no por tono) pueden compartir el mismo hex a propósito (ej. en CAFEXPORT, `tertiary` y `error` son literalmente el mismo `#C30D3D`). Si dos roles resuelven al mismo hex, ofrecer **uno solo** como opción de selector — no tiene sentido mostrarle al editor dos nombres para el mismo color. Prioridad para decidir cuál mantener (de mayor a menor): 1) familia principal de marca (`primary`/`secondary`/`tertiary` y sus variantes `-dk`/`-lt`), 2) familia de fondos (`background`/`surface`/`outline`), 3) roles de mensaje (`success`/`info`/`error`). Confirmar con el usuario si hay ambigüedad real entre dos roles de la misma prioridad.
3. **Clonarlo en cada layout/componente** con un campo `type: "clone"`:
   ```json
   {
       "key": "field_XXXXXXXXXXXXX",
       "label": "Color de fondo",
       "name": "bg-color-clone",
       "type": "clone",
       "clone": ["field_KEY_DEL_SELECT_FUENTE"],
       "display": "seamless",
       "layout": "block",
       "prefix_label": false,
       "prefix_name": false
   }
   ```
   `display: "seamless"` + `prefix_name: false` son los que hacen que el campo aparezca "plano" dentro del layout (no anidado bajo un sub-grupo) y que el nombre real guardado en la base sea `bg-color` en todos lados, sin importar en qué componente esté — así `get_sub_field('bg-color')` funciona idéntico en cualquier componente que tenga el clone. Insertarlo como **primer** sub_field del layout (aparece arriba en el editor).
   Cada layout necesita su propia `key` única para el campo clone (son instancias distintas), pero todas apuntan al mismo `field_KEY_DEL_SELECT_FUENTE`.
4. **Reutilización real:** si mañana se agrega/saca un color del core, se edita **una sola vez** en el field group fuente (el select) y se re-importa — todos los componentes que lo clonan lo reciben automáticamente, sin tocar cada layout.
5. **También aplica a las cards de un repeater, no solo al layout completo** (confirmado en CAFEXPORT: 7 repeaters de cards con el mismo clone). Si el usuario pide color de fondo seleccionable "para las cards" además de (o en vez de) la sección completa, el mismo clone field (`field_KEY_DEL_SELECT_FUENTE`) se agrega como **primer sub_field del repeater** (`{componente}__items`), no del layout — cada fila de la card tiene entonces su propio `bg-color` independiente. Un mismo layout puede tener el clone en el layout Y en su repeater a la vez (color de fondo de la sección + color de fondo de cada card, independientes entre sí).

**Excepción de naming (única en el proyecto):** el subcampo clonado se llama `bg-color` a secas, sin el prefijo `{componente}__` que llevan todos los demás subcampos (ver regla general al principio de este archivo). Es la única excepción aceptada, y solo porque el campo está explícitamente diseñado para ser idéntico en todos los componentes vía Clone — no aplicar esta excepción a ningún otro campo sin que sea, igual que este, un Clone field compartido a propósito.

Ver `code-patterns.md` (sección "Color de fondo dinámico") para el patrón de PHP que consume este campo, y el gotcha de Tailwind safelist que hay que resolver porque la clase se arma dinámicamente.

## Número de columnas seleccionable por el editor (Clone field compartido, `flex-grid`)

Mismo mecanismo que `bg-color`, pero para el número de columnas de cualquier grilla de tarjetas (repeater con card). El editor ve una lista simple ("1 columna", "2 columnas"... hasta "6 columnas"), y el código traduce eso a una escala responsiva de la utilidad propia `flex-grid-*` del core (`tailwindcss/utilities/_flex.css`) — **nunca** a `grid grid-cols-*` fijo. Confirmado y en uso en CAFEXPORT (2026-07-16).

**Estructura:**
1. **Field group fuente, sin location** (ej. `columns-clone-source.json`) — un único campo `select`:
   - `name`: `columns` (sin prefijo de componente — misma excepción de naming que `bg-color`).
   - `choices`: `{ "1": "1 columna", "2": "2 columnas", "3": "3 columnas", "4": "4 columnas", "5": "5 columnas", "6": "6 columnas" }`.
   - `allow_null: true` (opcional — cae al default del componente), `return_format: "value"`.
2. **Clonarlo** en el layout completo (si el número de columnas es de la sección) o en el repeater `{componente}__items` (si es de las cards dentro de un layout fijo) con el patrón `type: "clone", display: "seamless", prefix_name: false` — igual que `bg-color-clone`.
3. **El valor elegido representa el breakpoint `lg`, no un número fijo por breakpoint.** El resto de la escala se calcula desde ese valor — ver la función helper en `code-patterns.md` §1.7. **Corrección confirmada 2026-07-16:** `lg` y `xl` se quedan en el mismo número elegido (no sube en `xl`) — recién sube un paso en `2xl`. Hacia abajo sí baja un paso por breakpoint (`md`, `sm`), piso en 1 columna en mobile. Ejemplo: elegir "4" arma `flex-grid justify-center sm:flex-grid-2 md:flex-grid-3 lg:flex-grid-4 xl:flex-grid-4 2xl:flex-grid-5`.
4. **El contenedor siempre lleva `justify-center`** (parte fija de la clase que arma el helper) para que la última fila, si queda incompleta, se vea centrada en vez de pegada a la izquierda — aplica a toda grilla `flex-grid` armada con este campo, no solo a componentes literalmente llamados "mosaico".
5. **El valor original hardcodeado del componente** (ej. 4 en `process-steps`, 3 en `origins-cards`/`stories-cards`) pasa a ser el *fallback* si el editor no elige nada — mismo criterio que el Caso B de `bg-color` en `code-patterns.md` §1.6.

**Excepción de naming:** el subcampo se llama `columns` a secas, sin prefijo `{componente}__` — misma razón que `bg-color` (Clone field pensado para ser idéntico en cualquier componente que lo use).

## Posición de imagen seleccionable por el editor (Clone field compartido, izquierda/derecha)

Para cualquier componente tipo "banner imagen + texto" (ej. `history-banner`, `purpose-banner`, o una fila dentro de un repeater del mismo tipo), el lado de la imagen no queda fijo en el markup — se resuelve con el mismo mecanismo de Clone field. Confirmado y en uso en CAFEXPORT (2026-07-16).

**Estructura:**
1. **Field group fuente, sin location** (ej. `image-position-clone-source.json`) — un único campo `select`:
   - `name`: `image-position`.
   - `choices`: `{ "left": "Imagen a la izquierda", "right": "Imagen a la derecha" }`.
   - `allow_null: true`, `return_format: "value"`.
2. **Clonarlo** en el layout (o en el repeater si la posición es por fila) con el mismo patrón `clone`/`seamless`/`prefix_name: false`.
3. **El valor original fijo del diseño** (ej. imagen siempre a la derecha en `purpose-banner`) pasa a ser el fallback si el editor no elige nada — ver `code-patterns.md` §1.8 para las clases `order-*` que consume este campo.

**Excepción de naming:** el subcampo se llama `image-position` a secas, misma razón que `bg-color`/`columns`.

## Subcampo de título para el admin (título dinámico de Flexible Content)

Todo layout nuevo del patrón Flexible Content (convención B) necesita **un subcampo que siga el patrón `{layout}__title`** (mismo naming BEM de siempre) si el componente tiene un campo de título/encabezado real. Esto no es solo estética: SCF no muestra ningún contenido en el título colapsado de una fila del admin, solo el nombre fijo del layout — si el mismo layout se usa varias veces en una página (algo normal en este patrón, ver convención B arriba), todas las filas se ven idénticas en la lista y hay que abrirlas una por una para saber cuál es cuál.

El proyecto ya resuelve esto con un filtro genérico site-wide en `functions/utils/utils.php` (enganchado a `acf/fields/flexible_content/layout_title/name=page-builder`): busca automáticamente `get_sub_field('{layout}__title')` (o `'{layout}__text'` como fallback) y arma el título del admin como `"Nombre del layout: valor real"`. No hay que tocar ese filtro por cada componente nuevo — **alcanza con que el layout tenga el subcampo con ese nombre exacto** para que el filtro ya existente lo levante solo.

- Si el layout tiene un campo de encabezado real (la mayoría de los casos: `purpose-banner__title`, `history-timeline__title`, `banner-50-50__title`, etc.), usar `__title` — es el nombre que ya usa casi todo el proyecto para ese campo, no hace falta agregar nada extra.
- Si el layout no tiene un "título" real sino solo un campo de texto corto identificador (caso `demo-label`, que solo tiene `demo-label__text`), el fallback a `__text` ya lo cubre sin cambios.
- Layouts sin ningún campo de texto simple en el nivel superior (ej. `hero-slider`, cuyo texto vive dentro de un repeater anidado `hero-slider__items`) se quedan sin título dinámico — no hace falta forzar un campo extra solo para esto, el nombre fijo del layout ya alcanza si no se repite en la misma página.

Confirmado y en uso en CAFEXPORT (2026-08-14).

## Label del layout: siempre con el nombre de máquina entre paréntesis

Todo layout de Flexible Content (convención B) lleva su `label` con el **nombre de máquina del componente entre paréntesis al final**, en vez de una palabra descriptiva suelta. El editor ve este label combinado con el título dinámico de arriba (`"{label del layout}: {valor real}"`), y necesita el slug ahí para poder cruzarlo con el código/la conversación con el desarrollador sin adivinar — un paréntesis con "(numerado)"/"(mosaico)"/"(tarjetas)" no sirve para eso.

Patrón: `{Label en español, sin paréntesis propios}: ({slug-del-layout})`.

- Mal: `"label": "Banner de pilares (numerado)"`.
- Bien: `"label": "Banner de pilares (pillars-banner)"`.
- Layouts sin ningún paréntesis previo también lo reciben: `"Hero Slider"` → `"Hero Slider (hero-slider)"`.

Si el label ya traía un paréntesis con otra cosa (un adjetivo, una aclaración), ese contenido se reemplaza por el slug — no se agrega un segundo paréntesis. Aplica a los 28 layouts de `field-groups-json/flexible-page.json` de CAFEXPORT (2026-08-20) y a cualquier layout nuevo que se cree en este proyecto o en otro que siga el mismo patrón B.

## Contexto de campo (category/term meta)

Cuando el campo SCF está asignado a una categoría/término en vez de a un post, pasar el contexto explícito:

```php
get_field('category-icon', 'category_' . $category->term_id);
// o directamente el objeto:
get_field('category-imagen', $current_category);
```
