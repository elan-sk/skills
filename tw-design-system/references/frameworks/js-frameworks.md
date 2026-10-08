# Instalación en React / Vite SPA / Next.js / Tauri

## Modelo unificado: por defecto, SIEMPRE `assets/core/` (con plugins JS)
Los `@plugin "./archivo.js"` de Tailwind v4 corren en build time sobre cualquier pipeline con Node (Vite, PostCSS, Next.js, Tauri con Vite) — no son algo específico de WordPress. Por lo tanto, **el modelo por defecto para React/Vite/Next.js/Tauri es el mismo `assets/core/` completo** (contraste WCAG calculado en `plugins/functions.js`, links, logos y botones que se adaptan solos a los fondos oscuros vía `dark-bg-variants.js` y la variante `--alt`), igual que en WordPress. No usar una versión distinta "porque es React" — el framework no es la razón para simplificar.

Si hay que editar `dark-bg-variants.js`/`text-colors.js` o escribir un plugin JS similar (no específico de WordPress, aplica en cualquier framework con este motor): ver `references/philosophy.md §11.2` y `§11.3` — Tailwind v4 duplica el `!important` si se escribe como texto dentro de un valor de `addComponents`/`addUtilities` (rompe el build), y puede optimizar fuera de `:root` la variable `--color-{rol}` de un color de theme si la clase real nunca se usa (el estilo queda inválido en silencio). Usar variables CSS heredables con valores literales del objeto JS, nunca `var(--color-on-X)` a ciegas dentro de un plugin.

## `assets/core-simple/` — solo como fallback, no como default
Existe una variante sin `plugins/` (confirmada en un proyecto Tauri real, "PrecioJusto") con colores y mapeo `on-*` escritos a mano. Usarla únicamente si:
- El proyecto tiene una razón técnica real para no poder ejecutar plugins JS de Tailwind en su build (poco común — Vite, Next.js y Tauri corren Node sin problema, así que en la práctica casi nunca aplica).
- El proyecto YA la tiene instalada (no migrar sin que el usuario lo pida).
- El usuario pide explícitamente algo más simple de mantener sin JS.

Si no hay ninguna de esas razones, usar siempre `assets/core/`, aunque el proyecto sea una app de escritorio o dashboard.

## Roles de color y superficies extra
Igual que antes: el núcleo `primary/secondary/tertiary` (×`-dk`/`-lt`) + `background/surface/outline` es fijo. Los roles de mensaje (`info` vs `warning`) y superficies extra para apps tipo shell (`panel`, `dark`, `sidebar`) se adaptan al tipo de proyecto sin ser excepción — y con el modelo unificado, se agregan igual a `plugins/variables.js` (no a un CSS plano), manteniendo la misma fuente de verdad de contraste vía `functions.js` en todos los frameworks.

### `textBasic` (negro/blanco) — confirmado en producción
El proyecto real ya sigue exactamente la regla acordada: `--color-black: #28201A` con el comentario *"oscuro cálido (reemplaza negro puro)"* — nunca usar `#000000`/`#ffffff` puros salvo que el diseño lo pida explícitamente.

### Tipografía: clamp() es para web responsive, no para apps de escritorio
En el proyecto Tauri (ventana de tamaño conocido, ej. 1280×760) la escala tipográfica es en **px fijos**, no `clamp()` — la regla de "todo en clamp/responsive" del core original aplica a sitios web públicos con viewport variable. En apps de escritorio con tamaño de ventana controlado, usar valores fijos es correcto; no forzar `clamp()` ahí. Para Next.js/React SPA de sitio público sí seguir usando `clamp()` como en el core original.

Slots de fuente: lo ideal son los 3 (`font-serif/sans/mono`), pero si el proyecto no necesita títulos display distintos (ej. una app de escritorio con un solo estilo tipográfico para todo), es válido definir solo `font-sans` y `font-mono` y omitir `font-serif` — no fabricar un uso de serif que el diseño no pide.

### Sizing: dos sistemas disponibles, no son excluyentes
- `utilities/_sizes-rem-px.css` — conversión directa px→rem (`w-px-*`, `p-px-*`, etc.), igual que en el core de WP.
- `utilities/_sizes-rem-spacing.css` — escala nombrada de spacing (`--sp-1...--sp-32`) con utilidades `w-sp-*`, `p-sp-*`, `gap-sp-*`, etc. Preferir esta cuando el proyecto quiere una escala de espaciado consistente y limitada (como la escala nativa de Tailwind pero con más pasos); usar `*-px-*` para casos puntuales fuera de la escala.

### Atoms de ejemplo vs. atoms genéricos
En el proyecto real, `atoms/_badges.css`, `_cards.css`, `_banners.css`, `_forms.css`, `_table.css` son componentes **propios del proyecto PrecioJusto** (clases con nombres de marca como `.stat-card`, `.price-box`, `.hist-card`) — sirven como **ejemplo del patrón** a seguir (base class en `@layer components` + variantes con `@apply` sobre los roles de color del proyecto), NO se copian tal cual a un proyecto nuevo. Lo único genérico y reusable sin cambios es: `_buttons.css` (estructura, no los colores hardcodeados de PrecioJusto), `_base.css`, los `settings/*`, y las `utilities/*`.

## Estructura de carpetas (ambas variantes)

```
src/
├── styles/            → EL CORE (Variante A o B)
│   ├── atoms/ bases/ libraries/ settings/ utilities/ [plugins/ solo Variante A]
│   └── index.css
├── components/ pages/ hooks/ stores/ i18n/ database/ types/ assets/
```

## Instalación — pasos comunes

1. Copiar `assets/core/` (modelo unificado por defecto) a `src/styles/`. Solo usar `assets/core-simple/` si aplica alguna de las excepciones de arriba.
2. Confirmar que el entry principal (`main.jsx`/`main.tsx`, o `app/globals.css` en Next) importe `src/styles/index.css`.
3. Tailwind v4 build: **revisar qué usa el proyecto antes de asumir** — el proyecto real ("preciojusto", Tauri) usa `@tailwindcss/postcss` + `postcss.config.js` + `autoprefixer`, NO el plugin `@tailwindcss/vite`. Seguir la convención que el `package.json` ya tenga; solo si es un proyecto nuevo sin nada instalado, `@tailwindcss/vite` es la opción más simple para Vite/React/Tauri, y `@tailwindcss/postcss` para Next.js.
4. Actualizar `settings/_background-colors.css` (o `plugins/variables.js` en Variante A) y `settings/_typography.css` según el diseño importado.
5. Fuentes:
   - **Next.js**: usar `next/font/google`, un archivo `fonts.ts` con un export por familia (`fontSerif`, `fontSans`, `fontMono`), cada uno con `variable: "--font-serif"` (etc.) y los `weight`/`style` que pida el diseño. Aplicar las clases `variable` de cada fuente en el `<html>` o `<body>` del `layout.tsx` raíz para que las CSS vars queden disponibles, y que `settings/_typography.css` las use vía `--font-serif: var(--font-serif)` etc. dentro de `@theme`.
   - **Vite/React/Tauri**: `@import` de Google Fonts en `settings/_typography.css` (o el archivo de fuentes correspondiente) funciona SOLO si ese `@import` termina siendo la primera declaración del CSS compilado final — si `index.css` importa `"tailwindcss"` u otros partials antes que el archivo de fuentes, el `@import` queda en una posición inválida y el navegador lo ignora sin error. Verificar el orden real en `index.css` antes de asumir que funciona; si no es el primero, usar un `<link>` en el `index.html` (Vite/React) o `next/font`/`<link>` en el `<head>` (Next.js) en su lugar. O fuentes locales si el proyecto no tiene acceso a internet en runtime (caso Tauri offline).
6. Generar la página/componente de test — ver `references/test-page.md`.

## Tauri
Frontend embebido (React/Vite) — se instala igual que React/Vite normal. Si es una app de escritorio con ventana de tamaño acotado, usar Variante B (core-simple) y tipografía en px fijos por defecto, salvo que el usuario diga que sí necesita responsive real (ventana redimensionable con layouts muy distintos).

## Otros CMS (Drupal, Wagtail, etc.)
Sin convención confirmada aún. Preguntar: (a) dónde vive el entry CSS del theme/template actual, (b) qué build tool usan, (c) si el CMS permite añadir clases dinámicamente vía plantillas (para decidir si hace falta safelist). Con esa info, replicar el mismo patrón: copiar `styles/`, apuntar el entry, regenerar safelist si aplica.

