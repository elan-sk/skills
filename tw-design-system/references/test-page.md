# Página/plantilla de prueba visual (guía de estilos en vivo)

**Para qué sirve:** es la página donde el usuario ve, renderizado con el CSS real del proyecto, todo lo que quedó definido en la guía de estilos (colores, tipografía, reset de etiquetas, botones sobre cada fondo). Vive como una **página real publicada en el sitio** (local y de pruebas), no como un archivo suelto: se entra por URL y se ve con el CSS compilado del proyecto. Es el **punto de control antes de empezar a maquetar**: se arma en el paso 6 del flujo, se le pasa la URL al usuario y no se arrancan componentes hasta que él confirme que se ve bien. Se vuelve a revisar cada vez que cambia algo del core (un color, un clamp, un botón) y es la referencia del markup real de botones (ver `SKILL.md`, guardrail de botones).

Regla general: NUNCA generar un CSS adicional para mostrar la prueba. Se genera una plantilla/componente real del proyecto que usa las clases del core tal cual se usarían en producción. Secciones fijas, en este orden (igual al ejemplo real de ELAN-SK):

1. **Colors** — círculos de color por grupo (Primaries, Secondaries, Tertiaries, Backgrounds, Messages, Text), cada uno con su nombre, su clase `bg-{color}` (o `text-{color}` en el grupo Text) y el **hex real** leído del CSS compilado. El "abc" del círculo toma blanco o negro por contraste WCAG, así se ve de un vistazo qué roles son oscuros.
2. **Typography** — familias (`font-serif/sans/mono`) + escala completa (`text-h1...text-small`) con el nombre de la clase visible.
3. **Text Reset** — un artículo largo de ejemplo (h1-h6, p, ul, ol, blockquote, code/pre, tabla, links) para verificar `bases/_base.css`.
4. **Buttons** — matriz: cada fondo posible (`background/surface/outline/primary(-dk/-lt)/secondary.../error`) × cada botón (`btn-primary/secondary/tertiary`) en una fila con la versión normal y la `--alt` lado a lado, más los links `a` plano y `a--alt`. Sirve para confirmar que en los fondos oscuros la variante `--alt` automática (`philosophy.md §18.2`) se lee bien y que ningún botón desaparece en hover.

**Copiado obligatorio:** todo lo que se muestra para reutilizar se copia con un click al portapapeles (📋 → ✅): el nombre del rol, la clase (`bg-*`, `text-*`, `text-h1`…, `btn-*`, `a--alt`) y el **hex** de cada color. Cada uno lleva la clase `test-copy`; si el texto visible no es exactamente lo que se copia, el valor va en un `<span class="test-copy-hidden">` interno. Al adaptar la plantilla, no quitar ningún `test-copy` ni el `.js-hex-value` de los círculos.

## Nombre y ubicación fijos

En todos los proyectos la página se llama **"Estilos"** y vive en **`/estilos/`**, así siempre se sabe dónde buscarla. Se crea como parte de la instalación del core (paso 5–6 de `SKILL.md`), en el sitio local y en el de pruebas, y al terminar se le pasa la URL al usuario.

## WordPress

Usar el patrón exacto de `assets/wp-test-template/` (ya extraído de un proyecto real del usuario):
- Los 5 PHP van juntos en una carpeta `test/` del theme: `test-template.php` (Page Template "test typography", que hace `get_template_part('test/test-colors')`, etc.) y `test-colors.php`, `test-typography.php`, `test-reset.php`, `test-buttons.php`. WordPress detecta Page Templates en un subdirectorio de primer nivel, así que `test/test-template.php` aparece en el selector de plantillas sin moverlo a la raíz.
- `test.js` → `js/libraries/test.js`, importado en `js/index.js` (`import './libraries/test';`). Hace el copiado al portapapeles de `.test-copy`, escribe el hex real en `.js-hex-value` y da contraste al "abc" de `.js-color-circle`. Sin este archivo la página se ve, pero sin hex ni copiado.
- Los estilos de `.test-copy`/`.copy-icon` y la utility `test` viven en `tailwindcss/utilities/_test.css` del core.
- Copiar estos archivos tal cual como base y solo ajustar los arrays de colores (`render_color_circle(...)`, `$colors`/`$buttons` en `test-buttons.php`) si el proyecto agregó un rol de color excepcional. Si el proyecto tiene una forma de botón propia (ej. flecha en `.btn-tertiary`), agregar ese markup en `render_button_card()` del proyecto, no en la plantilla.
- Crear la página "Estilos" con esa plantilla. Con WP-CLI (en DDEV anteponer `ddev`):
  ```bash
  wp post create --post_type=page --post_title='Estilos' --post_name=estilos --post_status=publish --page_template=test/test-template.php
  ```
  Antes, comprobar que no exista ya (`wp post list --post_type=page --name=estilos`). En el sitio de pruebas, crearla igual (WP-CLI o desde el admin eligiendo la plantilla "test typography") y **pasarle al usuario la URL** para que la revise antes de empezar a maquetar.
- Importante: el `<div class="btn-primary btn-secondary btn-tertiary btn-primary--alt ... a--alt hidden"></div>` al inicio de `test-buttons.php` existe para forzar que Tailwind compile esas clases (JIT scanner) — mantenerlo.
- **`test-typography.php` trae los nombres de fuente por defecto de la skill escritos como texto literal** (`Crimson Pro`, `Inter`, `RobotoMono` en la sección "Fonts Families", dentro de `<p class="font-serif">Crimson Pro</p>` etc.) — son solo texto de ejemplo, NO se actualizan solos al cambiar `settings/_fonts.css`. Si el diseño importado usa fuentes distintas (caso normal), actualizar ese texto al nombre real de cada fuente elegida (ej. "Fraunces", "Plus Jakarta Sans") en el mismo paso en que se edita `_fonts.css` — si no, la clase aplica la fuente correcta pero la etiqueta visible miente sobre cuál es.
- Si el core no traía `text-h4/h5/h6` (versión vieja de la skill, antes de que se agregaran — ver `settings/_typography.css`), agregarlos y sumar las filas correspondientes en la sección "Fonts Sizes" de `test-typography.php` (`Título H4/H5/H6`) — no dejar la jerarquía cortada en H3.

## React / Next / Vite / Tauri

Confirmado con un proyecto real: **`assets/react-next-test-template/`** trae la plantilla completa lista para adaptar — `page.jsx` + `components/Colors/`, `components/Buttons/`, `components/Typography.jsx`, `components/Reset.jsx`. Usarla como base siempre, solo:
- Actualizar los arrays de colores dentro de `ColorsSection.jsx`/`ButtonSection.jsx` si el proyecto agregó roles extra (`panel`, `dark`, etc.).
- Quitar `SliderTest.jsx`/`GsapTest.jsx` si el proyecto no usa Swiper/GSAP (son específicos de ese proyecto, no parte del patrón genérico).
- Ajustar el import/ubicación según sea Next.js App Router (`app/style-guide/page.jsx` + su propio `layout.tsx`) o React Router (una ruta cualquiera, ej. `/dev/style-guide`).

Detalle importante del patrón real: cada texto de clase mostrado (`.bg-primary`, `.btn-primary`, `.text-h1`, etc.) tiene una clase `test-copy` con un listener que copia el nombre de la clase al portapapeles al hacer click (ver el `useEffect` en `page.jsx`) — mantener ese comportamiento, es parte de la experiencia de la página de prueba, no solo texto estático.

No usar `dangerouslySetInnerHTML` ni strings de HTML como en PHP — es JSX real, respetando la filosofía (`span` dentro de botones, `gap-y-*` en los grids, etc.), tal como está en la plantilla de referencia.
