# Patrones de código — WP Swiper Slider Builder

Ejemplos reales tomados del tema `hello-elementor-depura` (CAFEXPORT). Usar como plantilla, no copiar literal si el slug/diseño cambia.

---

## 1. `js/libraries/swiper.js` — el wrapper `SwiperManager` (no se modifica por cada slider)

```js
import Swiper from 'swiper'
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'

export class SwiperManager {
  constructor(selector, customConfig = {}, slidesPerView = 1) {
    this.selector = selector
    this.slidesPerView = slidesPerView

    this.defaultConfig = {
      modules: [Navigation, Pagination, Autoplay, EffectFade],
      slidesPerView: this.slidesPerView,
      slidesPerGroup: this.slidesPerView,
      spaceBetween: 10,
      autoplay: false,
      pagination: false,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      lazy: true,
      simulateTouch: true,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
    }

    this.config = { ...this.defaultConfig, ...customConfig }
    this.init()
  }

  init() {
    const elements = document.querySelectorAll(this.selector)
    if (!elements.length) return
    this.instances = []

    const enablePagination = window.innerWidth >= 720

    elements.forEach((el) => {
      const pagination = el.parentElement.querySelector('.swiper-pagination')
      const nextBtn = el.parentElement.querySelector('.swiper-button-next')
      const prevBtn = el.parentElement.querySelector('.swiper-button-prev')

      const config = {
        ...this.config,
        pagination: enablePagination
          ? { el: pagination, clickable: true }
          : false,
        navigation: {
          ...this.config.navigation,
          nextEl: nextBtn,
          prevEl: prevBtn,
        },
      }

      const instance = new Swiper(el, config)
      this.instances.push(instance)
    })
  }
}
```

Notas clave (ver SKILL.md para el detalle de por qué importan):
- `{ ...this.defaultConfig, ...customConfig }` es spread superficial → `customConfig.modules` reemplaza, no extiende.
- `pagination`/`swiper-button-next`/`swiper-button-prev` se buscan como `el.parentElement.querySelector(...)`, es decir **hermanos directos del `.swiper` en el DOM**, no descendientes internos.
- La detección de pagination por ancho de viewport (`>= 720`) se evalúa una sola vez al `init()`, no es reactiva.

### 1.1 — Instancia simple con breakpoints (patrón `slider-category`)

```js
import { SwiperManager } from '../libraries/swiper';

const sliderCategory = new SwiperManager('.js-swiper-slider-category', {
    grabCursor: true,
    spaceBetween: 18,
    loop: true,
    speed: 900,
    pagination: false,
    breakpoints: {
        960: { slidesPerView: 2, slidesPerGroup: 2 },
        1200: { slidesPerView: 3, slidesPerGroup: 3 },
    }
})
```

Usar esta forma cuando el slider es un grid responsivo simple (N columnas según breakpoint), sin efectos ni autoplay ni navegación custom.

### 1.2 — Instancia con efecto, autoplay y navegación custom (patrón `slider-main`)

```js
import { SwiperManager } from '../libraries/swiper';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

const sliderMain = new SwiperManager('.js-swiper-slider-main', {
    modules: [EffectCoverflow, Pagination, Autoplay], // OJO: reemplaza modules default, deja fuera Navigation a propósito
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    speed: 900,
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
        waitForTransition: true,
    },
    coverflowEffect: {
        rotate: 30,
        stretch: 80,
        depth: 100,
        modifier: 1,
        slideShadows: true,
    },
    breakpoints: {
        2000: { loop: false },
    },
    on: {
        init: function() {
            const swiper = this;
            const prevBtn = document.querySelector('.custom-prev');
            const nextBtn = document.querySelector('.custom-next');

            if (prevBtn) prevBtn.addEventListener('click', () => swiper.slidePrev());
            if (nextBtn) nextBtn.addEventListener('click', () => swiper.slideNext());
        }
    }
})
```

Usar esta forma cuando el diseño pide un efecto (coverflow, fade, etc.) y/o botones de navegación con posición/estilo fuera de la caja estándar `.swiper-button-prev/next`. Los botones custom se atan a `swiper.slidePrev()/slideNext()` (API core, no depende del módulo `Navigation`) dentro de `on: { init }`.

### 1.3 — Variantes mínimas de referencia (`swiper-test.js`)

```js
import { SwiperManager } from '../libraries/swiper';

// Hero de un solo slide visible (pantalla completa)
const heroSlider = new SwiperManager('.hero-slider', {
  loop: true,
  speed: 800,
});

// N slides visibles con pagination/navigation estándar
const sliderMultiple = new SwiperManager('.js-slider-plus', {
    loop: true,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
}, 3) // <- 3er argumento: slidesPerView = slidesPerGroup = 3
```

Buen punto de partida para copiar/pegar cuando el slider no necesita nada especial: elegir el patrón de un solo slide (hero) o de N slides con nav/pagination estándar según el caso.

**Peligro real, no solo teórico: si `swiper-test.js` (u otro archivo de scaffold/prueba) queda importado en `js/index.js` de un proyecto real, sus selectores genéricos (`.hero-slider`, `.js-slider-plus`) pueden chocar con la clase real de un componente nuevo.** Caso real CAFEXPORT, 2026-07-23: el componente real `hero-slider.php` genera un `<section class="hero-slider ...">` (la clase sale de `$class_name`, es el nombre natural del componente) — y `swiper-test.js` instanciaba OTRO `SwiperManager('.hero-slider', ...)` apuntando exactamente a esa misma `<section>` (no al `.swiper` real que hay adentro). Resultado: un segundo Swiper roto montado sobre el contenedor equivocado, sin `.swiper-pagination`/`.swiper-button-next/prev` en el lugar que `SwiperManager` espera (hermanos de `.swiper` dentro de `el.parentElement`) → el mismo crash `Uncaught TypeError: getComputedStyle... parameter 1 is not of type 'Element'` documentado como "regla dura" más abajo (Paso 4 del flujo), pero causado por un selector fantasma en vez de markup faltante. Antes de dar un slider nuevo por terminado, `grep -rn "new SwiperManager" js/components/` y confirmar que ningún OTRO archivo (sobre todo uno de prueba/scaffold) apunta a un selector que coincida con la clase del componente nuevo. Si `swiper-test.js` no se está usando activamente, lo más seguro es sacar su `import` de `js/index.js` en vez de dejarlo wireado "por si sirve de ejemplo".

---

## 2. `components/{slug}.php` — Ruta A: repeater SCF (patrón `slider-main`)

```php
<?php
$class_name = 'slider-main';
$class_card = $class_name . '-card';

if (get_field($class_name)): ?>
    <section class="<?php echo $class_name ?> relative h-full text-sm text-white m-0 p-0 pt-6">
        <div class="swiper js-swiper-<?php echo $class_name ?> w-full pb-15">
            <div class="swiper-wrapper">
                <?php
                while (have_rows($class_name)): the_row();
                    get_template_part('cards/' . $class_card, NULL, [
                        'class_name' => $class_name,
                    ]);
                endwhile; ?>
            </div>
            <div class="swiper-pagination [&_.swiper-pagination-bullet-active]:bg-secondary-dk bottom-6"></div>

            <!-- Botones custom: fuera del flujo estándar, se wirean a mano en el JS (ver 1.2) -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex justify-between pointer-events-none">
                <button class="custom-prev pointer-events-auto"> <!-- icono prev --> </button>
                <button class="custom-next pointer-events-auto"> <!-- icono next --> </button>
            </div>
        </div>
    </section>
<?php endif ?>
```

Puntos a respetar:
- `$class_name` se define una vez; `$class_card` se deriva de ahí, nunca hardcodeado.
- El `<section>` entero está guardado por `if (get_field($class_name)):` — si el campo (repeater) está vacío, no se imprime nada.
- Cada `the_row()` delega el markup de la card a `cards/{slug}-card.php`, pasándole `$class_name` para que la card también pueda derivar sus propias clases BEM.

---

## 3. `components/{slug}.php` — Ruta B: WP_Query de posts (patrón `slider-category`)

```php
<?php
extract($args);
$class_name = 'slider-category';

if (!isset($category)) {
    return;
}

$query_args = array(
    'cat' => $category->term_id,
    'post_status' => 'publish',
    'posts_per_page' => -1,
);

$posts_query = new WP_Query($query_args);

if (!$posts_query->have_posts()) {
    return;
}
?>

<section class="<?php echo $class_name ?> py-9 sm:py-15 md:py-21">
    <div class="container relative">
        <div class="swiper js-swiper-<?php echo $class_name ?> js-swiper-<?php echo $class_name . '-' . $category->slug; ?> md:mx-9 lg:mx-15">
            <div class="swiper-wrapper">
                <?php while ($posts_query->have_posts()) : $posts_query->the_post(); ?>
                    <div class="swiper-slide">
                        <?php get_template_part('cards/post-card'); ?>
                    </div>
                <?php endwhile; ?>
            </div>
        </div>
        <div class="swiper-pagination [&_.swiper-pagination-bullet-active]:bg-secondary-dk -bottom-px-50"></div>
        <div class="swiper-button-prev ...">...</div>
        <div class="swiper-button-next ...">...</div>
    </div>
</section>

<?php wp_reset_postdata(); ?>
```

Puntos a respetar:
- Guard temprano con `return` (no `if/endif` envolviendo todo) cuando dependés de datos externos (`$category`) y de un `WP_Query` que puede no tener resultados.
- Clase de instancia única (`js-swiper-{slug}-{term-slug}`) además de la clase general — útil si en el futuro hay que targetear un slider puntual, aunque el `SwiperManager` actual instancia todos los que matcheen la clase general vía `querySelectorAll`.
- `wp_reset_postdata()` siempre después de un `WP_Query` custom que usa `the_post()`.
- Reutiliza `cards/post-card.php` (card ya existente en el proyecto) en vez de crear una card nueva — solo crear una card dedicada si el diseño la requiere visualmente distinta a la ya existente.
