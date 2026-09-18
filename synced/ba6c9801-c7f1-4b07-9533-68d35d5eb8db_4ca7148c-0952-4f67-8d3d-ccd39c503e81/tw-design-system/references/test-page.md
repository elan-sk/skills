# Página/plantilla de prueba visual

Regla general: NUNCA generar un CSS adicional para mostrar la prueba. Se genera una plantilla/componente real del proyecto que usa las clases del core tal cual se usarían en producción. Secciones fijas, en este orden (igual al ejemplo real de ELAN-SK):

1. **Colors** — círculos de color por grupo (Primaries, Secondaries, Tertiaries, Backgrounds, Messages), cada uno mostrando su clase `bg-{color}`.
2. **Typography** — familias (`font-serif/sans/mono`) + escala completa (`text-h1...text-small`) con el nombre de la clase visible.
3. **Text Reset** — un artículo largo de ejemplo (h1-h6, p, ul, ol, blockquote, code/pre, tabla, links) para verificar `bases/_base.css`.
4. **Buttons** — matriz: cada fondo posible (`background/surface/outline/primary(-dk/-lt)/secondary.../error`) × cada variante de botón (`btn-primary/secondary/tertiary`, + link `a`), para confirmar que el contraste automático funciona en cualquier combinación.

## WordPress

Usar el patrón exacto de `assets/wp-test-template/` (ya extraído de un proyecto real del usuario):
- `test-template.php` — Page Template que hace `get_template_part('test/test-colors')`, etc. En el theme va en la raíz o en `page-templates/`.
- `test-colors.php`, `test-typography.php`, `test-reset.php`, `test-buttons.php` — van en una carpeta `test/` dentro del theme, cada una con su sección.
- Copiar estos 5 archivos tal cual como base y solo ajustar los arrays de colores (`render_color_circle(...)`, `$colors`/`$buttons` en `test-buttons.php`) si el proyecto agregó un rol de color excepcional.
- Crear la página en WP con ese template asignado (o indicarle al usuario que la cree y seleccione "test typography" como template) para poder verla.
- Importante: el `<div class="btn-primary btn-secondary btn-tertiary hidden"></div>` al inicio de `test-buttons.php` existe para forzar que Tailwind compile esas clases (JIT scanner) — mantenerlo.
- **`test-typography.php` trae los nombres de fuente por defecto de la skill escritos como texto literal** (`Crimson Pro`, `Inter`, `RobotoMono` en la sección "Fonts Families", dentro de `<p class="font-serif">Crimson Pro</p>` etc.) — son solo texto de ejemplo, NO se actualizan solos al cambiar `settings/_fonts.css`. Si el diseño importado usa fuentes distintas (caso normal), actualizar ese texto al nombre real de cada fuente elegida (ej. "Fraunces", "Plus Jakarta Sans") en el mismo paso en que se edita `_fonts.css` — si no, la clase aplica la fuente correcta pero la etiqueta visible miente sobre cuál es.
- Si el core no traía `text-h4/h5/h6` (versión vieja de la skill, antes de que se agregaran — ver `settings/_typography.css`), agregarlos y sumar las filas correspondientes en la sección "Fonts Sizes" de `test-typography.php` (`Título H4/H5/H6`) — no dejar la jerarquía cortada en H3.

## React / Next / Vite / Tauri

Confirmado con un proyecto real: **`assets/react-next-test-template/`** trae la plantilla completa lista para adaptar — `page.jsx` + `components/Colors/`, `components/Buttons/`, `components/Typography.jsx`, `components/Reset.jsx`. Usarla como base siempre, solo:
- Actualizar los arrays de colores dentro de `ColorsSection.jsx`/`ButtonSection.jsx` si el proyecto agregó roles extra (`panel`, `dark`, etc.).
- Quitar `SliderTest.jsx`/`GsapTest.jsx` si el proyecto no usa Swiper/GSAP (son específicos de ese proyecto, no parte del patrón genérico).
- Ajustar el import/ubicación según sea Next.js App Router (`app/style-guide/page.jsx` + su propio `layout.tsx`) o React Router (una ruta cualquiera, ej. `/dev/style-guide`).

Detalle importante del patrón real: cada texto de clase mostrado (`.bg-primary`, `.btn-primary`, `.text-h1`, etc.) tiene una clase `test-copy` con un listener que copia el nombre de la clase al portapapeles al hacer click (ver el `useEffect` en `page.jsx`) — mantener ese comportamiento, es parte de la experiencia de la página de prueba, no solo texto estático.

No usar `dangerouslySetInnerHTML` ni strings de HTML como en PHP — es JSX real, respetando la filosofía (`span` dentro de botones, `gap-y-*` en los grids, etc.), tal como está en la plantilla de referencia.
