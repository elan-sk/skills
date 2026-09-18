---
name: wp-swiper-slider-builder
description: Crea sliders/carruseles en WordPress con la librería Swiper usando el wrapper propio SwiperManager (js/libraries/swiper.js) de ELAN-SK, ya sea alimentados por un repeater de Secure Custom Fields (SCF) o por un WP_Query de posts. Úsala con "hazme este slider", "arma este carrusel", "conecta este swiper", "slider de posts/categoría", `SwiperManager`, `.js-swiper-`, `swiper-wrapper`, `swiper-pagination`, `EffectCoverflow`/`EffectFade`, o al tocar cualquier archivo bajo `js/libraries/swiper.js` / `js/components/swiper-*.js`. Es el patrón WordPress+PHP; la variante para sliders en proyectos React/Vite se agregará cuando haya ejemplos.
---

# WP Swiper Slider Builder

Skill para crear sliders/carruseles en temas WordPress de ELAN-SK usando la librería [Swiper](https://swiperjs.com/) a través del wrapper propio `SwiperManager`. Cubre la variante **PHP + WordPress** (SCF o WP_Query). La variante para React/Vite no está cubierta todavía — se agrega cuando haya ejemplos reales para analizar.

**Skills complementarios:**
- `wp-scf-component-builder` — para crear/conectar el grupo de campos SCF cuando el slider se alimenta de un repeater (no duplicar ese flujo acá; esta skill asume que el campo SCF ya existe o remite a esa skill para crearlo).
- `tw-design-system` — para las clases de color/spacing del core TWCSS v4 (ej. el color del bullet activo en `.swiper-pagination`, el color de los botones custom).

---

## Arquitectura del patrón (3 capas)

1. **`js/libraries/swiper.js`** — clase `SwiperManager`: un wrapper único sobre `Swiper` que **no se toca por cada slider nuevo**. Ver `references/code-patterns.md` para el código completo comentado.
2. **`js/components/swiper-{slug}.js`** — un archivo por slider, cada uno instancia `new SwiperManager(selector, customConfig, slidesPerView)`. Acá vive la config específica de ESE slider (efecto, breakpoints, autoplay, nav custom).
3. **`components/{slug}.php`** (+ opcionalmente `cards/{slug}-card.php`) — el markup: `.swiper.js-swiper-{slug}` → `.swiper-wrapper` → `.swiper-slide`, más pagination/navigation.

El selector de la capa 2 (`.js-swiper-{slug}`) y la clase del wrapper en la capa 3 **tienen que coincidir exactamente** — es el único punto de conexión entre JS y PHP.

---

## Cómo funciona `SwiperManager` (leer antes de escribir el JS de un slider nuevo)

Ver el código completo en `references/code-patterns.md`, sección 1. Puntos clave que cambian cómo escribís la config de cada slider:

- **Constructor:** `new SwiperManager(selector, customConfig = {}, slidesPerView = 1)`.
- **Merge de config:** `this.config = { ...this.defaultConfig, ...customConfig }` — esto es un **spread superficial**, no un merge profundo. Si `customConfig` trae la key `modules`, **reemplaza entera** la lista default (`[Navigation, Pagination, Autoplay, EffectFade]`), no la extiende. Regla dura: si tu slider necesita un módulo extra (ej. `EffectCoverflow`), tenés que **re-listar todos los módulos que sigas necesitando**, incluyendo `Navigation` si vas a usar navegación estándar. Ver `swiper-slider-main.js` en la referencia: al listar `[EffectCoverflow, Pagination, Autoplay]` deliberadamente **deja afuera `Navigation`**, y por eso los botones custom de ese slider no usan el parámetro `navigation` sino que llaman `swiper.slidePrev()/slideNext()` a mano (API core de Swiper, no depende del módulo Navigation).
- **Auto-wiring de pagination/navigation:** dentro de `init()`, por cada elemento que matchea `selector`, `SwiperManager` busca `.swiper-pagination`, `.swiper-button-next` y `.swiper-button-prev` **como hijos directos de `el.parentElement`** (hermanos del `.swiper`, no descendientes de `.swiper`). Si tu markup PHP no pone esos elementos en ese nivel exacto, el auto-wiring no los encuentra.
- **Pagination condicional por viewport:** la paginación solo se activa si `window.innerWidth >= 720` al momento de `init()` (se evalúa una sola vez, no es reactivo a resize).
- **`slidesPerView` por constructor vs. por config:** el 3er argumento del constructor (`slidesPerView`) también fija `slidesPerGroup` al mismo valor y es la forma rápida de pedir "N slides visibles, avanza de a N". Si necesitás algo más fino (ej. `slidesPerView: "auto"` para coverflow, o valores distintos por breakpoint), configuralo directo en `customConfig` / `customConfig.breakpoints` en vez de usar el 3er argumento.

---

## Flujo para crear un slider nuevo

### Paso 1 — Definir slug y origen de contenido

1. Elegir `{slug}` en kebab-case (ej. `slider-testimonios`).
2. Confirmar el **origen de las slides** — hay dos patrones ya usados en el proyecto, no inventar un tercero sin necesidad:
   - **A. Repeater SCF** (patrón `slider-main`): cada slide es una fila de un campo repeater propio del componente.
   - **B. WP_Query de posts** (patrón `slider-category`): cada slide es un post real (de una categoría, CPT, etc.), reutilizando una card ya existente (ej. `cards/post-card.php`) en vez de crear una nueva.
3. Si no queda claro cuál de los dos aplica por el pedido del usuario, **preguntar** — cambia el Paso 2 y el Paso 3 por completo.

### Paso 2 — Resolver el contenido (según el origen elegido en Paso 1)

- **Ruta A (SCF repeater):** verificar si ya existe el grupo de campos (buscar en `field-groups-json/` o `acf-json/` un `title`/`key` == `{slug}`). Si no existe y hay que crearlo, delegar ese sub-flujo a la skill `wp-scf-component-builder` (Paso 5 de esa skill) — no reinventar la generación de JSON de campos acá.
- **Ruta B (WP_Query):** confirmar qué se está consultando (categoría vía `$args['cat']`, CPT, taxonomía custom, etc.) y qué card ya existente se reutiliza para cada slide. Si no hay card compatible, esa card se crea siguiendo las convenciones de `wp-scf-component-builder` (BEM guion-bajo, escaping), no las de esta skill.

### Paso 3 — Crear `components/{slug}.php`

Ver `references/code-patterns.md` sección 2 y 3 para los dos esqueletos completos (Ruta A y Ruta B). Reglas comunes a ambas rutas:

1. `$class_name = '{slug}';` una sola vez al inicio — todo el resto (clases CSS, nombre del campo, ruta de la card) se construye desde esa variable, nunca repitiendo el slug como string literal.
2. Guard de sección opcional:
   - Ruta A: `if (get_field($class_name)):` envolviendo todo el `<section>`.
   - Ruta B: `if (!$posts_query->have_posts()) { return; }` antes de imprimir markup (ver `slider-category.php`), y `wp_reset_postdata();` al final del archivo, después del `while`.
3. Markup mínimo:
   ```
   <div class="swiper js-swiper-<?php echo $class_name ?> ...">
     <div class="swiper-wrapper">
       <!-- slides -->
     </div>
     <div class="swiper-pagination ..."></div>
     <!-- navegación: ver Paso 4 -->
   </div>
   ```
4. Si el mismo componente se va a renderizar más de una vez en la misma página (ej. un slider por categoría, como en `slider-category.php`), agregar una clase adicional única por instancia (`js-swiper-<?php echo $class_name.'-'.$slug_instancia ?>`) además de la clase general — es solo para poder targetear una instancia puntual desde CSS/JS más adelante si hace falta; el `SwiperManager` va a instanciar igual **todas** las que matcheen la clase general vía `querySelectorAll`.

### Paso 4 — Decidir navegación: estándar vs. custom

- **Estándar (default, preferir esto salvo que el diseño pida botones con otra posición/estilo fuera del contenedor `.swiper`):** poner `.swiper-button-prev` / `.swiper-button-next` como hermanos de `.swiper-wrapper` dentro del `.swiper`. El `SwiperManager` los detecta solo — no hace falta tocar el JS.
- **Custom (patrón `slider-main`):** si el diseño tiene botones con clases/posición propias (ej. `.custom-prev`/`.custom-next` posicionados absolutos sobre el slider, no dentro de la caja `.swiper`), no uses `.swiper-button-prev/next` — creá los botones con tus propias clases y wireálos a mano en el JS (Paso 5, ver referencia sección 1.2).
- **Regla dura, siempre que uses `.swiper-button-prev/next` / `.swiper-pagination`:** si un slider ya matchea `enablePagination`/auto-wiring (Paso 4 de más arriba, viewport ≥720px) pero el markup NO trae `.swiper-pagination`/`.swiper-button-next`/`.swiper-button-prev`, `SwiperManager` igual arma `pagination.el`/`navigation.nextEl/prevEl` como `null` — Swiper tira `Uncaught TypeError: getComputedStyle... parameter 1 is not of type 'Element'` en cada transición y el slider queda trabado en el mismo slide pese a que `swiper-initialized` y `autoplay.running` dan `true` (bug real, no teórico). Si el diseño no pide dots/flechas visibles, agregar igual esos tres elementos al markup (aunque sea sin estilo visible) en vez de omitirlos.
- **Regla dura, si el `.swiper` va dentro de una columna flex (`flex-grid-*`/`flex-grid-gap-*` del core propio, o cualquier `flex` con `flex-basis` en %, incluyendo un `grid`/`grid-cols` de Tailwind si el proyecto lo usa):** ese hijo necesita `min-w-0` (o `min-width:0`) explícito. Sin eso, el ítem flex/grid se expande para acomodar el ancho intrínseco del contenido de Swiper en vez de respetar su `flex-basis`/columna, y el navegador puede terminar clampeando a un ancho absurdo (`33554432px` en Chromium — su `LayoutUnit::Max()`) en vez de simplemente desbordar. Caso real, CAFEXPORT 2026-08-05, `components/accordion-gallery.php`: un slider en la segunda columna de un `flex-grid md:flex-grid-2` se veía con esa medida hasta agregar `min-w-0` a la columna.
- **Estilos de navegación/paginación van en `tailwindcss/libraries/_swiper.css`, no inline por slider** (ver `tw-design-system` `philosophy.md §13`): si el look son botones/bullets "overlay" sobre imagen (circulares, semitransparentes), definirlos ahí como clases reutilizables (`.swiper-button-overlay`, `.swiper-pagination-overlay`) y aplicarlas en el markup del Paso 3, en vez de repetir la lista de utilidades en cada componente nuevo. Ojo con el ícono SVG custom dentro de `.swiper-button-prev/next`: `swiper/css/navigation` fuerza `svg{fill:currentColor}` sobre cualquier SVG hijo — un ícono pensado solo-stroke (`fill="none"` en el atributo) necesita el override `fill-none` explícito en esa misma regla de `_swiper.css`, porque el atributo de presentación SVG siempre pierde contra CSS de autor.

### Paso 5 — Crear `js/components/swiper-{slug}.js`

1. `import { SwiperManager } from '../libraries/swiper'`.
2. Si necesitás módulos extra de Swiper (efectos, etc.), importarlos de `'swiper/modules'` y **listarlos completos** en `customConfig.modules` (incluyendo `Navigation`/`Pagination`/`Autoplay` si los seguís necesitando — ver gotcha del merge superficial arriba).
3. Selector: `'.js-swiper-{slug}'` (debe matchear la clase puesta en el Paso 3).
4. Config específica del slider: `effect`, `coverflowEffect`/`fadeEffect`, `autoplay`, `breakpoints`, `loop`, `speed`, `spaceBetween` o `slidesPerView`/`slidesPerGroup` — copiar el estilo de los ejemplos en `references/code-patterns.md` según se parezca más a `slider-main` (efecto + autoplay + nav custom) o `slider-category` (grid responsivo simple vía breakpoints).
5. Si es navegación custom (Paso 4), agregar el hook `on: { init() {...} }` que ata los botones a `swiper.slidePrev()`/`swiper.slideNext()` (ver referencia sección 1.2) — **no** poner esos botones custom en `customConfig.navigation.nextEl/prevEl`, eso solo aplica a `.swiper-button-next/prev`.

### Paso 6 — Registrar en `js/index.js`

Agregar el `import './components/swiper-{slug}'` correspondiente — si no se importa ahí, Vite nunca lo incluye en `assets/js/theme.js` y el slider no se inicializa en el sitio, aunque el archivo exista.

### Paso 7 — Conectar y verificar

1. Insertar `get_template_part('components/{slug}');` en la plantilla destino (home, category, single, etc.), respetando el wrapper/orden que ya usen los componentes vecinos (ver convención `decorated-section` u otras si aplica).
2. Correr `npm run dev` (o `npm run build` si es verificación final) desde la carpeta del tema.
3. Verificar visualmente que: el slider inicializa, la paginación aparece solo en viewport ≥720px, la navegación (estándar o custom) funciona, y — si hay `loop`/`autoplay` — que no rompe con pocas slides (Swiper con `loop: true` necesita un mínimo de slides mayor a `slidesPerView` para no comportarse raro; si el contenido real puede ser corto, avisar al usuario en vez de asumir que siempre va a haber suficientes slides).

---

## Cuándo preguntar vs. cuándo asumir

**Preguntar siempre:**
- Origen de contenido si no es obvio (Ruta A vs. Ruta B, Paso 1).
- Si el diseño no deja claro si la navegación es estándar o custom (Paso 4).
- Si hay que crear un grupo de campos SCF nuevo y el usuario no aclaró si ya lo tiene armado (delegar a `wp-scf-component-builder`).

**Asumir con la convención por defecto (avisando que se asumió):**
- Clase JS `.js-swiper-{slug}` = mismo slug que el nombre del componente PHP.
- Navegación estándar (`.swiper-button-prev/next` + auto-wiring) salvo que el diseño pida botones con posición/estilo propio.
- Reutilizar una card existente (`cards/post-card.php` u otra ya usada en el proyecto) para la Ruta B en vez de crear una nueva, salvo que el diseño la requiera visualmente distinta.
