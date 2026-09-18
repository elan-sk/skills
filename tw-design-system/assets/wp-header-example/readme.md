# Header de referencia — WordPress

Ejemplo real (proyecto CAFEXPORT) de un header completo con el core TWCSS
de ELAN-SK, sticky + hide-on-scroll, CTA configurable desde wp-admin, y
un modal de búsqueda en React desacoplado de otros módulos JS. **Específico
de WordPress** — no aplica tal cual a React/Next (ahí el "menú de wp-admin"
y `wp_nav_menu()` no existen).

## Archivos

- `header-desktop.php` / `header-mobile.php` — markup del header y del
  overlay de menú mobile. Usan la clase `container-full` (ver
  `settings/_containers.css` del proyecto) para el ancho del header.
- `_header.css` — estilos del header: sticky/hide-on-scroll, tamaño del
  logo, indicador de página activa en el nav.
- `menu.js` — toggle del menú mobile + clase `HeaderScroll` (mostrar/ocultar
  el header según dirección del scroll) + target="_blank" para links
  externos.
- `search-button/` — modal de búsqueda en React (Fuse.js sobre posts de
  WP vía REST API), montado con `ReactDOM.createRoot` y disparado por
  cualquier elemento con `[data-search-trigger]`.
- `functions-snippet.php` — SOLO el registro del menú y el filtro de CTA
  por clase (no es el `functions.php` completo del proyecto).

## Patrones que vale la pena reusar

### 1. Logo izquierda / nav+CTA derecha con `shrink-0` + `flex-1` + `ml-auto`
Ver `references/philosophy.md §14`. Evita el bug de `justify-between` con
3+ hijos (gaps desparejos) y el bug de que el último hijo "salte" al
lado del logo cuando un hermano de en medio se oculta por breakpoint.

### 2. Nunca envolver `the_custom_logo()` en un `<a>` propio
`the_custom_logo()` YA genera su propio `<a class="custom-logo-link">`.
Envolverlo en otro `<a>` produce un `<a>` anidado (HTML inválido) que el
navegador "arregla" solo, dejando el wrapper externo vacío (0×0) y el
logo real como hermano suelto sin la clase que se le quería aplicar.
Solución: usar un `<div>` como wrapper cuando `has_custom_logo()` es
true, y reservar el `<a>` propio solo para el fallback de texto (cuando
no hay logo subido y se renderiza el nombre del sitio a mano).

### 3. El `<img>` del logo subido puede desbordar la fila del header
El logo trae su propio `width`/`height` HTML (los que WordPress registró
al subirlo), que pueden ser más altos que la fila fija del header
(`h-px-72`). Acotar con `.cx-header__logo img { @apply h-px-* w-auto; }`
en vez de asumir que un logo subido por el cliente va a calzar solo.

### 4. CTA del menú por clase CSS, no por posición
En vez de asumir "el último ítem del menú es el CTA" (frágil: se rompe
si el cliente reordena el menú desde wp-admin), usar el campo nativo
"Clases CSS (opcional)" de Apariencia > Menús (hay que activarlo desde
Opciones de pantalla) y leer `$item->classes` en el filtro
`nav_menu_link_attributes`. Cualquier ítem marcado con `menu-cta` se
convierte en botón — el cliente elige cuál, sin plugin y sin tocar código.

### 5. Header hide-on-scroll sin togglear `position`
Si el header ya es `fixed` (no depende de hacerse sticky recién al
scrollear), no hace falta togglear su `position` — alcanza con
`transition-transform` + una clase que aplique `-translate-y-full` según
dirección de scroll (ver clase `HeaderScroll` en `menu.js`).

### 6. Un módulo JS independiente no debe quedar rehén de otro que falla
Todos los módulos de `js/index.js` se compilan en UN solo bundle que se
ejecuta de arriba a abajo. Si un módulo (ej. un slider de Swiper mal
configurado) tira un error síncrono sin capturar, TODO lo que se importe
después en ese archivo nunca llega a ejecutarse — en este proyecto eso
dejó el modal de búsqueda completamente muerto (nunca se inicializaba)
sin que su propio código tuviera ningún bug. Mitigación aplicada: importar
primero, en `js/index.js`, los módulos que no dependen de otros (menú,
buscador) y dejar los sliders/librerías de terceros para después.

### 7. Depurar "no pasa nada al hacer click" con el navegador real, no solo leyendo código
El bug del punto 6 era invisible leyendo el código del buscador (estaba
bien escrito). Solo se confirmó clickeando el botón real y revisando la
consola del navegador (`window.openSearchModal` quedaba `undefined`,
`#search-modal-root` nunca se creaba). Ver también la convención de
memoria "autoevalúa" del usuario: ante un botón/feature que "no hace
nada", probarlo en vivo (Chrome DevTools MCP u otro) antes de asumir por
lectura de código que debería funcionar.
