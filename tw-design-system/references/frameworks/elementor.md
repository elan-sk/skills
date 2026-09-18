# Duplicar el core a Elementor (Variables + Global Classes)

Cuando el proyecto usa **Elementor** como editor visual (además del stack Vite/Tailwind del core — típico en WordPress con páginas mixtas: unas armadas por código, otras con libertad total en Elementor vía un bloque "libre" embebido en un layout de Flexible Content), el usuario puede pedir que los mismos tokens del core (colores, escala tipográfica, botones) estén disponibles **nativamente en el Design System de Elementor** (Variables + Global Classes, Elementor 4.x), para que un editor sin acceso al código pueda elegir "primary-dk" o aplicar la clase "text-h1" desde el propio panel de Elementor.

Esto es un **destino de instalación más** (como WordPress+Vite o React/Vite), no un reemplazo del core — el core sigue siendo la fuente de verdad; esto es una réplica dirigida a otro consumidor.

## Por qué NO por UI (Chrome DevTools / clicks)

**Confirmado empíricamente (CAFEXPORT, 2026-08-14): la UI del Design System de Elementor es poco confiable para esto vía automatización de navegador.** El selector de "Font family" (un `Autocomplete` de MUI) mostraba visualmente el valor elegido pero **no disparaba el evento real que marca el campo como modificado** — se probó click simple, doble click, y selección por teclado (escribir + flecha + Enter); el "Save changes" seguía deshabilitado y el valor no persistía. Los inputs de texto (colores, nombres) sí funcionaron bien con clicks/eventos sintéticos — el problema es específico de controles tipo Autocomplete/combobox complejos.

**La vía confiable es siempre PHP directo** (WP-CLI `wp eval-file` en local, o la capacidad de ejecución PHP del entorno si es remoto) usando las propias clases/APIs de Elementor — nunca reconstruir el JSON a mano contra la tabla sin pasar por la API donde exista (`Global_Classes_Repository`), y nunca simular clicks para esto.

## 1. Colores y fuentes → `_elementor_global_variables`

Viven en un solo postmeta del Kit activo (`get_option('elementor_active_kit')`, típicamente post ID pequeño, título "Default Kit"):

```php
$kit_id = get_option('elementor_active_kit');
$data = json_decode(get_post_meta($kit_id, '_elementor_global_variables', true), true);
// { "data": { "e-gv-<hash7>": {...} }, "watermark": 1, "version": 2 }
```

Cada variable:
```php
'e-gv-<hash7>' => [
    'label' => 'primary-dk',
    'value' => ['$$type' => 'color', 'value' => '#00240B'],   // o ['$$type' => 'string', 'value' => 'Fraunces'] para fuentes
    'type' => 'global-color-variable',                          // o 'global-font-variable'
    'order' => 1,
    'created_at' => current_time('mysql'),
    'updated_at' => current_time('mysql'),
]
```

Escribir con `update_post_meta($kit_id, '_elementor_global_variables', wp_slash(json_encode($data)))` — no hay API pública de más alto nivel para variables (a diferencia de las clases, ver abajo). Mapear 1:1 los roles de `plugins/variables.js` (colores) y `settings/_fonts.css` (familias) del core.

**Gotcha real:** el picker de fuentes de la UI puede dejar el valor "a medio guardar" (visualmente correcto, no persistido) si se llegó a tocar desde el navegador antes. Para corregirlo, no reintentar en la UI — leer el JSON actual, corregir el campo `value.value` del label afectado, y volver a escribir el postmeta completo.

## 2. Tipografía y botones → Global Classes (`Global_Classes_Repository`)

A diferencia de las variables, las Global Classes SÍ tienen una API pública (módulo `Elementor\Modules\GlobalClasses`, namespace real, requiere que el plugin esté cargado — funciona bien desde `wp eval-file`):

```php
use Elementor\Modules\GlobalClasses\Global_Classes_Repository;

$repo = Global_Classes_Repository::make();
$repo->put($items, $order); // $items: [class_id => class_data], $order: [class_id, ...]
```

### Forma de `$items[$class_id]`

```php
[
    'id' => $class_id,        // string libre, ej. 'e-' + 7 hex chars
    'label' => 'text-h1',      // el nombre real de la clase CSS — 2-50 chars, sin espacios, sin empezar con dígito
    'type' => 'class',
    'variants' => [
        [
            'props' => [ /* ver tabla de props abajo */ ],
            'meta' => ['breakpoint' => 'desktop', 'state' => null],  // o 'mobile'/'tablet'/'laptop'/'widescreen', y 'hover'/'active'/'focus'/'e--selected'/'e--disabled'
            'custom_css' => null,
        ],
        // una entrada de 'variants' por cada combinación breakpoint+state que se necesite
    ],
]
```

### Props válidas (schema real, `Elementor\Modules\AtomicWidgets\Styles\Style_Schema::get_style_schema()`)

Cada valor es `['$$type' => <tipo>, 'value' => <...>]`:

| Prop CSS | `$$type` | `value` |
|---|---|---|
| `color`, `border-color`, `outline-color` | `color` | string hex (`'#00240B'`) |
| `font-family` | `font-family` | string (`'Fraunces'`) |
| `font-weight`, `border-style`, `text-align`, etc. | `string` | string (weight como `'400'`/`'500'`, no número) |
| `font-size`, `line-height`, `letter-spacing`, `border-width`, `border-radius`, `width`/`height`/etc. | `size` | `['size' => <num>, 'unit' => 'px'\|'rem'\|'em'\|'%'\|'custom'\|...]` |
| `padding`, `margin` | `dimensions` | `['block-start' => <size>, 'inline-end' => <size>, 'block-end' => <size>, 'inline-start' => <size>]` (cada uno un objeto `size` completo) |
| `background` | `background` | `['color' => <objeto color>]` (para fondo sólido; también admite `background-overlay`, `clip`) |

**`line-height` sin unidad (ej. `1.1`, multiplicador puro):** usar `unit => 'custom'` con `size` como **string** (`'1.1'`, no número) — es el único caso donde `Size_Prop_Type` acepta un valor no numérico.

**Escala responsive con `clamp()` (como usa el core, ver `references/typography-clamp.md`):** Elementor no soporta `clamp()` en estos campos. Traducir a **dos variants**: una `breakpoint: 'desktop'` con el valor máximo del clamp (+ el resto de props: font-family, weight, line-height), y otra `breakpoint: 'mobile'` con **solo** `font-size` al valor mínimo del clamp (las demás props no cambian, no hace falta repetirlas).

### Ejemplo mínimo (una clase de texto completa)

```php
function size($size, $unit = 'px') { return ['$$type' => 'size', 'value' => ['size' => $size, 'unit' => $unit]]; }
function color_val($hex) { return ['$$type' => 'color', 'value' => $hex]; }
function font_family($name) { return ['$$type' => 'font-family', 'value' => $name]; }
function str_val($v) { return ['$$type' => 'string', 'value' => $v]; }

$id = 'e-' . substr(md5(uniqid('', true)), 0, 7);
$items = [$id => [
    'id' => $id, 'label' => 'text-h1', 'type' => 'class',
    'variants' => [
        ['props' => [
            'font-family' => font_family('Fraunces'),
            'font-weight' => str_val('400'),
            'font-size' => size(57.6),
            'line-height' => size('1.1', 'custom'),
        ], 'meta' => ['breakpoint' => 'desktop', 'state' => null], 'custom_css' => null],
        ['props' => ['font-size' => size(36.8)], 'meta' => ['breakpoint' => 'mobile', 'state' => null], 'custom_css' => null],
    ],
]];
Global_Classes_Repository::make()->put($items, [$id]);
```

### Botones: solo aproximación estática — decirlo explícitamente al usuario

El sistema de botones típico del core (`atoms/_buttons.css`) suele incluir cosas que Global Classes **no puede reproducir**: animación de "pop" en hover vía `::before`, detección automática de fondo oscuro por JS (cambia de variante según la sección donde cae), flechas SVG animadas. Con Global Classes solo se logra: color de fondo/texto/borde en reposo, un único estado `hover` con sus propios colores, `border-radius`/`border-width`/`padding`. **Avisar esto antes de construir los botones**, no presentarlo como réplica 1:1.

Ejemplo de fondo sólido + hover:
```php
$items[$id] = ['id' => $id, 'label' => 'btn-primary', 'type' => 'class', 'variants' => [
    ['props' => [
        'background' => ['$$type' => 'background', 'value' => ['color' => color_val('#00240B')]],
        'color' => color_val('#FFFCF9'),
        'border-color' => color_val('#00240B'),
        'border-width' => size(3),
        'border-style' => str_val('solid'),
        'border-radius' => size(8),
        'padding' => ['$$type' => 'dimensions', 'value' => [
            'block-start' => size(12), 'inline-end' => size(42),
            'block-end' => size(12), 'inline-start' => size(42),
        ]],
    ], 'meta' => ['breakpoint' => 'desktop', 'state' => null], 'custom_css' => null],
    ['props' => [
        'background' => ['$$type' => 'background', 'value' => ['color' => color_val('#67800E')]],
        'border-color' => color_val('#67800E'),
    ], 'meta' => ['breakpoint' => 'desktop', 'state' => 'hover'], 'custom_css' => null],
]];
```

## Gotchas transversales

- **"Custom Fonts" (subir un archivo de fuente propio) es función de Elementor Pro** — si una fuente del core no está en el catálogo interno de Google Fonts que usa el picker de Elementor (caso real: Parkinsans, fuente reciente no indexada todavía), no hay forma de enqueuearla en el plan free vía este mecanismo. Avisar al usuario y preguntar si prefiere dejarla pendiente, usar una fuente similar del catálogo como aproximación, o confirmar que el proyecto va a pasar a Pro.
- **La UI del editor cachea labels/order en memoria de la sesión.** Después de escribir por PHP, hace falta recargar la pestaña del editor de Elementor para que el panel Design System (Variables/Classes) refleje los cambios. El modal "Class Manager" muestra ejemplos genéricos (`btn-accent`, `primary-headline`...) cuando *cree* que no hay clases todavía — no es una lista real, no dejarse engañar por eso; si aparece con la sesión recién cargada, recargar la página primero antes de concluir que algo falló.
- **Verificar siempre contra la base de datos real, no contra el estado de la UI ni contra el propio `echo` del script.** Hubo un caso real donde el script imprimió "creadas 13 clases" sin ninguna excepción, pero `_elementor_global_classes_order` había quedado vacío (fallo transitorio no diagnosticado — al reintentar el mismo script sin cambios, persistió bien). Después de cualquier escritura: releer `_elementor_global_classes_order`/`_elementor_global_classes_labels` (clases) o `_elementor_global_variables` (variables) con una consulta fresca, y si es posible, aplicar la clase a un elemento real y comparar `getComputedStyle()` en el navegador contra los valores esperados — esa es la única confirmación verdaderamente concluyente.
- **Para replicar lo mismo en un sitio remoto** (staging/pruebas en otro servidor): usar el mismo PHP, ejecutado a través de la vía de ejecución remota disponible (ej. una integración MCP con capacidad de ejecutar PHP) — no reconstruir el flujo por HTTP/REST ni por UI. Confirmar primero con el usuario si el sitio remoto es realmente de pruebas o podría ser producción antes de escribir nada ahí (ver reglas generales de acciones irreversibles).
