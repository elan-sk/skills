# Patrón: sección "Acerca de" + Contacto/Donaciones

Sección de cierre para una página de Ayuda/Configuración de una app con UI, usada para
dar créditos de desarrollo y una vía de contacto/donación. Reutilizable en cualquier
proyecto que tenga página de Ayuda o "Acerca de" — no es específico de ningún proyecto
en particular, es plantilla de **formato**, igual que los demás archivos de
`references/ejemplos-base/`.

## Jerarquía visual (de arriba a abajo)

1. **Logo del desarrollador/empresa**, grande y centrado (`h-24 sm:h-28`) — el logo de
   quien lo hizo, no el ícono de la app en sí si son entidades distintas.
2. **Título corto**: "Sobre {NombreDelProducto}".
3. **Un párrafo descriptivo corto** (2-3 líneas máx.): qué es el producto, quién lo
   hizo, para qué. Sin tecnicismos.
4. **Separador sutil** (`<hr>` corto y centrado, `max-w-xs mx-auto`).
5. **Lista de filas de contacto/donación**: cada fila es ícono + nombre del canal a la
   izquierda, acción/valor a la derecha. Detalles de layout que si importan:
   - Etiqueta con `shrink-0` (para que no se comprima), pero **sin ancho fijo** (nada de
     `w-24`) — se probó primero con ancho fijo para alinear las etiquetas de todas las
     filas en columna, pero la versión final usa ancho natural: se ve más compacto y
     orgánico, a costa de que el valor de cada fila no arranque exactamente en la misma
     posición X si las etiquetas tienen largos de texto distintos (aceptable con
     etiquetas cortas como "Contacto"/"PayPal"/"Bre-B").
   - El grupo (ícono + etiqueta + valor) va **centrado como conjunto**
     (`flex items-center justify-center gap-6`), NO estirado a los extremos del
     contenedor con `justify-between` — en un contenedor ancho, `justify-between` deja
     mucho espacio vacío en el medio y se ve descentrado/desbalanceado. Este fue un
     error real detectado y corregido en la primera iteración de este patrón.
   - Padding vertical por fila más bien compacto (`py-2`), no `py-4` — la versión final
     prefiere filas más juntas.
   - Contenedor de la lista con ancho acotado (`max-w-sm mx-auto`), `divide-y` entre
     filas y `border-t border-b` para delimitarla.
6. **Footer pequeño y tenue**: "Elaborado por {Desarrollador} · {Empresa} · {Año}".

## Qué va en cada fila (según lo que el proyecto realmente ofrezca — preguntar, no asumir)

- **Contacto**: correo de contacto, como link `mailto:`. Ícono: `✉️` (emoji, sin
  problema de licencia).
- **PayPal** (si el usuario lo tiene): botón "Donar por PayPal" enlazando a
  `https://paypal.me/<usuario>` — **pedir siempre el link real al usuario, nunca
  inventar o adivinar el username**. Si el usuario no sabe cómo conseguirlo: debe
  iniciar sesión en paypal.com, ir a `paypal.com/paypalme` directamente (no a la página
  de marketing `paypal.com/.../send-receive-money/paypal-me`), y si su cuenta no tiene
  habilitado "recibir pagos" debe primero cambiar eso en la configuración de la cuenta.
- **Bre-B** (mercado colombiano, sistema de pagos inmediatos interoperados del Banco de
  la República): mostrar la "llave" del usuario (puede ser el mismo correo de
  contacto, un celular o un documento) — no existe deep-link público estándar como
  paypal.me, así que **no hay botón de acción**. En su lugar, la llave misma debe ser
  **clickeable para copiar al portapapeles** (`navigator.clipboard.writeText`) con
  feedback de un toast ("Correo copiado al portapapeles" o equivalente según la llave).
  No usar un ícono de copiar aparte (📋) al lado del texto — la primera iteración de
  este patrón lo probó así y el usuario pidió quitarlo: el texto de la llave en sí es
  el elemento clickeable (`<button>` con estilo de texto, `hover:text-primary` como
  única señal visual de interactividad), sin decoración extra. Ver snippet abajo.
  Ícono de fila: **no hay SVG oficial descargable de fuente pública confiable** para
  Bre-B — su logo vive dentro de un "Manual de Identidad Visual" (PDF) en
  `banrep.gov.co/es/bre-b/manual-identidad-visual`, no como asset suelto. Usar un emoji
  de respaldo (`⚡`, alude al concepto de "inmediato" de la propia marca) y ofrecer
  integrar el archivo oficial si el usuario lo sube él mismo.
- **Otros métodos locales** (Nequi, Daviplata, etc.): **nunca agregar automáticamente un
  número de celular personal** como método de pago — expone un dato identificable del
  usuario. Preguntar primero. Si el usuario tiene alternativa con alias/llave (Bre-B,
  PayPal.me) en vez de un número crudo, preferir esa. (En la sesión de origen de este
  patrón, el usuario pidió agregar su Nequi con su número personal y luego se
  arrepintió por esta misma razón — se reemplazó por Bre-B con la misma llave que ya
  era pública, el correo.)

## Iconos de marcas de terceros — fuente confiable

Para íconos de marcas de pago/servicios conocidos (PayPal, Visa, Mastercard, etc.) usar
**Simple Icons** (simpleicons.org): catálogo de logos SVG con licencia **CC0** (dominio
público), mantenido específicamente para este tipo de uso. Regla dura: **nunca
reconstruir el path de un logo de memoria** — siempre descargar el archivo real y
verificarlo:

```bash
curl -sL -o ruta/al/proyecto/src/assets/icons/<marca>.svg \
  "https://cdn.jsdelivr.net/npm/simple-icons@13/icons/<marca>.svg"
```

Notas de esta fuente:
- El CDN directo `cdn.simpleicons.org` puede devolver 403 según user-agent/región; el
  paquete npm servido vía **jsdelivr funciona de forma consistente** — preferirlo.
- Si se usa `WebFetch` en vez de `curl` para inspeccionar el contenido, el modelo
  intermedio puede **resumir/truncar el path SVG** en la respuesta — no sirve para
  copiar tal cual al archivo. Usar `curl` (o equivalente) para obtener el contenido
  exacto y completo, y solo usar `WebFetch`/`WebSearch` para *ubicar* la fuente.
- El SVG de Simple Icons no trae color por defecto — agregar el color oficial de marca
  manualmente al `<path fill="#...">`. Ejemplo ya preparado y verificado:
  `assets/paypal-icon-example.svg` de esta skill (PayPal, `fill="#003087"`).
- Si la marca no está en Simple Icons (marcas regionales o muy nuevas — Bre-B, Nequi,
  Daviplata), no hay atajo confiable: usar un emoji de respaldo y ofrecer integrar el
  archivo oficial si el usuario lo provee.

## Snippet de referencia (JSX + Tailwind — adaptar nombres de clase al componente real)

Handler de copiado (usar `react-hot-toast` o el sistema de toasts que ya tenga el
proyecto para el feedback — nunca dejar la copia sin confirmación visual):

```jsx
async function handleCopyKey() {
  await navigator.clipboard.writeText(llave)
  toast.success('Copiado al portapapeles')
}
```

```jsx
<section className="{Componente}__about-section bg-panel rounded-xl p-6 sm:p-10 mt-10 text-center">
  <img src={logo} alt="{Empresa}" className="{Componente}__about-logo h-24 sm:h-28 mx-auto mb-6" />

  <h2 className="{Componente}__about-title text-xl font-bold mb-2">Sobre {Producto}</h2>
  <p className="{Componente}__about-text text-sm text-mid leading-relaxed max-w-xl mx-auto mb-8">
    {texto corto y descriptivo}
  </p>

  <hr className="{Componente}__about-divider border-outline max-w-xs mx-auto mb-8" />

  <div className="{Componente}__about-details max-w-sm mx-auto divide-y divide-outline border-t border-b border-outline">
    <div className="flex items-center justify-center gap-6 py-2">
      <span className="shrink-0 flex items-center gap-2 text-sm font-medium text-dark">
        <span className="text-lg" aria-hidden="true">✉️</span> Contacto
      </span>
      <a href={`mailto:${email}`} className="text-sm text-primary hover:underline">{email}</a>
    </div>

    {/* Fila de "llave" sin deep-link (Bre-B, Nequi con alias, etc.): la llave misma
    es el botón, no hay ícono de copiar aparte */}
    <div className="flex items-center justify-center gap-6 py-2">
      <span className="shrink-0 flex items-center gap-2 text-sm font-medium text-dark">
        <span className="text-lg" aria-hidden="true">⚡</span> Bre-B
      </span>
      <button
        type="button"
        onClick={handleCopyKey}
        title="Copiar"
        className="text-sm font-mono text-mid hover:text-primary transition-colors"
      >
        {llave}
      </button>
    </div>
    {/* una fila más por cada método de contacto/pago que el proyecto realmente ofrezca */}
  </div>

  <p className="{Componente}__about-footer text-xs text-lt mt-8">
    Elaborado por {Desarrollador} · {Empresa} · {Año}
  </p>
</section>
```

## Origen

Patrón validado en el proyecto PrecioJusto (Elan SK Soft), página de Ayuda, tras varias
iteraciones con el usuario: primero se descartó exponer un número de celular personal
(Nequi) por privacidad; se reemplazó por Bre-B con la misma llave que el correo de
contacto ya público; el layout de filas pasó de `justify-between` (se veía
descentrado) a `justify-center`; la fila de la llave sin deep-link pasó de "texto + botón
de ícono 📋 aparte" a "el texto de la llave es directamente el botón clickeable" tras
feedback explícito del usuario ("no me gusta ese ícono"); y en un ajuste final el usuario
quitó el ancho fijo de las etiquetas (`w-24` → solo `shrink-0`) y redujo el padding
vertical de las filas (`py-4` → `py-2`) directamente en el código, prefiriendo un look
más compacto y de ancho natural sobre la alineación estricta en columna. Ver
`assets/paypal-icon-example.svg` como ícono de PayPal ya listo para reusar tal cual.
