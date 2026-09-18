# Patrones de código WordPress/SCF a replicar

Extraídos de los componentes reales del usuario. Seguir estos patrones al generar código nuevo para que sea indistinguible del resto del tema.

## 1. Sección opcional controlada por un campo

```php
<?php
$class_name = 'nombre-componente';

if (get_field($class_name)): ?>
    <section class="<?php echo $class_name ?> ...">
        ...
    </section>
<?php endif ?>
```

## 1.5. Dispatcher de Flexible Content (patrón DEFAULT para plantillas con varios componentes reutilizables — ver `naming-conventions.md` convención B)

La plantilla PHP (compartida entre todas las páginas de este patrón, ej. `templates/flexible-page.php`) no lista componentes en orden fijo — recorre lo que el editor armó en el admin:

```php
<?php
get_header();

if (have_rows('page-builder')):
    while (have_rows('page-builder')): the_row();
        get_template_part('components/' . get_row_layout());
    endwhile;
endif;

get_footer();
```

`get_row_layout()` devuelve el `name` del layout de esa fila (= el slug del componente), así que arma la ruta de `get_template_part()` dinámicamente. Agregar un componente nuevo a este patrón NUNCA requiere tocar este archivo — solo crear el `.php` del componente y sumar el layout al field group compartido.

El componente PHP en este patrón **no lleva el wrapper de guard `get_field($class_name)`** (regla dura #1 tradicional) porque la sola presencia del layout en el builder ya es la confirmación de que el editor quiere esa sección ahí — se reemplaza por acceso directo con `get_sub_field()`:

```php
<?php
$class_name = 'purpose-banner';
$title = get_sub_field($class_name . '__title');
$subtitle = get_sub_field($class_name . '__subtitle');
?>
<section class="<?php echo $class_name ?> ...">
    <?php if ($title): ?>
        <span class="eyebrow"><?php echo esc_html($title); ?></span>
    <?php endif; ?>
    <?php if ($subtitle): ?>
        <h2 class="text-left text-secondary-dk"><?php echo esc_html($subtitle); ?></h2>
    <?php endif; ?>
</section>
```

Las reglas duras #11 (cada campo individual con su propio `if`) y #12 (`$class_name` como única fuente de verdad) siguen aplicando igual dentro de este patrón — lo único que cambia es que no hay guard de sección a nivel componente completo.

Si el componente es un repeater/card dentro de este patrón (ej. `hero-slider`), el repeater vive como **sub_field anidado del layout**, no como el layout mismo — ver "Migrar de `group` a `flexible_content`" en `naming-conventions.md`:

```php
<?php
$class_name = 'hero-slider';
$class_card = $class_name . '-card';

if (have_rows($class_name . '__items')): ?>
    <section class="<?php echo $class_name ?> ...">
        <div class="swiper-wrapper">
            <?php while (have_rows($class_name . '__items')): the_row();
                get_template_part('cards/' . $class_card, NULL, [
                    'class_name' => $class_name,
                    'class_card' => $class_card,
                ]);
            endwhile; ?>
        </div>
    </section>
<?php endif; ?>
```

## 1.6. Color de fondo dinámico (campo `bg-color` clonado — ver `naming-conventions.md`)

Cuando el componente tiene el campo `bg-color` clonado (selector de color de fondo, ver naming-conventions.md), el `$class_name` de la sección se arma en dos partes separadas: una variable con **solo lo dinámico** (nombre del componente + color de fondo), y las clases de Tailwind **fijas** (spacing, layout, etc.) quedan **literales en el markup**, no concatenadas dentro de la variable — así siguen siendo fáciles de leer/tocar a mano en el HTML, y solo lo que realmente varía en tiempo de ejecución vive en PHP.

**Caso A — el diseño original NO tenía un color de fondo fijo** (la sección hereda el fondo de la página si no se elige nada): `$bg_color` puede quedar vacío, sin operador `?:`.

```php
$class_name = 'purpose-banner';
$bg_color = get_sub_field('bg-color');
$section_class = trim("$class_name " . ($bg_color ? "bg-$bg_color " : ''));
?>
<section class="<?php echo esc_attr($section_class) ?> py-9 sm:py-15 md:py-21">
```

**Caso B — el diseño original SÍ tenía un color de fondo fijo** (ej. `bg-secondary-dk` hardcodeado): ese valor pasa a ser el *fallback* con el operador `?:` de PHP (Elvis operator) — si el editor no elige nada en el select, el componente se ve exactamente igual que antes; solo cambia si se elige explícitamente otro color.

```php
$class_name = 'manifesto-quote';
$bg_color = get_sub_field('bg-color') ?: 'secondary-dk';
$section_class = "$class_name bg-$bg_color";
?>
<section class="<?php echo esc_attr($section_class) ?> py-9 sm:py-15 md:py-21">
```

**Cuando la SECCIÓN y sus CARDS tienen `bg-color` a la vez, mantener el contraste entre ambas capas — no dejar que las dos queden en el mismo tono.** Bug real encontrado en CAFEXPORT (2026-07-15): si la sección no elige color y hereda el fondo global de la página, y la card además cae en ESE MISMO rol por default, la card queda invisible (mismo color exacto, sin ningún borde/sombra que la separe) — pasó con `process-steps`, `stories-cards` y `origins-cards`, cuyas cards usaban `bg-background` (igual al fondo global `<html>`) mientras la sección no tenía fondo propio. La relación correcta, confirmada visualmente contra el diseño de referencia: **la sección lleva el tono ligeramente más oscuro/tintado (`surface` u otro rol propio), y la card lleva el tono más claro (`background`)** para que la card "flote" como bloque distinguible — nunca al revés (sección clara + card oscura se ve como que "sobra" contraste en el lugar equivocado). Patrón:

```php
// Sección (ej. process-steps.php, stories-cards.php, origins-cards.php)
$bg_color = get_sub_field('bg-color') ?: 'surface';
$section_class = "$class_name bg-$bg_color";

// Card dentro de esa sección (ej. process-steps-card.php)
$bg_color = $item['bg-color'] ?: 'background';
$card_class = "nombre-card bg-$bg_color";
```

Si el editor elige colores explícitos para ambas capas, esta relación de contraste queda en sus manos (puede elegir dos colores que choquen) — la regla de arriba es solo el *default* razonable cuando nadie tocó ninguno de los dos selects.

**El mismo campo, aplicado a una card de repeater en vez de al layout completo:** la única diferencia es cómo se lee el valor — las cards que reciben sus datos ya resueltos como array (`extract($args); $title = $item['xxx-card__title'];`, patrón de la sección "2. Repeater con card separada" más abajo) leen el color como `$item['bg-color']` (acceso de array, no `get_sub_field()`, porque ya no hay una fila ACF "activa" en ese punto — el array completo ya se extrajo antes en el componente padre). Las cards que sí viven dentro de un `while(have_rows()): the_row();` propio (ej. `hero-slider-card.php`, llamado desde dentro del loop de slides) siguen usando `get_sub_field('bg-color')` igual que un layout:

```php
// Card que recibe $item ya resuelto (origins-cards-card.php, values-mosaic-card.php, etc.)
extract($args);
$bg_color = $item['bg-color'] ?: 'background'; // o sin fallback si la card no tenía bg propio
$card_class = trim('nombre-card ' . ($bg_color ? "bg-$bg_color" : ''));
```

**Gotcha de Tailwind a resolver siempre que una clase se arma con concatenación de PHP (no como texto literal):** el compilador de Tailwind (v3 o v4) escanea el código fuente buscando nombres de clase completos como texto — una clase armada dinámicamente (`'bg-' . $bg_color`) **nunca aparece como literal** en ningún archivo, así que sin ayuda extra Tailwind no genera el CSS para esa clase y el color simplemente no se aplica (sin error, falla en silencio). Antes de dar por terminado un campo de color dinámico, confirmar que el proyecto tiene un mecanismo de *safelist* que registre TODAS las clases `bg-{rol}` (y cualquier variante extra que se use dinámicamente, ej. `bg-{rol}/80` para overlays con opacidad) para cada rol de color posible — en CAFEXPORT es `tailwindcss/plugins/safelist.js` (genera `tailwind.config.js` a partir de los roles de `variables.js`). Si el proyecto no tiene un mecanismo así, hay que crearlo o avisar explícitamente antes de seguir — no asumir que "ya va a andar" porque el código PHP está bien escrito.

## 1.7. Número de columnas dinámico (campo `columns` clonado — ver `naming-conventions.md`)

El valor elegido por el editor representa el breakpoint `lg`; el resto de la escala responsiva se calcula a partir de ese número con un helper compartido (vivir en `functions/utils.php`, junto a los demás helpers del tema, para no repetirlo en cada componente). **Corrección confirmada 2026-07-16:** `lg` y `xl` quedan en el mismo número elegido (no sube en `xl`) — recién sube un paso en `2xl`. El contenedor siempre lleva `justify-center` para que la última fila incompleta quede centrada:

```php
function cx_flex_grid_classes(int $lg): string {
    $xl2 = $lg + 1;
    $md = max($lg - 1, 1);
    $sm = max($lg - 2, 1);
    return "flex-grid justify-center sm:flex-grid-$sm md:flex-grid-$md lg:flex-grid-$lg xl:flex-grid-$lg 2xl:flex-grid-$xl2";
}
```

Consumo en el componente (el número hardcodeado que tenía el diseño original pasa a ser el fallback):

```php
$columns = (int) (get_sub_field('columns') ?: 4); // 4 = default original del diseño
$grid_class = cx_flex_grid_classes($columns);
```

```php
<div class="container <?php echo esc_attr($grid_class) ?> gap-y-6">
    <?php foreach ($items as $item): ?>
        <div class="px-3">
            <?php get_template_part('cards/' . $class_card, NULL, ['item' => $item]); ?>
        </div>
    <?php endforeach; ?>
</div>
```

**Gotcha de gap horizontal (regla dura de `flex-grid`, ver `tailwindcss/readme.md` §"Uso de Gap en flex-grid"):** con `flex-grid-*` nunca se usa `gap-*`/`gap-x-*` (rompe el ancho calculado y los ítems saltan de línea) — solo `gap-y-*` para el espacio entre filas. El espacio horizontal se resuelve envolviendo cada card en un `<div class="px-3">` (el "gutter") como en el ejemplo de arriba, nunca agregando padding directo a la card visual (si la card ya tiene su propio `bg-color`/`rounded-2xl`/`overflow-hidden` en su elemento raíz, agregarle padding ahí NO crea espacio entre cards — el fondo sigue ocupando el 100% del ancho calculado, el padding solo empuja el contenido hacia adentro sin dejar ver ningún gap real).

**Gotcha de safelist:** igual razón que `bg-color` (§1.6) — la clase se arma por concatenación de PHP y nunca aparece como texto literal, así que Tailwind no la genera sin ayuda. `tailwindcss/plugins/safelist.js` necesita las combinaciones `flex-grid-N`/`sm:flex-grid-N`/`md:flex-grid-N`/`lg:flex-grid-N`/`xl:flex-grid-N`/`2xl:flex-grid-N` para todo N de 1 a 7 (6 columnas máximo elegible en el select + 1 de margen para el caso `2xl` de la opción "6"). `justify-center` no necesita safelist — aparece literal en el string de `functions/utils.php`, Tailwind lo detecta solo.

## 1.8. Posición de imagen dinámica (campo `image-position` clonado — ver `naming-conventions.md`)

```php
$image_position = get_sub_field('image-position') ?: 'right'; // fallback = diseño original
$image_order = $image_position === 'left' ? 'md:order-1' : 'md:order-2';
$content_order = $image_position === 'left' ? 'md:order-2' : 'md:order-1';
```

```php
<div class="container grid gap-8 md:grid-cols-2 md:items-center">
    <div class="<?php echo esc_attr($content_order) ?>">
        <!-- título / párrafo / cta -->
    </div>

    <?php if ($image): ?>
        <div class="<?php echo esc_attr($image_order) ?> rounded-2xl overflow-hidden aspect-[4/5] md:aspect-square">
            <img class="size-full object-cover" src="<?php echo esc_url($image['url']); ?>"
                alt="<?php echo esc_attr($image['alt']); ?>" loading="lazy">
        </div>
    <?php endif; ?>
</div>
```

**Gotcha de safelist:** `md:order-1` y `md:order-2` (y cualquier otro prefijo responsivo que se use) necesitan estar en `safelist.js` por el mismo motivo — nunca aparecen como texto literal.

## 2. Repeater con card separada

```php
<?php
$class_name = 'slider-main';
$class_card = $class_name . '-card';

if (get_field($class_name)): ?>
    <section class="<?php echo $class_name ?> ...">
        <div class="swiper-wrapper">
            <?php while (have_rows($class_name)): the_row();
                get_template_part('cards/' . $class_card, NULL, [
                    'class_name' => $class_name,
                    'class_card' => $class_card,
                ]);
            endwhile; ?>
        </div>
    </section>
<?php endif ?>
```

## 3. Flexible content / campos sueltos (no repeater)

```php
<?php
$class_name = 'featured-product';

if (get_field($class_name)): ?>
    <section class="<?php echo $class_name ?>">
        <?php while (have_rows($class_name)): the_row();
            $title = get_sub_field($class_name . '__title');
            $image = get_sub_field($class_name . '__image');
            $cta   = get_sub_field($class_name . '__cta');
        ?>
            <?php if ($title): ?>
                <h2><?php echo $title; ?></h2>
            <?php endif; ?>
        <?php endwhile; ?>
    </section>
<?php endif; ?>
```

## 4. Template parts que reciben argumentos (`$args`)

Cuando un componente necesita datos externos (ej: una categoría específica), se le pasan por `$args` y se extraen al inicio:

```php
<?php
extract($args);
$class_name = 'slider-category';

if (!isset($category)) {
    return;
}
```

Y se llama así: `get_template_part('loops/slider-category', NULL, ['category' => $cat_object]);`

## 5. Loops con `WP_Query` custom → siempre `wp_reset_postdata()`

```php
$posts_query = new WP_Query($query_args);

if (!$posts_query->have_posts()) {
    return;
}
?>
<?php while ($posts_query->have_posts()) : $posts_query->the_post(); ?>
    <?php get_template_part('cards/post-card'); ?>
<?php endwhile; ?>
<?php wp_reset_postdata(); ?>
```

## 6. Contexto de categoría/archivo (`get_queried_object()`)

Para componentes usados en `archive.php`/`category.php`, obtener el término actual con:

```php
$current_category = get_queried_object();
```

**Ojo con la jerarquía de plantillas de WP para la taxonomía nativa `category`: NO pasa por `taxonomy.php`.** Un `taxonomy.php` genérico (por `get_queried_object()`) cubre cualquier taxonomía CUSTOM (`taxonomy-{custom}.php` → `taxonomy.php` → `archive.php`), pero para la taxonomía nativa `category` WordPress busca primero `category-{slug}.php` → `category-{id}.php` → `category.php`, y si NINGUNO de esos existe, cae derecho a `archive.php` — se salta `taxonomy.php` por completo, aunque exista y sea genérico. Caso real CAFEXPORT, 2026-08-13: `taxonomy.php` ya resolvía bien el hero+grid+prefooter de una taxonomía custom (`historia_categoria`), pero `/category/{slug}/` (taxonomía nativa) caía en `archive.php` — que no tenía ningún hero para ese caso — y se veía "roto" sin ningún error, solo la sección hero ausente. Si un proyecto quiere que `category`/`post_tag` reusen exactamente la misma lógica que ya tiene `taxonomy.php`, crear `category.php`/`tag.php` como un simple include, no una copia:
```php
<?php
// category.php
require locate_template('taxonomy.php');
```

## 7. Escaping — siempre, sin excepciones

- Texto plano en atributos → `esc_attr()`
- URLs → `esc_url()`
- HTML permitido pero escapado como texto → `esc_html()`
- Título en atributo `alt`/`title` → `the_title_attribute()`
- Contenido enriquecido de un campo WYSIWYG puede imprimirse directo (`echo $description;`) si el campo SCF ya sanitiza — replicar el criterio que ya usa el tema (ver `featured-product.php`, imprime `$description`/`$footer` directo).

## 8. Paginación / navegación

Para paginación de archivos tipo `grid-post.php`, usar `paginate_links()` con `'type' => 'array'` y reconstruir clases de TWCSS sobre el HTML que devuelve (`str_replace` de `page-numbers` por las clases del core). No reinventar el markup de paginación de WP.

## 9. Shortcodes de plugins de terceros

Se imprimen con `do_shortcode()` tal cual, sin envolver en lógica adicional: `<?php echo do_shortcode('[TheChamp-Sharing]'); ?>`

## 11. Validación obligatoria — nunca imprimir HTML de un campo vacío/inexistente

Regla dura, sin excepciones: **cada campo o subcampo se envuelve en su propio `if` antes de imprimir cualquier HTML asociado.** No alcanza con el guard del contenedor (`if (get_field($class_name)):`) — cada elemento individual adentro también necesita el suyo, tal como en `featured-product.php`:

```php
<?php if ($title): ?>
    <h2 class="font-light mb-0"><?php echo $title; ?></h2>
<?php endif ?>

<?php if ($image): ?>
    <img src="<?php echo esc_url($image['url']) ?>" alt="<?php echo esc_attr($image['alt']) ?>">
<?php endif ?>
```

Aplica a todo tipo de campo:
- **Texto/WYSIWYG:** `if ($campo):`
- **Imagen (array):** `if ($imagen):` (no hace falta chequear `$imagen['url']` aparte, si el array existe ACF/SCF ya trae `url`)
- **Link (array):** `if ($cta):` antes de armar el `<a>`
- **Repeater/Flexible content:** `if (have_rows($campo)):` (o directamente `if (get_field($campo)):` como guard de sección, según el patrón visto)
- **Grupos (`group`):** chequear que el grupo no sea `false`/vacío antes de acceder a sus subcampos

Motivo: así el componente nunca deja wrappers HTML vacíos (`<h2></h2>`, `<figure>` sin imagen, etc.) cuando el content editor no cargó ese campo — es el mismo criterio que ya usa el usuario en todos sus componentes existentes.

## 12. `$class_name` como única fuente de verdad — nunca hardcodear el slug del componente

El nombre del componente se define **una sola vez**, al principio del archivo, en `$class_name` (y `$class_card` si aplica). A partir de ahí, **todo** lo demás se construye a partir de esa variable — nunca se vuelve a escribir el string del slug a mano en el resto del archivo:

```php
$class_name = 'nombre-componente';
$class_card = $class_name . '-card'; // si hay repeater con card
```

Usos obligatorios de la variable (no del string literal):
- **Clase raíz del wrapper:** `class="<?php echo $class_name ?> ..."`
- **Guard de sección:** `if (get_field($class_name)):`
- **Repeater:** `while (have_rows($class_name)): the_row();`
- **Subcampos:** `get_sub_field($class_name . '__campo')` — el prefijo BEM se arma concatenando, nunca escribiendo `'nombre-componente__campo'` literal.
- **Ruta de la card:** `get_template_part('cards/' . $class_card, NULL, ['class_name' => $class_name])`
- **Clases de swiper/JS hooks:** `js-swiper-<?php echo $class_name ?>`, igual que en `slider-main.php`/`slider-category.php`.

Motivo: evita errores de tipeo entre el nombre de la clase CSS, el nombre del grupo de campos, y los `sub_field` — si el usuario cambia el slug del componente, alcanza con cambiar el valor de `$class_name` una vez.

## 12.5. `$class_card` no sirve de nada si el componente lo calcula pero nunca lo pasa/echa — tiene que llegar al DOM real

Bug real encontrado en CAFEXPORT (2026-08-02): casi todos los componentes con card separada definían `$class_card = $class_name . '-card';` (regla #12) **pero nunca lo pasaban** en el `get_template_part()` de la card (solo pasaban `class_name`, ver ejemplos de las secciones "1.5" y "2" — ya corregidos arriba), y la card **tampoco lo echaba** en su `<div class="...">` raíz. Resultado: el identificador vivía en una variable PHP, pero el HTML que llega al navegador no tenía ninguna clase que distinguiera "esta card específica" de su componente padre — herramientas que inspeccionan el DOM real (ej. `dev-inspector-toolbar`, o cualquier lector de accesibilidad/testing que ancle por clase) solo podían identificar la SECCIÓN contenedora, nunca la card individual.

Dos pasos obligatorios, ambos necesarios (uno sin el otro no alcanza):

1. **Pasar `class_card` en el `$args`** del `get_template_part()` (ver secciones "1.5" y "2" arriba) — no alcanza con pasar `class_name` solo.
2. **La card lo echa como el PRIMER token literal** de su `class="..."` raíz:

```php
// cards/nombre-card.php
extract($args);
?>
<div class="<?php echo esc_attr($class_card); ?> resto-de-clases-tailwind">
```

**Por qué tiene que ir PRIMERO en la lista, no en cualquier posición:** si la card vive dentro de un slide de Swiper (`swiper-slide`, ver patrón de la sección "2"), esa clase es genérica — la comparte cada slide de cada slider del proyecto, así que por sí sola no identifica nada. Cualquier herramienta que resuelva "¿qué componente es este elemento?" leyendo la primera clase no-utilitaria del `class` (de afuera hacia adentro o al revés) tiene que encontrarse con el slug específico de la card ANTES que con `swiper-slide` — poniendo `$class_card` primero en el string se garantiza eso sin tener que mantener ninguna lista de exclusión de clases de terceros (Swiper, etc.).

**Si la card ya arma su propia variable de clase con lógica extra (`bg-color`, BEM propio, etc., ver sección "1.6"):** el slug de la card tiene que aparecer como token literal separado en el `class=""`, no alcanza con que esté "adentro" del string armado en PHP si ese string no incluye el slug. Agregar el literal *al lado* de la variable existente, sin tocar la lógica que ya arma:

```php
// card con bg-color propio (ver sección 1.6) — el slug va SIEMPRE, la variable puede quedar vacía o no
$card_class = trim('nombre-card ' . ($bg_color ? "bg-$bg_color" : ''));
?>
<div class="<?php echo esc_attr($card_class) ?>">
```

Acá `nombre-card` ya es el primer token dentro de `$card_class` porque el propio `trim('nombre-card ' . ...)` lo concatena primero — mismo resultado, sin variable nueva. Si la card arma su clase con literal-BEM ajeno al slug (`"card card--origin bg-$bg_color"`, sin el nombre de archivo en ningún lado), agregar el slug de la card como literal aparte, antes de esa expresión: `class="nombre-card <?php echo esc_attr($card_class) ?>"`.

## 13. Wrappers de página que alternan estilos entre secciones

En `home.php`, las secciones van dentro de un wrapper que alterna fondo y controla animaciones vía CSS (no PHP):

```php
<div class="decorated-section [&>*:nth-child(odd)]:bg-surface [&>*:first-child]:animate-fade-in [&>*:not(:first-child)]:transition-scroll">
    <?php
    get_template_part('loops/sliders-categories');
    get_template_part('components/featured-product');
    get_template_part('components/grid-media');
    ?>
</div>
```

**Importante:** si se inserta un componente nuevo dentro de este wrapper, el orden en el que se llama `get_template_part()` determina si le toca fondo `bg-surface` o no (posición impar/par), y si lleva `transition-scroll` (todo menos el primer hijo). No hace falta agregar clases de fondo/animación manualmente en el componente si va a vivir dentro de este wrapper — ya lo resuelve el CSS del padre.
