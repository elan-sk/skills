# Instalación en WordPress (stack de ELAN-SK)

Stack confirmado: DDEV (servidor local del sitio WP), Vite (build de CSS/JS), browser-sync (auto-reload al detectar cambios), `@tailwindcss/cli` + postcss + autoprefixer.

## Estructura dentro del theme

```
wp-content/themes/<theme>/
├── js/
│   └── index.js          → entry point real de Vite (importa el CSS del core)
├── tailwindcss/          → EL CORE (copiar completo desde assets/core/ de esta skill)
│   ├── index.css
│   ├── atoms/ bases/ components/ libraries/ plugins/ settings/ utilities/
├── assets/               → build output (NO tocar a mano)
│   ├── css/theme.css     (o el nombre configurado)
│   └── js/theme.js
├── test/                 → plantillas de prueba visual (ver test-page.md)
├── vite.config.js
├── tailwind.config.js    → generado por node plugins/safelist.js, NO editar a mano
├── postcss.config.js
├── package.json
└── browser-sync-config.js
```

`js/index.js` debe importar el CSS del core, típicamente:
```js
import "../tailwindcss/index.css";
```

`vite.config.js` de referencia (ya usado por el usuario, no reinventar):
```js
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "./",
  base: "",
  build: {
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: { main: path.resolve(__dirname, "js/index.js") },
      output: {
        entryFileNames: "js/theme.js",
        assetFileNames: ({ name }) => {
          if (name && name.endsWith(".css")) return "css/[name][extname]";
          return "[name][extname]";
        },
      },
    },
  },
});
```

`postcss.config.js`:
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

Dependencias npm necesarias (de `package.json` real del usuario): `tailwindcss`, `@tailwindcss/cli`, `autoprefixer`, `postcss`, `@vitejs/plugin-react`, `vite`, `browser-sync`, `dotenv`, `dotenv-cli`, `npm-run-all`. Si el theme usa componentes React embebidos (islands) mantener `react`/`react-dom` y `@vitejs/plugin-react`; si es un theme 100% PHP/Elementor sin React, se puede omitir el plugin de React y usar `vite.config.js` sin `plugins: [react()]`.

## Pasos al instalar/adaptar el core en un theme WP

1. Si `tailwindcss/` no existe en el theme: copiar completo desde `assets/core/` de esta skill.
2. Si ya existe (proyecto que ya tiene el core y solo se está creando un elemento nuevo): NO sobreescribir, solo editar lo necesario.
3. Actualizar `plugins/variables.js` con los colores mapeados (ver `references/color-mapping.md`).
4. Actualizar `settings/_fonts.css` con las 3 familias (serif/sans/mono) mapeadas del diseño importado.
5. Fuentes nuevas (Google Fonts u otras):
   - Verificar primero que la fuente esté realmente disponible en Google Fonts (buscar, no asumir por el nombre — hay fuentes de diseñador independiente que suenan a Google Font y no lo son). Si el usuario adjunta archivos de fuente propios, revisar el nombre interno en el CSS/`@font-face` que traigan: nombres como `"... Trial"` o `"FONTSPRING DEMO - ..."` delatan una fuente de evaluación sin licencia comercial — avisar antes de dejarla wireada en un repo que hace auto-deploy a producción.
   - **NO usar `@import` de Google Fonts dentro de `settings/_fonts.css`**: ese partial no es el primer archivo del bundle final (`index.css` importa primero `"tailwindcss"` y otros partials antes que `settings/`), y un `@import` que no es la primera declaración del CSS compilado es **inválido y el navegador lo ignora en silencio** (sin error, la fuente simplemente no carga). Encolar el `<link>` vía `wp_enqueue_style` en `functions.php` en su lugar — ya evita el problema y de paso permite agregar `preconnect`.
6. Correr `node tailwindcss/plugins/safelist.js` (o donde corresponda según cwd) para regenerar `tailwind.config.js` con el nuevo safelist de colores — el usuario necesita el safelist porque las clases `bg-*` a veces se generan dinámicamente vía PHP y el scanner de Tailwind podría no detectarlas.
7. Verificar/crear el entry `js/index.js` y confirmar el import del core.
8. Instalar dependencias (`npm install`) si es un theme nuevo.
9. Generar la página de test — ver `references/test-page.md`, sección WordPress.
10. **Verificar en un navegador real, no solo que el build compile.** Un theme hijo hereda el CSS del theme padre (reset.css, Elementor, plugins), que puede colisionar con nuestras reglas de formas que no se ven leyendo el código ni rompen el build (ver `references/philosophy.md §11`, especialmente `§11.1`: CSS sin `@layer` del theme padre le gana al nuestro sin importar especificidad). Si hay Chrome DevTools MCP disponible, cargar la página de test y revisar visualmente botones/links sobre varios fondos antes de dar el trabajo por terminado — "el CSS compilado se ve correcto" no es lo mismo que "se renderiza correcto".

## Notas Elementor / Contact Form 7
Si el theme usa Elementor (`#masthead`, `.elementor-*`) o Contact Form 7 (`.wpcf7`), reusar los selectores existentes de `components/_header.css`, `_footer.css`, `_form.css` como referencia de patrón (namespacing de plugins de terceros dentro de `@layer utilities`/`components`), no como código fijo — adaptar a la estructura real del theme.

Si el theme usa **Hello Elementor** (u otro padre con su propio `reset.css`) como parent theme: ese `reset.css` suele definir `a{background-color:transparent;color:...}`, `button{background-color:transparent;border:...;border-radius:...}` y tamaños fijos para `h1-h6` **sin `@layer`**, lo que le gana a TODO nuestro core (que sí vive en capas) sin importar especificidad — ver `references/philosophy.md §11.1`. El core ya defiende `.btn-*` y `h1/h2/h3` contra esto con `!important`; si se agrega un componente nuevo con fondo/borde/texto sobre un elemento `a`/`button`/heading, revisar el `reset.css` del theme padre primero para saber qué propiedades necesitan el mismo tratamiento.

**Alternativa más limpia (confirmada en proyecto real, Hello Elementor 3.4.9+): desregistrar `reset.css` desde el propio admin del theme**, en vez de (o además de) parchear con `!important` cada propiedad que choca. Hello Elementor trae un toggle nativo para esto:

- **WP Admin → Hello (menú lateral) → Settings** → pestaña con las opciones de "Deregister Hello reset.css" / "Deregister Hello theme.css".
- Activar SOLO **"Deregister Hello reset.css"** — es el archivo que define los resets sin capa de `a`/`button`/`h1-h6`. Dejar **"Deregister Hello theme.css"** desactivado salvo que el usuario confirme que también quiere sacarlo (afecta otras cosas del theme padre, como estilos de comentarios/paginación, no relacionadas al conflicto de capas).
- Confirmado en la práctica (WP admin real, no documentación): esto saca `reset.css` de la lista de `<link rel="stylesheet">` cargados, sin tocar código. Los `!important` que ya están en el core (`atoms/_buttons.css`, `bases/_base.css`) siguen funcionando igual (son inofensivos aunque ya no haga falta pelear contra nada), así que desregistrar el reset es un complemento, no exige revertir los `!important` existentes.
- Trade-off real: `reset.css` también normaliza `box-sizing`, tablas, `abbr`, estilos de impresión, inputs/selects. Al desactivarlo se pierde ESO también, no solo el conflicto puntual. En la práctica el preflight de Tailwind (`@import "tailwindcss"`) ya cubre gran parte de esa normalización, pero conviene revisar visualmente el resto del sitio (no solo la página de test) después de desactivarlo — mismo criterio del punto 10 de arriba.
- Si el theme padre NO es Hello Elementor (o una versión que no trae este toggle), no asumir que existe un equivalente — investigar el theme específico o quedarse con el patrón de `!important` selectivo.

## Verificar en el navegador correcto, y forzar recarga sin caché

Dos gotchas reales (proyecto CAFEXPORT + DDEV, 2026-07-23), fáciles de confundir con "el build no compiló":

1. **`theme.css`/`theme.js` casi siempre se encolan con una versión fija** (`wp_enqueue_style(..., '2.0.0')` en `functions.php`), no con un hash de contenido ni `filemtime()`. Recompilar (`npm run build`) NO cambia la URL del archivo, así que el navegador puede seguir sirviendo la copia cacheada indefinidamente. Si el usuario dice "no veo el cambio" después de un build confirmado, sospechar caché ANTES de asumir que el fix falló: pedir recarga forzada (Ctrl/Cmd+Shift+R) o verificar el propio Chrome DevTools MCP con `navigate_page` + `ignoreCache: true`, y comparar el `getComputedStyle` real del elemento contra la clase nueva. Si el problema es recurrente en el proyecto, ofrecer (sin aplicarlo sin permiso) cambiar la versión fija por `filemtime(get_stylesheet_directory() . '/assets/css/theme.css')`.
2. **Si el proyecto usa `browser-sync` (`npm run dev`), su proxy vive en un puerto separado (típicamente `localhost:3000`), distinto de la URL directa del sitio** (la de `.env`/`LOCAL_URL`, ej. `https://proyecto.ddev.site`). Ese proxy solo refleja cambios mientras `npm run dev` está corriendo activamente — si el agente solo corrió `npm run build` (compilación puntual, sin watch), una pestaña abierta en `localhost:3000` de una sesión de `npm run dev` anterior queda completamente desconectada de los nuevos builds y muestra una foto vieja. Antes de asumir un bug real por "no veo cambios", confirmar CUÁL URL está mirando el usuario.
