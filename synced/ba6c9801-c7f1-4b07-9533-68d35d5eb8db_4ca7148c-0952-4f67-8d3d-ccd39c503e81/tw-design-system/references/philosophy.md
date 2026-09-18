# Filosofía del Core TWCSS de ELAN-SK

Reglas que SIEMPRE aplican al crear o adaptar CSS con este core, sin importar el proyecto. El readme completo con explicaciones extensas está en `assets/core/readme.md` — consultarlo solo si hace falta profundizar en un caso puntual (clamp, --value, plugins). Este archivo es el resumen operativo.

## 1. Cero valores literales
Nunca `bg-blue-500`, `text-[#fff]`, media queries manuales para tipografía, o tamaños en px sueltos. Todo debe resolver a una variable/token del core. Si un tamaño no está en la escala de Tailwind, usar las utilidades `*-px-*` del core (convierten px→rem), nunca `w-[320px]`.

**Siempre resolver con clases de Tailwind (`@apply`), nunca CSS plano — salvo que la única forma posible sea CSS.** Antes de escribir una propiedad CSS suelta (`border-color: #67800E;`, `border-style: solid;`, etc.), preguntarse si existe una clase de Tailwind/del core que resuelva lo mismo (`border-primary-lt`, `border-solid`) y usar esa. La única excepción real es cuando la propiedad necesita un valor que Tailwind no puede expresar como clase — el caso concreto de este core: `border-color: var(--btn-context-color-primary, #00240B) !important;` (una variable CSS con fallback, usada para el borde contextual de botones, ver §11.4) no tiene equivalente en clase porque el fallback es dinámico según si el plugin JS seteó la variable o no. En ese caso puntual sí se deja como CSS literal — pero todo lo demás alrededor (border-style, border-width, el resto de la regla) sigue yendo por clases.

**Si el diseño trae un efecto puntual (degradado, overlay, sombra) del que no estás seguro, sacá el valor exacto del origen antes de aproximar a ojo.** Caso real CAFEXPORT, 2026-07-23: se armó un overlay oscuro sobre una imagen de hero primero con `bg-black/35` plano y después con una máscara `mask-r-from-*` calculada a ojo desde una captura — ambas versiones estaban mal. El valor real, sacado con `get_design_context` de Figma sobre el nodo puntual de la imagen, era un simple `linear-gradient` de 2 paradas (`rgba(0,0,0,0)` a `rgba(0,0,0,0.3)`, `to right`) — mucho más simple que lo que se había asumido, y en Tailwind se resuelve directo con `bg-linear-to-r from-transparent to-black/30` (nunca `bg-gradient-to-r`, que es el nombre viejo pre-v4). Si hay acceso al archivo de Figma (MCP), consultar el nodo específico es más rápido y más preciso que iterar a ojo contra una captura de pantalla.

**Utilidades `mask-*` de Tailwind v4.1 (`mask-t/b/l/r-from-*`, `mask-t/b/l/r-to-*`): el valor de posición necesita el sufijo `%` explícito.** `mask-r-from-40` (sin `%`) es una clase válida pero significa "40 unidades de la escala de spacing" (`calc(var(--spacing) * 40)`), no "40% del ancho" — compila sin error y no tira warning, simplemente el resultado visual es otro. `mask-r-from-40%` sí es la utilidad de posición porcentual correcta. Verificar siempre el CSS generado (`grep` en el archivo compilado, sin minificar) para confirmar qué variable CSS terminó seteando la clase, no asumir por el nombre de la utilidad. Para un fade de un solo color plano (ej. "oscuro que se disuelve hacia transparente"), casi siempre alcanza con un `bg-linear-to-*`/`from-*`/`via-*`/`to-*` normal — reservar `mask-*` para casos que un gradiente de fondo no puede resolver solo (ej. recortar el alpha de una imagen real, no de un color).

## 2. Colores: 9 + 3 + roles de mensaje fijos por función, nunca por tono
Núcleo cerrado, no inventar sin preguntar:
- `primary-dk / primary / primary-lt`
- `secondary-dk / secondary / secondary-lt`
- `tertiary-dk / tertiary / tertiary-lt`
- `background / surface / outline`

Los **roles de mensaje** (`success/error` + un tercero variable — `info` en sitios de contenido, `warning` en apps/dashboards, confirmado en proyecto real) y los **roles de superficie extra para apps tipo shell** (`panel`, `dark`, `sidebar` — confirmado en app de escritorio real) sí pueden adaptarse al tipo de proyecto sin que sea una excepción rara: en un sitio de contenido/marketing el set de 9+3+3 alcanza; en una app/dashboard con chrome propio (sidebar, barra de título) es normal y esperado sumar roles de superficie. Lo que nunca cambia es que sigan siendo roles por **función**, nunca por tono, y que no se mezclen con `primary/secondary/tertiary`.

Cada color de fondo tiene su `on-*` (color de texto que garantiza contraste), generado en `plugins/variables.js` + aplicado automáticamente vía `plugins/text-colors.js`. Al adaptar un diseño nuevo:
- Mapear la paleta importada a estos roles por **función** (¿es el color de los CTA? → primary. ¿Es un acento decorativo? → tertiary. ¿Fondo de tarjetas? → surface), no por parecido visual de tono.
- Recalcular los `on-*` con la lógica de contraste de `plugins/functions.js` (`getContrastRatio`), no asignarlos a ojo.
- `plugins/functions.js` NUNCA se reescribe — es utilería genérica, se copia tal cual a cada proyecto. Lo único que cambia por proyecto es `plugins/variables.js` (los valores hex). `plugins/buttons-variants.js`/`anchor-variants.js` tampoco deberían necesitar tocarse — adaptan automáticamente el **borde** de `.btn-primary`/`.btn-secondary` y el color de los `<a>` sueltos al fondo que los rodea (ver `§11` para cómo funciona y qué NO hacer si algún día hay que editarlos).

**Antes de reusar un rol de color en un átomo compartido, verificar el hex real en `plugins/variables.js` — no asumir por el nombre del rol ni por dónde ya se usa.** Caso real CAFEXPORT, 2026-07-23: el átomo `.stat__number` (número grande de una sección de cifras) usaba `text-secondary-dk`, que en la paleta de ESTE proyecto es `#5A1C00` (rojo-café) — no un verde, aunque el resto de la sección sí era verde y visualmente "secondary-dk" podía sonar razonable. El valor correcto según el Figma era `#114325`, que en `variables.js` mapea a `primary`. El nombre del rol no garantiza el tono en un proyecto puntual — cada core tiene su propio mapeo, hay que confirmarlo.

## 3. Tipografía: jerarquía, no fuente literal
3 slots semánticos únicamente: `font-serif` (títulos), `font-sans` (texto/UI), `font-mono` (código/detalles decorativos). Nunca referenciar el nombre real de la fuente en una clase.

Tamaños por jerarquía, no por px: `text-h1, text-h2, text-h3, text-large, text-button, text-base, text-small`. Todos con `clamp()` fluido (calculadora: https://elan-sk.github.io/calculadora-clamp-css/). Nunca escribir `@media` a mano para escalar texto. Si hace falta calcular el `clamp()` a mano (calculadora no disponible), ver la fórmula exacta replicada en `references/typography-clamp.md`.

**Completar tamaños de heading faltantes (h1-h6):** si el usuario no da un tamaño explícito para alguno de los niveles `h1...h6`, completarlo con un tamaño decreciente respecto al nivel anterior (`h1 > h2 > h3 > h4 > h5 > h6`), pero con un piso fijo: **`h6` nunca puede quedar más chico que `text-base`**. Un heading, sin importar cuán bajo esté en la jerarquía, sigue siendo un heading semánticamente más importante que un párrafo — si se permite que caiga por debajo del tamaño de texto base, se rompe la jerarquía visual (un `<h6>` se vería más chico que su propio contenido de párrafo).

**No decrementar de a 1px entre niveles faltantes — usar una escala modular.** Completar `h4/h5/h6` restando 1px por nivel (ej. 19-18-17) dio un resultado real donde los tres niveles eran indistinguibles a simple vista (caso real CAFEXPORT, 2026-07-22: el usuario lo notó de inmediato — "no se ve la diferencia entre las hs"). En vez de eso, distribuir los niveles faltantes con una **razón geométrica constante** entre el último tamaño dado y el piso (`text-base`), típicamente ~1.25 (proporción "tercera mayor", la misma familia de razones usadas en escalas tipográficas modulares clásicas 1.2/1.25/1.333). Ejemplo real: con `h3=40px` y piso en `text-base≈19px`, en vez de `h4=19,h5=18,h6=17` se usó `h4=32, h5=26, h6=21` (razones 1.25/1.23/1.24) — cada nivel se distingue de un vistazo y ninguno cae bajo el piso. Fórmula: `siguiente = anterior / razón`, redondeando a un número entero limpio en cada paso. Referencia visual del resultado final aprobado (todos los niveles con paso perceptible, incluyendo `header/button/base/small`): `references/images/typography-scale-example.png`.

**Los roles `header > button > base > small` también necesitan pasos perceptibles entre sí, no solo "no menor que".** Mismo problema que con los headings: igualar dos roles adyacentes (ej. `button` = `base` porque ambos venían del mismo dato de origen) resuelve la regla de "no más chico", pero dos elementos de UI con el mismo tamaño exacto no se distinguen en pantalla. Aplicar la misma lógica de razón constante (más suave que la de headings, ~1.1 entre roles de UI cercanos como `button`/`base`, ~1.25 entre `header` y el resto si `header` funciona como sub-encabezado): `header > button > base > small`, cada uno perceptiblemente distinto del siguiente, calculado como `rol_mayor = rol_menor * razón` (o a la inversa `rol_menor = rol_mayor / razón`) en vez de copiar el mismo valor entre roles o mover uno solo sin ajustar toda la cadena.

**`text-base` (texto de lectura largo) tiene un piso de legibilidad propio, independiente de la reducción 85% por defecto.** Un párrafo largo no debería bajar de ~16px en ningún viewport — si aplicar la Variante A (85%) a un tamaño dado empuja el mínimo mobile por debajo de eso (caso real: `16px` de origen daba un mínimo de `13.6px`, insuficiente), no forzar la proporción por defecto: usar la Variante B (mínimo y máximo explícitos, ver `references/typography-clamp.md`) fijando el mínimo en el piso de legibilidad (16-17px) y un máximo cómodo para lectura larga (17-19px, editorial/blog), en vez de derivarlo mecánicamente del máximo con el 85%.

**Si el usuario da tamaños en una unidad no estándar para web (ej. "pt"), no asumir automáticamente ninguna de las dos conversiones sin verificar.** Dos lecturas posibles: (a) son puntos de imprenta reales, convertir con `1pt = 4/3 px`; (b) la herramienta de origen solo etiquetó el campo como "pt" por costumbre y el valor ya es px directo. Señal para decidir sin tener que preguntar primero: si los números de origen son "redondos"/limpios (72, 56, 40, 20, 16, 14) la conversión exacta casi siempre da decimales "sucios" (74.67, 53.33...) que no parecen una escala diseñada a propósito — sospechar de (b). De cualquier forma, **verificar siempre renderizando en el navegador real** antes de dar el cálculo por bueno (caso real: la conversión ×4/3 daba un H1 de 96px, visualmente desproporcionado apenas se lo vio en la página real) — un cálculo matemáticamente correcto en la unidad equivocada sigue estando mal.

**No asumir `font-bold` en números/cifras grandes en serif solo porque "se ven de peso visual"** — verificar el peso real del estilo en el Figma (`Regular` vs `Bold`/`Medium` en el nombre de la fuente del nodo). Caso real CAFEXPORT, 2026-07-23: un átomo `.stat__number` (cifra de "+2.500" en 56px) tenía `font-bold` aplicado por costumbre; el Figma especificaba `Fraunces:Regular` — el tamaño grande ya le da suficiente presencia visual sin necesitar peso extra, y el bold lo hacía ver más "grueso"/distinto de lo diseñado.

## 4. Todo en rem, todo escalable
Utilidades `*-px-*` (`w-px-*, h-px-*, p-px-*, gap-px-*`, etc. en `utilities/_sizes-rem.css`) convierten a rem automáticamente (`--value(number) / 16 * 1rem`). Preferir la escala nativa de Tailwind (`p-4`, `gap-6`) cuando calce; usar `*-px-*` solo cuando se necesita un valor exacto fuera de esa escala. Nunca mezclar `px-*` arbitrario (`w-[320px]`) con la escala normal en un mismo componente.

## 5. Containers estilo Bootstrap
Breakpoints propios (`xs 350px, sm 576px, md 768px, lg 992px, xl 1200px, 2xl 1400px`) y clases `container, container-sm...2xl, container-full`. No usar `max-w-screen-*` de Tailwind directamente para layout de página.

## 6. `@apply` para atómicos reutilizables
Botones, forms, acordeones y similares (componentes que se repiten muchísimas veces) se definen una vez con `@apply` en `atoms/` o `components/`, nunca repitiendo la lista completa de utilidades en cada instancia HTML. Esto mantiene el CSS compilado eficiente (clases compartidas) y el HTML limpio.

**Un archivo `.css` nuevo en `atoms/`/`components/` se justifica SOLO por reutilización real (2+ lugares) o por complejidad genuina (muchos estados/breakpoints, tipo header/footer/form), nunca por costumbre.** Si un elemento es poco código y lo usa un único componente, las clases de Tailwind van directo en el markup (PHP/JSX) de ese componente — no crear un `.css` aparte solo porque "es lo que se hace con componentes nuevos". Cada archivo de más es un salto extra al depurar (¿el estilo está en el PHP o en un CSS que vive en otra carpeta?) sin beneficio si nadie más lo reusa. Caso real CAFEXPORT, 2026-07-24: `components/_stat.css` (`.stat` + 2 hijos, ~10 líneas de `@apply`) se creó para una sección de cifras usada en un solo componente (`cards/impact-stats-card.php`) — cero reutilización, solo complejidad de más.

Existen **dos arquitecturas de botones**, pero el modelo por defecto en todos los frameworks (WP, React, Next.js, Vite, Tauri) es el completo — se unifican siempre que el build del proyecto corra sobre Node (que es el caso normal en todos estos frameworks):
- **Completa (default, todos los frameworks Node-based)**: botones con `<span>` interno + pseudo-elemento `::before` para el hover. El **borde** (no el texto, ver `§11.4`) se adapta automáticamente al fondo que rodea al botón vía `plugins/buttons-variants.js`; el color de un `<a>` suelto (sin `.btn-*`) se adapta igual vía `plugins/anchor-variants.js`.
- **Simple (solo fallback excepcional)**: botones con hover fijo por variante, sin plugin JS — usar solo si el proyecto ya la tenía instalada o hay una razón técnica real para no correr plugins de Tailwind (ver `references/frameworks/js-frameworks.md`).

Si la arquitectura usa `<span>` dentro del botón (modelo completo/default), mantenerlo siempre.

## 7. Utilidades de layout propias, no reinventar con Tailwind base
- `flex-center`, `flex-container`, `flex-container-*`, `flex-container-px-*`
- `flex-grid`, `flex-grid-2..N` — **preferir SIEMPRE sobre `grid`/`grid-cols-*` de Tailwind base** para maquetar columnas (cards, pilares, features, etc.): `grid` con columnas fijas no reflowea, si el contenido no cabe en la columna el texto se solapa visualmente; `flex-grid-*` (flex + flex-wrap + `flex-basis` en %) si no hay espacio baja el elemento a la siguiente línea, igual que un `.row` de Bootstrap. Caso real CAFEXPORT 2026-07-29: `pillars-banner.php` usaba `grid md:grid-cols-3 gap-8` y el texto de las columnas se solapaba al angostar el viewport; se corrigió a `flex-grid md:flex-grid-3 flex-grid-gap-8`.
  - **Gap horizontal (separación entre columnas de una misma fila)**: nunca `gap-*`/`gap-x-*` de Tailwind base (rompe el `flex-basis` calculado en %, un ítem termina saltando de línea aunque sí quepa). Usar `flex-grid-gap-*` o `flex-grid-gap-px-*`, que aplican `row-gap` + un padding interno por hijo (patrón gutter de Bootstrap), sin tocar el ancho de cada columna.
  - **Gap vertical only (filas apiladas, sin columnas)**: `gap-y-*` o `gap-y-px-*` sí es seguro porque no afecta el `flex-basis` horizontal.
- `position-full, position-center, position-x-center, position-y-center, position-t/tr/tl/b/br/bl/l/r, position-t-center, position-b-center, position-l-center, position-r-center` — el padre debe tener `relative` (o `absolute`) siempre.

## 8. Reusabilidad entre proyectos por sobre uniformidad visual
El objetivo es que un componente copiado a otro proyecto **funcione sin variables huérfanas**, aunque el resultado visual cambie porque los tokens del nuevo proyecto son distintos. Nunca hardcodear un valor "porque en este proyecto se ve bien" si rompe la reutilización.

## 9. Al crear CUALQUIER elemento nuevo (no solo al importar un diseño)
Estas reglas aplican siempre que se trabaje en un proyecto que ya tiene este core instalado, aunque la tarea sea "hazme un botón" o "arma esta sección", no solo cuando se está adaptando un diseño completo:
- Usar los roles de color existentes del proyecto, nunca literales.
- Usar `text-h*/text-base/etc` en vez de tamaños sueltos.
- Si el elemento se va a repetir (botón, badge, card, acordeón, campo de form), evaluar si merece su propia clase con `@apply` en vez de utilities repetidas inline.
- Layout en columnas → `flex-grid-*` (nunca `grid`/`grid-cols-*`), con `flex-grid-gap-*` para gap horizontal y `gap-y-*` solo para gap vertical (ver §7). `relative` + `position-*` para posicionamiento absoluto.

## 10. Orden fijo de clases al escribir Tailwind (siempre, en todo HTML/JSX)
Toda lista de clases se organiza en bloques, en este orden exacto. Dentro de cada bloque, las propiedades van en **orden alfabético** salvo que se indique prioridad distinta:

1. **Semántica (BEM)** — `card__cta`, `nav__item--active`, etc. Siempre primero, siempre visible de un vistazo.
2. **Flujo/posicionamiento** — todo lo que afecta el flujo normal de la página: `relative`, `absolute`, `fixed`, `sticky`, `z-*`, `top/right/bottom/left` (`inset-*`). Va pegado justo después de la semántica para que resalte y sea fácil de ubicar. La clase de posición (`relative/absolute/fixed/sticky`) siempre es la primera del bloque (prioridad, no alfabético); el resto (`z-*`, `inset-*`/`top`/`right`/`bottom`/`left`) va en orden alfabético.
3. **Layout** — `flex`, `flex-container*`, `flex-grid*`, `grid`, `items-*`, `justify-*`, `flex-col/row`, `flex-1`/`flex-grow`/`flex-shrink`/`basis-*` (comportamiento del propio elemento dentro de su padre flex/grid), `order-*`, `place-*`.
4. **Tamaños** — `w-*`, `h-*`, `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`, `aspect-*` (define proporción/forma del box, misma familia que el resto de tamaños). Incluye variantes `*-px-*`.
5. **Bordes, forma y superficie** — `rounded-*`, `border-*` (ancho/estilo/color del borde van juntos como una unidad, aunque `border-{color}` no quede estrictamente alfabético respecto al resto — misma excepción práctica que ya tiene `bg-*` en el bloque 6), `ring-*`, `outline-*`, `divide-*`, `shadow-*`, `overflow-*` (casi siempre acompaña a `rounded-*` para recortar contenido, por eso vive en el mismo bloque), `object-*`, `opacity-*`, `backdrop-*`.
6. **Color de fondo + texto (fusionados)** — `bg-*` junto con todo lo de texto (`font-*`, `text-*` de tamaño/color/peso/alineación, `leading-*`). Dentro del bloque van alfabéticos, **excepto que `bg-*` siempre es la primera clase del bloque** (prioridad, no alfabético).
7. **Espacios** — `m-*`, `p-*`, `gap-*` y análogos de espaciado interno/externo.
8. **Transiciones, animación e interacción** — `transition-*`, `duration-*`, `ease-*`, `delay-*`, `animate-*`, `will-change-*`, `cursor-*`, `select-*` (`select-none`, etc.), `pointer-events-*`, `touch-*`. Va justo antes de Estados porque son la "configuración" de cómo se comporta/anima el elemento cuando cambia de estado — lectura natural como preámbulo del bloque siguiente.
9. **Estados** (`hover:`, `focus:`, `active:`, `disabled:`, `dark:`, `group-hover:`, variantes `not-*:` como `not-last:`/`not-first:`, y selectores arbitrarios `[&_...]:`) + `group` — bloque final:
   - `group` (el marcador, sin prefijo) va suelto de primero si existe.
   - Las variantes con prefijo `group-*:` tienen prioridad sobre las variantes simples (`hover:`, `focus:`, etc.) — van primero.
   - Los selectores arbitrarios (`[&_.hijo-de-librería]:bg-secondary-dk`) y las variantes `not-*:` se tratan igual que `hover:`/`focus:`: van en este bloque, no sueltos en medio de otro.
   - Dentro de cada grupo de prefijo, las propiedades se ordenan según su categoría original (bloques 2-7), no alfabético entre categorías distintas — ej. `hover:bg-secondary` antes que `hover:text-primary` porque `bg` (bloque 6) precede a como se ordenaría `text` dentro del mismo bloque.

**Clases armadas dinámicamente en PHP/JS (`$section_class = 'hero ' . $bg_class;`, template literals, ternarios):** no fragmentar la variable — pero sí tratarla como si ocupara la posición del bloque más alto que contenga entre sus valores posibles al insertarla en el `class="..."`/`className="..."` que la rodea. Ej: si `$section_class` puede resolver a semántica+`bg-*` (bloques 1 y 6), la variable se posiciona donde iría el bloque 6 relativo al resto de clases estáticas de esa lista, no fija al principio por costumbre. Si la variable mezcla bloques muy distintos y no hay una posición que no rompa el orden de ningún caso posible, dejarla donde esté y no forzarlo — anotarlo en vez de adivinar.

**Responsive**: cada breakpoint (`sm: md: lg: xl: 2xl:`) va pegado inmediatamente después de la clase base de esa misma propiedad, ordenado de menor a mayor — nunca todos los `md:` agrupados aparte al final. Ej: `h-12 md:h-14`, no `h-12 ... md:h-14` separado por otras propiedades de tamaño.

**Componentes con demasiadas clases**: si la lista crece mucho (botones complejos, cards con muchos estados), se puede separar visualmente por bloque (salto de línea o comentario) para que sea más fácil de modificar, mientras se mantenga el mismo orden.

**Reorganizar clases existentes**: si el usuario pide reordenar/organizar clases ya escritas, aplicar esta misma regla completa sin preguntar de nuevo el orden.

Caso real CAFEXPORT, 2026-07-23: una auditoría completa del tema (`cards/`, `components/`, `includes/`, `js/components/`) encontró que `rounded-*`, `border-*`, `overflow-*`, `shadow-*`, `object-*`, `transition-*`, `duration-*` y `select-none` no tenían bloque asignado en la regla original — el resultado real era inconsistente entre archivos: a veces `rounded-lg`/`border-*` aparecían pegados al bloque de espacios, a veces al de color, sin criterio fijo; `transition-*`/`duration-*` aparecían sueltos en medio de layout en unos componentes y al final junto a `hover:` en otros. Los bloques 5 y 8 de esta versión se agregaron a partir de ese barrido, para que esas utilidades tengan una posición fija en vez de quedar "donde caiga". Automatización: se investigó `prettier-plugin-tailwindcss` como alternativa lista para usar y se descartó — no soporta archivos `.php` y su orden no es configurable a un esquema de bloques propio (confirmado contra su documentación oficial, 2026-07-23). La automatización real terminó siendo un sorter propio en Node (`scripts/sort-tw-classes.js` en CAFEXPORT, ver `SKILL.md` § Guardrail permanente), que reordena por regex/clasificación de prefijos y omite deliberadamente cualquier `class`/`className` con PHP embebido en vez de arriesgar tocarlo mal.

Ejemplo completo:
```
card__cta
relative z-10
flex items-center justify-center
h-12 md:h-14 min-w-[120px] w-full sm:w-auto aspect-video
rounded-lg border border-outline shadow-sm overflow-hidden
bg-primary font-semibold text-sm text-white
gap-2 px-4 py-2
transition-colors duration-300
group
group-hover:translate-x-1
hover:bg-secondary hover:text-primary
```

## 11. Cascade layers y Tailwind v4: gotchas reales (no teóricos)

Encontrados depurando un proyecto real donde los botones se veían "transparentes"/sin texto pese a que el CSS compilado se veía correcto a simple vista. Todo el core (`atoms/_buttons.css`, `plugins/buttons-variants.js`, `plugins/anchor-variants.js`) ya incorpora estos fixes — esta sección es para cuando haya que TOCAR esos archivos o escribir un plugin JS nuevo, para no reintroducir los mismos bugs.

**11.1 — En un theme hijo de WordPress, el CSS del theme padre casi siempre le gana al nuestro, sin importar especificidad.**
Todo nuestro core vive dentro de `@layer` (`base`, `components`, `utilities`). Por spec de CSS, **cualquier regla SIN `@layer` le gana a CUALQUIER regla CON `@layer`, sin importar la especificidad** — un simple `a{background-color:transparent}` de un `reset.css` de terceros (ej. el de Hello Elementor) sin capa gana contra nuestro `.btn-primary{background-color:...}` aunque tenga muchísima menos especificidad. Sospechar de esto cuando un componente se ve "vacío"/sin color pese a que el `@apply` es correcto, o cuando un heading no toma la tipografía del core. El core defiende `.btn-*` con `!important` por esto (ver `§11.8` de por qué `.btn-*` sí y los headings no).

Alternativa a pelear propiedad por propiedad con `!important`: si el theme padre es Hello Elementor, tiene un toggle nativo para desregistrar su `reset.css` por completo (**WP Admin → Hello → Settings → "Deregister Hello reset.css"**) — saca el archivo entero de la colisión de raíz, sin tener que sacrificar la capacidad de sobreescribir estilos puntuales (ver `§11.8`). Ver `references/frameworks/wordpress.md` (sección Hello Elementor) para el procedimiento completo y su trade-off (también se pierde la normalización de tablas/inputs/etc. que traía ese reset, no solo el conflicto puntual). Es la opción PREFERIDA sobre `!important` en headings.

**11.2 — Nunca escribir el texto `"!important"` dentro de un valor generado por un plugin JS (`addComponents`/`addUtilities`).**
Es un bug real de Tailwind v4 (probado, no supuesto): el optimizador de CSS re-parsea el valor final y duplica el `!important`, produciendo `color: red !important !important` — CSS inválido que **rompe el build entero** (`Unexpected token Delim('!')`). Si un plugin JS necesita que algo gane con `!important`, el patrón correcto es:
1. El plugin JS solo setea una **variable CSS heredable** (sin `!important` en el valor, ej. `'--btn-context-color': textBasic['white']`).
2. Un archivo `.css` autor (no generado por JS) consume esa variable con un `!important` real: `color: var(--btn-context-color, fallback) !important;`. Un `!important` escrito a mano en un archivo `.css` SÍ funciona bien — el bug es específico del paso por el conversor objeto-JS→AST de Tailwind, no de CSS parseado directamente.

**11.3 — Tailwind v4 puede "optimizar fuera" la variable `--color-{rol}` de un color de theme aunque el rol exista.**
Solo deja la variable en `:root` si detecta la clase real (`bg-primary`, etc.) usada en contenido escaneado o vía `@apply`. Cualquier rol que rara vez se use como clase real corre el mismo riesgo — `var(--color-{rol})` dentro de un plugin JS puede quedar **inválido en silencio** — ni error de build ni warning, simplemente el estilo no se aplica. Fix: dentro de un plugin JS, usar el **valor literal** ya disponible en el objeto JS (`textBasic['white']`, no `var(--color-{rol})`). Si de verdad hace falta la variable reutilizable en `:root` con un valor garantizado, setearla el plugin mismo con el valor literal (`addBase({ ':root': { '--mi-var': textBasic['white'] } })`), nunca asumir que Tailwind ya la dejó disponible.

**11.4 — El borde de un botón se adapta al fondo padre; el texto NO. Y ese borde es la EXCEPCIÓN, nunca la regla.**
El relleno de `.btn-primary`/`.btn-secondary` es fijo (no cambia según dónde caiga el botón), así que el color de texto que ya contrasta con ESE relleno tampoco debería cambiar según el fondo que lo rodea. Si se pisa el texto con "el color legible del fondo padre" (en vez de con el del propio relleno), se rompe apenas el fondo padre no comparte familia de color con el botón — un botón verde sobre un fondo neutro clarito puede terminar con texto oscuro sobre relleno oscuro, invisible. Solo el **borde** necesita adaptarse al contexto.

Importante — el diseño por defecto de un botón sólido casi siempre es SIN contorno visible (una pastilla lisa); el borde solo debe aparecer cuando hay riesgo real de que el botón se confunda con el fondo. Eso pasa ÚNICAMENTE cuando el fondo padre es de la MISMA familia de color que el propio botón (ej. `.btn-primary` dentro de `.bg-primary`/`.bg-primary-dk`/`.bg-primary-lt`) — en cualquier otro fondo (ej. `.btn-primary` sobre `.bg-tertiary` o `.bg-surface`) el relleno ya se distingue solo, y si se le agrega un borde visible ahí igual, es un contorno de más que nadie pidió. Por eso la variable que setea el borde contextual debe estar ACOTADA a esa familia (ej. dos variables separadas, `--btn-context-color-primary` seteada solo por los 3 fondos de la familia primary, `--btn-context-color-secondary` solo por los 3 de secondary) — nunca una única variable seteada por los 15 fondos del core, porque eso pisa el borde en fondos donde no hace falta y cambia el look del botón en todas partes, no solo donde hay colisión real.

Este patrón (detectar cuándo el color propio de un componente puede confundirse con su fondo, y marcar el borde SOLO en ese caso puntual, dejándolo invisible en todos los demás) es general — aplica a cualquier atom con relleno de color de marca sobre un fondo variable (botones, pero también un badge o chip sólido, por ejemplo), no es exclusivo de `.btn-*`.

**11.5 — El `::before` de hover puede tapar el borde: si el relleno de hover coincide con el fondo, el botón entero desaparece en hover. Y el fallback del borde en hover debe ser el propio color de relleno de HOVER, no el de reposo.**
Si el patrón de hover usa un pseudo-elemento `::before` más grande que el botón (ej. `size-[calc(100%_+_9px)]`, para un efecto de "pop"/crecimiento), ese `::before` se renderiza por encima y más allá del borde del botón — cubriéndolo visualmente. Si el color de relleno del hover (fijo, ej. `btn-hover-primary`) coincide con el fondo de la sección, en reposo el borde contextual (`§11.4`) sí se ve, pero AL HACER HOVER el `::before` tapa ese borde con un relleno que se funde con el fondo, y el botón entero "desaparece" solo durante el hover. Fix: el `::before` en estado hover también necesita el mismo borde contextual (mismo criterio de la familia de color, `§11.4`) — no alcanza con ponérselo solo al botón en reposo.

Ojo con un segundo bug más sutil en el mismo lugar: el *fallback* (fuera de colisión) del borde de hover NO puede ser el mismo fallback que el de reposo. El relleno del botón CAMBIA de color entre reposo y hover (`--btn-primary` → `--btn-hover-primary`, normalmente más oscuro) — si el borde de hover cae al fallback de reposo (el color de relleno ORIGINAL, no el de hover), se ve un anillo de dos tonos alrededor del botón (ej. borde ámbar sobre un relleno marrón oscuro) aunque no haya ninguna colisión real con el fondo padre. Cada estado necesita su propio fallback, coincidiendo con SU PROPIO relleno: `--btn-border-primary` (el relleno de reposo, definida en el `:root` de `atoms/_buttons.css`) para el borde en reposo, `--btn-hover-border-primary` (el relleno de hover) para el borde del `::before` en hover.

**11.6 — Un reset base con `!important` sobre un selector compartido (`:is(a, button)`) puede pisar el `!important` de un componente más específico.**
Contraintuitivo: entre dos declaraciones `!important`, **el orden de prioridad de las capas se invierte** respecto al de declaraciones normales (spec de CSS Cascade Layers) — la capa declarada PRIMERO (`base`) le gana a una declarada después (`components`) cuando ambas son `!important`, aunque `components` tenga selector más específico. Si `atoms/_buttons.css` tiene un reset base `:is(a, button){color:...!important}` para links sueltos, y `.btn-primary{color:...!important}` vive en `@layer components`, el reset base GANA y pisa el color del botón. Fix: excluir explícitamente las clases de componente del reset base compartido (`:is(a, button):not(.btn-primary, .btn-secondary, .btn-tertiary)`).

**11.7 — Verificar visualmente TODAS las combinaciones fondo × variante × estado, no confiar en "el build pasó" ni en revisar dos casos sueltos.**
Ningún bug de los anteriores rompe el build ni tira warnings — el CSS compila, se ve razonable leyendo el código, y el bug solo aparece al renderizar en un navegador real, en una combinación específica (un fondo puntual, un estado hover puntual) contra el resto del CSS del sitio (reset del theme padre incluido). Revisar solo 1-2 casos "representativos" no alcanza — el bug de `§11.4`/`§11.5` solo se manifiesta en la familia de color que coincide, y pasa desapercibido en las otras 12 combinaciones que sí se ven bien. Si el proyecto tiene Chrome DevTools MCP disponible, recorrer la matriz completa de la página de test (cada fondo × cada variante de botón, en reposo Y en hover) después de cualquier cambio a botones/links/plugins JS — especialmente en WordPress, donde el resto del CSS del sitio (theme padre, Elementor, plugins) no está bajo nuestro control y puede colisionar en formas no obvias.

**11.8 — `!important` en un heading (`h1-h6`) le quita al usuario la capacidad de reestilizar un heading puntual — no ponerlo ahí por default. Confirmar con el usuario, no asumir.**
Esto pasó en un proyecto real: se le puso `!important` a `h1-h6{@apply text-h1}` etc. por la misma razón defensiva de `§11.1` (colisión con `reset.css` del theme padre) — pero un heading es distinto a un botón. Un `<h1>`/`<h3>`/etc. es una etiqueta SEMÁNTICA que el usuario del proyecto legítimamente puede querer reestilizar puntual, manteniendo el tag por SEO/accesibilidad (ej. `<h1 class="text-h3">` para un título grande semánticamente pero chico visualmente en un contexto específico). Con `!important` en la regla base de la etiqueta, esa clase de override deja de funcionar — la regla base le gana a cualquier clase que no sea también `!important`, y el usuario queda "obligado" al estilo por defecto sin darse cuenta de por qué.

Regla concreta:
- **`.btn-*` (átomos de marca, `atoms/_buttons.css`) SÍ llevan `!important`** — un botón no es algo que se espera reestilizar puntual manteniendo la misma clase; si querés otro look, usás otra variante (`.btn-secondary`) o hacés un componente nuevo.
- **Los headings (`h1-h6`, `bases/_base.css`) NO llevan `!important` por defecto** — aunque haya colisión real con el theme padre, la solución preferida es desregistrar el reset del theme padre (`§11.1`), no sacrificar la sobreescritura puntual de headings.
- Si de verdad hay que forzar un heading por una colisión que no se puede resolver desregistrando el reset (caso raro), avisar al usuario ANTES de agregar `!important` ahí — es una decisión de diseño con trade-off real (pierde poder reestilizar ese tag puntualmente sin también usar el prefijo `!` en el override), no un fix "seguro y sin costo" como sí lo es en botones.

**11.9 — Nunca agregar `!important` "por las dudas, para ganarle al reset del theme padre" sin verificar antes que ese reset sin capa REALMENTE existe y sigue cargado.**
Caso real CAFEXPORT, 2026-07-24: al reactivar `dark-bg-variants.js` (ver `§18`), se le puso `!important` al color base de los links "porque el comentario viejo del código decía que hacía falta para ganarle al `reset.css` de Hello Elementor" — sin confirmarlo. Esto rompió cualquier link con su propia clase de color (`text-primary`, etc.), porque `!important` en `@layer base` le gana a CUALQUIER clase normal sin importar en qué capa esté (`§11.2`-`§11.6` son sobre EQUILIBRAR distintos `!important` entre sí, esto es sobre no necesitar ninguno). Verificado con Chrome DevTools (`[...document.styleSheets].map(s=>s.href)`): el `reset.css` del theme padre YA estaba deregistrado (toggle de Hello, `§11.1`) desde antes — el `!important` no defendía contra nada real, solo rompía cosas.
Regla concreta: antes de escribir `!important` para "defenderse del theme padre", **confirmar en el navegador real** que la regla sin capa contra la que se pelea sigue existiendo (`document.styleSheets` listado, o inspeccionar si el archivo `reset.css`/equivalente sigue en la lista de `<link rel="stylesheet">`) — no asumirlo por un comentario viejo, por analogía con otro selector (`.btn-*` sí lo necesita, eso no prueba que un selector nuevo también), o por "más vale prevenir". Mismo criterio que ya aplica `§12.1` para `!important` en general, pero puntualizado acá porque el error concreto fue justificarlo con un reset que ya no estaba.

## 12. Antes de maquetar CUALQUIER elemento, leer `bases/*.css` — no asumir que un tag llega "en blanco"

`bases/_base.css` (u otro archivo de `bases/` según el proyecto) define defaults reales por **selector de tag**, no por clase — así que aplican aunque el HTML no tenga ninguna clase, y siguen aplicando aunque se agreguen clases de utilidad que no los toquen explícitamente. Escribir clases sin haber leído antes qué defaults ya trae el tag produce dos tipos de error, ambos vistos en componentes reales del proyecto:

- **Pelea silenciosa de layout**: `bases/_base.css` fija en el proyecto de este usuario `section { padding-top: clamp(...); padding-bottom: clamp(...); padding-inline: 0; }` (ver ese archivo). Cualquier `<section>` pensado para ocupar el 100% del viewport/contenedor padre (un hero, un slider full-bleed) hereda ese padding vertical por default — si el componente no lo pisa explícitamente (`p-0` o el override puntual que corresponda), el elemento no ocupa el alto que el diseño pide y el bug es fácil de atribuir por error a Swiper/JS en vez de al CSS base. Antes de maquetar cualquier `<section>` que deba ir a borde a borde, decidir explícitamente si se pisa ese padding — no asumir que arranca en `0`.
- **Duplicar lo que el tag ya resuelve solo**: en el mismo archivo, `h1{@apply text-h1}` ... `h6{@apply text-h6}` (sin `!important`, ver `§11.8`) — un `<h2>` ya sale con `text-h2` aplicado por el solo hecho de ser `<h2>`. Agregar `class="text-h2"` a mano en un `<h2>` no rompe nada (es redundante, no conflictivo) pero genera dos falsos positivos: (a) parece que el tamaño depende de la clase cuando en realidad depende del tag, así que si alguien cambia el tag sin tocar la clase el tamaño no se mueve como se espera; (b) esconde el caso real en que la clase SÍ hace algo — un `<h2 class="text-h3">` para bajarle el tamaño puntual — porque ya no se distingue de un `<h2 class="text-h2">` puesto por costumbre sin necesidad.

Regla concreta: antes de escribir la lista de clases de un elemento nuevo, revisar si su tag ya tiene una regla en `bases/` — si la clase que ibas a poner coincide con lo que el base ya aplica, omitirla; si el elemento necesita pisar un default del base (espaciado, tamaño, lo que sea), hacerlo explícito en vez de dejarlo implícito por "no debería tener nada".

## 12.1 `!important` (prefijo `!`) nunca por defecto, en ningún componente — solo ante un conflicto de cascada real y verificado

Regla general, sin excepción por tipo de componente: no se agrega `!` a una clase "por las dudas" o por costumbre. Se agrega **únicamente** cuando hay un conflicto de cascada real que la clase plana, sin `!`, no resuelve — y ese conflicto se confirma antes de escribir el `!`, no se asume.

Cómo confirmarlo: escribir la clase SIN `!` primero. Si el override se ve aplicado (en build o en el navegador), listo, no hace falta nada más. Solo si se ve que perdió contra otra regla, recién ahí investigar por qué (¿está en un `@layer` distinto, `components` vs `utilities`? ¿es una utility custom vs. una nativa dentro del mismo layer, donde el orden de quién gana no depende del HTML?) y agregar `!` como consecuencia de ese diagnóstico, nunca antes de tenerlo.

Motivo: cada `!` de más sin conflicto real es deuda para quien después quiera reestilizar ese elemento puntual (mismo argumento de `§11.8` para headings, pero aplica a cualquier componente) y ensucia la lectura del código sugiriendo un conflicto que no existe.

## 13. El CSS específico de una librería externa vive en su propio archivo de `libraries/`, nunca repetido inline por componente

Si un componente usa una librería de terceros (Swiper, y cualquier otra que se sume) más allá de su config JS, las clases/overrides de esa librería (variantes visuales de sus propios elementos — botones de navegación, bullets de paginación, etc.) van en el archivo de esa librería dentro de `tailwindcss/libraries/` (ej. `libraries/_swiper.css`), como clases reutilizables con `@apply` (ver `§6`) — no como una lista larga de utilidades sueltas repetida en el markup de cada componente que use esa librería.

Ejemplo real: un botón de navegación "overlay" (circular, semitransparente, para sliders sobre imagen) se define una vez como `.swiper-button-overlay`/`.swiper-pagination-overlay` en `libraries/_swiper.css`, y cualquier slider nuevo que necesite ese mismo look solo agrega esa clase (`class="swiper-button-next swiper-button-overlay ..."`) en vez de repetir `bg-white/50 hover:bg-white/60 size-px-60 rounded-full ...` cada vez. Motivo doble: (a) si el look cambia, se edita en un solo lugar; (b) evita el gotcha de `§11` con CSS que la propia librería importa sin `@layer` propio o con especificidad distinta a la esperada (ej. `swiper/css/navigation` fuerza `svg{fill:currentColor}` en sus botones — un override como `fill-none` tiene que vivir en ese mismo archivo de librería para quedar cerca de la regla que pisa, no disperso).

## 14. Header/toolbar con elemento fijo a cada extremo: `shrink-0` + `flex-1` + `ml-auto`, no `justify-between` con 3+ hijos

Patrón para "logo pegado al borde izquierdo, acciones pegadas al borde derecho, lo del medio con ancho variable" (headers, toolbars, cualquier fila con un elemento fijo en cada punta). El error común es un flex de 3 hijos con `justify-between` (`logo | nav | acciones`): con 3+ items, `justify-between` solo garantiza espacios IGUALES entre cada par de hijos adyacentes, no que el primer y último hijo toquen los bordes reales del contenedor de forma predecible cuando los hijos tienen anchos muy distintos (un logo angosto y un bloque de acciones angosto generan gaps dispares, o el nav "no queda centrado" ni los extremos "no quedan realmente en el borde" de forma consistente).

Patrón correcto (visto en el header de CAFEXPORT, `includes/header-desktop.php`):
```html
<div class="cx-header__inner flex items-center gap-6">
  <div class="cx-header__logo shrink-0">...</div>

  <div class="cx-header__menu-section flex flex-1 items-center">
    <nav class="cx-header__nav">...</nav>
    <div class="cx-header__actions ml-auto flex items-center gap-3">...</div>
  </div>
</div>
```
- El elemento de la punta izquierda (logo) es `shrink-0` (no crece, no se encoge) y vive SOLO junto a un wrapper hermano.
- Ese wrapper hermano es `flex-1` (`flex: 1 1 0%`): consume TODO el espacio restante, así que su propio borde derecho coincide siempre con el borde derecho real del contenedor — ya no depende de que los anchos de los hijos "cuadren" para llegar al extremo.
- Dentro de ese wrapper, el bloque que debe pegarse al extremo derecho (acciones/CTA) lleva `ml-auto` en vez de confiar en `justify-between` del wrapper. Motivo: si el contenido del medio (nav) se oculta condicionalmente en algún breakpoint (`hidden lg:block`) y queda como único hijo visible, `justify-between` con un solo item lo manda al extremo IZQUIERDO del wrapper (regresión real encontrada en este mismo header, donde en mobile el ícono de búsqueda saltaba al lado del logo). `ml-auto` en el elemento de la punta no tiene ese problema: siempre empuja ese elemento (y lo que venga después) hacia la derecha, sin importar cuántos hermanos anteriores estén visibles.

Regla concreta: para 2 puntas fijas con contenido variable en el medio, usar `shrink-0` en las puntas + `flex-1` en un wrapper intermedio + `ml-auto` en el elemento que debe pegarse al extremo derecho DEL wrapper — no `justify-between` en un flex de 3+ hijos directos, y no `justify-between` si alguno de los hijos puede desaparecer condicionalmente por breakpoint.

## 15. Regla de los 8 píxeles para todo espaciado y dimensión

Todo valor de espaciado y tamaño (`padding`, `margin`, `gap`, `width`, `height`) se define como múltiplo de 8px (8, 16, 24, 32, 40, 48, 64, 80, 96...), nunca con números arbitrarios (7px, 13px, 22px...). Se permite 4px como sub-unidad puntual para ajustes finos que no admiten 8 completos (ej. gap entre un ícono y su texto), pero no como base general de la escala.

Motivo: consistencia visual (todo el layout comparte el mismo "ritmo" en vez de espaciados decididos a ojo) y compatibilidad con la densidad de píxeles real de las pantallas (factores de escala de iOS/Android/monitores son múltiplos de 2), evitando medios píxeles al escalar.

En la práctica, esto ya lo resuelve la escala nativa de Tailwind (`p-4`=16px, `gap-8`=32px, etc., todos múltiplos de 4/8) — preferirla siempre (ver `§4`). Cuando haga falta un valor fuera de esa escala vía las utilidades `*-px-*` del core, el valor pasado debe seguir siendo múltiplo de 8 (o 4 como excepción puntual), nunca un número arbitrario solo porque "se ve bien" en el mockup.

## 16. `divide-x` en un grid con contenido centrado: balancear con `pr-{mismo valor que gap}`

Cuando una fila de items usa `grid` + `gap-*` + `divide-x` (líneas divisoras entre columnas) Y el contenido de cada item está centrado (`items-center`/`text-center`, no pegado a un borde), la raya divisoria queda pegada al borde de la celda de la DERECHA (así es como `divide-x` posiciona el `border-left`) mientras que a la izquierda queda separada por el `gap` completo — se ve visualmente desbalanceado, más cerca del contenido de un lado que del otro. Caso real CAFEXPORT, 2026-07-23 (sección de cifras "Impacto en acción", 4 columnas con `gap-8 divide-x-2`): fix fue agregar `pr-8` (mismo valor que el `gap-8`) a cada item **excepto el último** (`not-last:pr-8`, o `lg:not-last:pr-8` si el `divide-x` solo está activo desde cierto breakpoint) — así la raya queda con espacio igual a ambos lados.

**16.1 — Variante sin `gap` (nav/lista de links en `flex`): tirar el `gap` y usar `padding` simétrico + recorte en el primero/último, en vez de sumar `pr-{gap}`.** Caso real CAFEXPORT, 2026-07-30: un `<ul>` de 2 links en el footer (`flex flex-wrap divide-x divide-current`, sin `grid`, sin `items-center`/`text-center`) generado por el widget "Menú de navegación" de WordPress. Verificado en el navegador real (Chrome DevTools, no solo leyendo el CSS compilado) que en Tailwind v4.1.17 el mecanismo exacto de `divide-x` es `:where(& > :not(:last-child)) { border-inline-end-width: 1px }` — el borde queda del lado FINAL de cada item salvo el último (con `gap-4` puesto, eso significa: pegado inmediatamente después del texto del primer link, con TODO el espacio del `gap` recién después, antes del segundo link — desbalanceado, un lado sin aire y el otro con el gap completo). Con `gap` en juego, el fix es el de `§16` (padding extra en el mismo lado del borde, para igualar el otro lado). Sin necesidad de `gap` (una lista simple de 2+ links, no una grilla de paneles), es más simple sacar el `gap` directamente y repartir el espacio como `padding` a cada lado del propio borde: `[&_li]:px-2 [&_li]:first:pl-0 [&_li]:last:pr-0` (el primer/último sin padding en su lado externo, para no dejar aire de más contra el borde del bloque contenedor). Confirmar siempre cuál de los dos lados recibe el borde inspeccionando en el navegador (`getComputedStyle(li).borderInlineStartWidth`/`borderInlineEndWidth`) antes de decidir a qué lado sumarle el padding — no asumirlo por la documentación de una versión anterior de Tailwind (v3 aplicaba el borde en el lado contrario, `:not(:first-child)` + `border-left`).

## 17. `justify-center` en una pila vertical con texto de largo variable desalinea el elemento de referencia entre items

Un patrón `flex flex-col items-center justify-center` (ej. número grande + etiqueta debajo, repetido en una fila de varios items) centra el BLOQUE completo (número+etiqueta) dentro de su celda. Si la etiqueta de un item envuelve a 2 líneas y la de otro queda en 1 sola, el bloque de 2 líneas es más alto → al centrarse, su número queda más arriba que el número del item de 1 línea — los números de la fila dejan de estar alineados entre sí. Fix: `justify-start` en vez de `justify-center` (manteniendo `items-center` para el eje horizontal) ancla todos los números arriba, independientemente de cuántas líneas ocupe la etiqueta. Trade-off real (mismo caso CAFEXPORT, 2026-07-23): el dueño del proyecto, al verlo, prefirió mantener `justify-center` (el look centrado le importaba más que la alineación perfecta de los números) — este es un juicio de diseño, no un bug con una única respuesta correcta; ofrecer el fix pero confirmar cuál de las dos prioridades pesa más para ese proyecto puntual antes de asumir.

## 18. Adaptación automática a fondo oscuro/claro: `on-*` para texto plano, `--alt` ensanchado solo para atoms con relleno fijo

Caso real CAFEXPORT, 2026-07-24 — el más largo de esta lista, con un error propio de por medio que vale la pena no repetir. Contexto: el proyecto dejó elegible el color de fondo de una sección desde el admin (SCF), y hacía falta que TODO lo que cae dentro (texto, links, botones, bordes) siga siendo legible sin importar qué color se elija.

**Checklist (leer ESTO primero, antes de cualquier detalle de abajo): cuando una sección tiene `bg-color` seleccionable, TRES cosas distintas tienen que reaccionar cuando el editor elige un color — no es una sola pieza, son tres mecanismos separados y hay que confirmar los tres, no solo el que se nota primero (típicamente el texto):**
1. **Texto plano** (headings, párrafos, labels) → hereda `color` solo (`§18.1`), o si necesita conservar un acento de marca por defecto, usa `text-heading-color`/`--heading-color` (`§18.6`). Nunca una clase de color de rol fijo (`text-primary-dk`, etc.) puesta a mano.
2. **Links** (`<a>` sueltos, sin ser parte de un botón) → o bien sin clase de color propia (heredan `var(--link-color)` de la regla genérica en `atoms/_buttons.css`, automático vía `dark-bg-variants.js`, `§18.3`), o `.a--alt` si el fondo oscuro no es una clase `.bg-*` detectable (imagen de fondo directa, `§18.2`).
3. **Botones** (`.btn-primary`/`.btn-secondary`/`.btn-tertiary`, o cualquier "pastilla"/badge con relleno fijo como `.eyebrow`) → su variante `--alt` correspondiente, automática vía el selector ensanchado `:where(fondos oscuros) .btn-X` (`§18.2`) o forzada a mano con la clase `--alt` si el fondo no es detectable por clase.

**Antes de dar por terminado un componente/sección con `bg-color` seleccionable: probar el color en un fondo OSCURO real desde el admin (o pasarlo por código) y mirar los TRES a la vez** — texto, cualquier link suelto, y cualquier botón — no alcanza con corregir el que el usuario señaló primero y asumir que los otros dos ya venían bien. Si el componente incrusta markup de un plugin de terceros (formulario, checkout, etc.), sumar también `§18.8` — ese CSS vive aparte y es fácil que ninguno de los tres mecanismos lo alcance.

**18.1 — El mecanismo para texto plano YA EXISTE si `text-colors.js` (o equivalente) está activo: no inventar un swap binario claro/oscuro encima.**
`text-colors.js` de este core ya genera, para CADA rol de fondo, `.bg-{rol} { color: on-{rol} }` — el `on-*` correcto y específico por rol (no un blanco/negro genérico) ya calculado con contraste WCOG real en `variables.js`. Como `color` es una propiedad CSS heredable, CUALQUIER texto plano (`<h2>`, `<p>`, `<span>`) sin su propia clase de color YA hereda el `on-*` correcto de forma automática, para cualquiera de los ~15 roles de fondo, no solo "oscuro vs. claro".

El error real: se creó un atom nuevo (`.section-title`) con un acento de marca fijo (`text-secondary-dk`) + un selector ensanchado que lo volcaba a blanco SOLO en los ~9 fondos oscuros (imitando el patrón de botones, ver `§18.2`) — una reconstrucción manual, binaria y con más código, de algo que la herencia normal de `color` ya resolvía solo, con más precisión (por rol, no oscuro/claro) y cero líneas de CSS nuevas. La corrección fue simplemente **sacar la clase de color fija** del heading y dejar que herede — mismo resultado en el caso normal (el hex coincidía exacto), y ahora sí reactivo a cualquier fondo, no solo a los 9 "oscuros".
**Regla concreta: antes de escribir CUALQUIER mecanismo de adaptación de color para texto plano (headings, párrafos, links sin relleno propio), probar primero si sacar la clase de color fija y dejar que herede el `color` del ancestro ya resuelve el problema.** Si el elemento no tiene una clase de color propia estorbando, no hace falta ni un atom nuevo ni un selector ensanchado — es automático.

**18.2 — Los atoms con RELLENO DE COLOR FIJO (botones, `.eyebrow`, cualquier "pastilla"/badge sólido) sí necesitan una forma `--alt` explícita, porque su fondo no se adapta solo.**
A diferencia del texto (que hereda `color`), un botón con `--btn-primary` fijo NO cambia de color de fondo según dónde caiga — por eso si el fondo de la sección pasa a ser oscuro y coincide con el propio verde del botón, el botón puede "desaparecer" (ver `§11.4`). Acá SÍ hace falta una variante explícita (`.btn-primary--alt`, `.eyebrow--alt`) con su propio relleno/color pensado para fondo oscuro.

Patrón para automatizar esa variante (usado en `atoms/_buttons.css` y `atoms/_badges.css`, mismo mecanismo en los dos): ensanchar el SELECTOR del modificador `--alt` (no inventar una regla nueva) para que se dispare solo al estar anidado en cualquiera de los fondos oscuros:
```css
.btn-primary--alt,
:where(.bg-primary-dk, .bg-primary, .bg-primary-lt, .bg-secondary-dk, .bg-secondary, .bg-tertiary-dk, .bg-outline, .bg-success, .bg-error) .btn-primary {
  /* mismas propiedades que ya tenía .btn-primary--alt, sin duplicar valores */
}
```
`:where()` no suma especificidad, así que la regla sigue ganando por orden de declaración (después de la base), igual que ya hacía el modificador manual solo. La lista de fondos oscuros es la misma en todos los casos — debe mantenerse en sync con `darkBgRoles` del plugin (`§18.3`) si cambia la paleta.

**18.3 — Plugin `dark-bg-variants.js`: detección de fondo oscuro por contraste real, sin tabla manual.**
"Oscuro" se calcula directo del hex de cada rol (fórmula WCAG relative luminance, `getContrastRatio`): un rol es oscuro cuando el blanco da más contraste que el negro contra su propio hex (`darkBgRoles`). No depende de ninguna tabla manual tipo `on-{rol}` — un rol nuevo se clasifica solo. El plugin solo hace UNA cosa: setear `--link-color` (consumida sin `!important`, ver `§11.9`) en los fondos oscuros, para que `<a>`/`<button>` sueltos sin clase de color propia también hereden algo razonable — el resto (texto plano vía `§18.1`, atoms con relleno vía `§18.2`) no necesita el plugin para nada.

**18.4 — Bordes, divisores y detalles decorativos: `border-current`/`divide-current`/`text-current` (no un rol de color fijo).**
Un `divide-x`/`border-t` decorativo con color de rol fijo (`divide-primary-dk`, `border-outline/20`) tiene el MISMO problema que un heading con color fijo (`§18.1`) — no reacciona al fondo elegido, y puede quedar invisible (mismo color que el fondo) o desentonado. La solución NO es otro mecanismo nuevo: `currentColor` (clases `-current` de Tailwind) sigue el `color` YA heredado del elemento — el mismo `on-*` de `§18.1` — así que `divide-current`, `border-current/20`, `text-current/50` heredan automáticamente sin ningún CSS ni plugin adicional. Caso real: `lg:divide-primary-dk` (línea divisoria entre columnas de una sección de cifras) pasó a `lg:divide-current` — en el fondo por defecto (claro) da exactamente el mismo hex que antes (`on-*` ahí coincide con `primary-dk`), y en cualquier fondo oscuro elegido desde el admin la línea pasa a blanca sola.

**18.5 — Antes de dar por buena una etiqueta o texto de un campo del admin (SCF/ACF), verificar el hex real — no asumir por el nombre.** Ver `references/color-mapping.md` y el caso de choices de un `select`/`button_group` completamente cruzadas contra la paleta real (ej. "Ámbar oscuro" apuntando al verde casi negro) documentado ahí — mismo tipo de error que `§2` ya advertía para código, pero aplicado a texto que ve un editor de contenido sin acceso al código.

**18.6 — Cuando `§18.1` (sacar la clase y dejar heredar) NO alcanza: un elemento con acento de marca fijo que DEBE seguir teniendo ese acento por defecto. Los 3 niveles, con `var()` anidado, nunca `!important`.**

`§18.1` resuelve el caso de texto que no necesita ningún acento propio (con sacar la clase alcanza). Pero hay un caso distinto: un heading/cifra que SÍ debe conservar un color de marca por defecto (ej. verde `primary`) cuando no hay fondo elegido, y solo adaptarse cuando el editor elige uno — ahí sacar la clase no sirve, porque se perdería el acento en el caso normal. Para esto, 3 niveles de prioridad, ninguno compitiendo por especificidad — cada uno gana por un mecanismo distinto:

```css
color: var(--heading-color, var(--color-primary));
```

- **Nivel 1 (diseño de marca por defecto):** el fallback final (`var(--color-primary)`). Gana solo si nada más está seteado.
- **Nivel 2 (automático por fondo elegido en el admin):** `--heading-color`, una variable heredada (no una regla que compite) — la setea `plugins/text-colors.js` en cada `.bg-{rol}`. Como es herencia de variable, no cascada de reglas, no hace falta ganarle a nada.
- **Nivel 3 (override puntual de un componente):** si hace falta forzar otro valor en un caso específico, se setea la MISMA variable directo en ese elemento (`class="... [--heading-color:hex]"` condicional en el PHP del componente). Un valor seteado directo en un elemento siempre le gana a uno heredado del padre — regla básica de CSS, cero pelea de especificidad, cero `!important`.

**Dónde vive cada pieza (no confundir con dónde se APLICA):**
| Nivel | Archivo | Alcance |
|---|---|---|
| 1 — hex de marca | `plugins/variables.js` (el hex + el `addBase({':root': {...}})` que lo expone como `--color-{rol}`, ver más abajo) | Todo el proyecto |
| 2 — mecanismo automático | `plugins/text-colors.js` | Todo el proyecto, los ~15 fondos |
| Conexión por defecto a un tag | `bases/_base.css` (ej. `h1 { @apply text-h1 text-heading-color; }`) | Solo dice "este tag usa el mecanismo", no define ningún valor |
| 3 — override puntual | El propio `components/X.php`/`cards/X.php` | Solo ese componente |

**Nunca hardcodear el hex del Nivel 1 directo en el fallback (viola `§1`).** Caso real CAFEXPORT, 2026-07-24: se escribió `var(--heading-color, #114325)` a mano — funcionaba, pero repetía un hex "quemado" en cada archivo que lo necesitaba, y encima como propiedad `color:` suelta en vez de una clase. Corrección: en `plugins/variables.js`, registrar el rol como variable CSS real en `:root` (Tailwind v4 NO expone `--color-{rol}` solo por existir en `theme.extend.colors` de un plugin — confirmado buscando en el CSS compilado, ninguna variable de color aparecía en ningún `:root`, solo quedaban "horneadas" dentro de cada utility ya generada):
```js
addBase({
  ':root': Object.fromEntries(
    Object.entries(bgColors).map(([role, hex]) => [`--color-${role}`, hex])
  ),
});
```
Y consumirlo siempre vía `@apply` con arbitrary value, nunca una propiedad CSS suelta:
```css
@utility text-heading-color {
  @apply text-[var(--heading-color,var(--color-tertiary))];
}
```
(El rol de marca del fallback es una decisión de diseño del proyecto, no algo fijo del patrón — en CAFEXPORT terminó siendo `--color-tertiary`, no `--color-primary`; lo que importa del patrón es el mecanismo de 3 niveles, no qué rol concreto ocupa el Nivel 1.)

**Dónde vive la utility reusable: NO en `atoms/`.** Un utility de color de texto ligado a la tipografía (headings, cifras protagonistas) va en `settings/_typography.css` (vía `@utility`, mismo patrón que ya usan ahí `text-h1`/`text-large`/etc.), no en `atoms/` — `atoms/` es para patrones estructurales/de componente (botones, badges, icon-circle), no utilities de color de texto. Si hace falta una variable nueva para OTRO tipo de detalle (no texto/heading — ej. tinte de ícono), se agrega en el MISMO loop de `text-colors.js` con su propio nombre (`--icon-tint`, etc.), nunca reusando `--heading-color` para algo conceptualmente distinto.

**Vocabulario: "nivel" (este modelo de 3 niveles) no es lo mismo que "capa" (`@layer`, CSS cascade layers, `§11`).** Son dos conceptos sin relación que comparten nombre en español — `@layer base`/`@layer utilities`/etc. deciden prioridad entre BLOQUES de reglas (ver `§11`), mientras que el modelo de 3 niveles de acá decide qué VALOR toma una variable CSS heredable dentro de una sola propiedad. Que `bases/_base.css` viva en `@layer base` no tiene nada que ver con qué nivel (1/2/3) esté aplicando un heading — son ejes completamente independientes. Usar "nivel" para este modelo y reservar "capa" para `@layer` evita la confusión.

**18.7 — El Nivel 2 (automático) NO debe activarse con el fallback propio del PHP (`?: 'rol-por-defecto'`) — solo cuando el editor eligió un color real desde el CMS.** Caso real CAFEXPORT, 2026-07-24. El bug: casi todos los componentes arman su clase de fondo así, `$bg_color = get_sub_field('bg-color') ?: 'surface'; class="bg-<?php echo $bg_color ?>"` — el rol de fondo por defecto ('surface', 'secondary-dk', lo que sea) queda indistinguible en el HTML de un rol elegido a propósito por el editor, porque los dos terminan siendo la misma clase `.bg-{rol}`. Como `text-colors.js` (`§18.1`) reacciona a CUALQUIER `.bg-{rol}`, el Nivel 2 se disparaba también en el estado nativo/por defecto del componente — pisando el diseño propio que el componente ya tenía pensado para ese estado (ver `§18.6`, el caso de un acento de marca fijo).

La corrección NO fue "no reaccionar a los fondos claros" ni ninguna lista especial de roles — fue distinguir "el editor lo eligió" de "es el fallback del propio PHP", con una clase indicadora adicional:

1. Un helper en `functions/utils.php` arma la clase de fondo Y decide si agrega el indicador, mirando el valor CRUDO del campo (antes del `?:`):
```php
function resolve_bg_color_class($raw_value, $default) {
  $bg_color = $raw_value ?: $default;
  if (!$bg_color) {
    return '';
  }
  $selected = $raw_value ? ' bg-color-selected' : '';
  return 'bg-' . esc_attr($bg_color) . $selected;
}
```
2. Cada componente pasa por acá en vez de armar `bg-<?php echo $bg_color ?>` a mano: `$bg_color_class = resolve_bg_color_class(get_sub_field('bg-color'), 'surface'); ... class="<?php echo $bg_color_class ?>"`. Si el componente necesita el ROL crudo para otro uso (ej. un overlay `bg-{rol}/80`, o un segundo `bg-` en un card hijo), se guarda aparte (`$raw_bg_color`/`$bg_color`) — `resolve_bg_color_class()` solo resuelve la clase final, no reemplaza la necesidad del rol como string en otro lado (ver `components/hero-page.php`, que usa las dos cosas a la vez).
3. `text-colors.js` exige AMBAS clases juntas, como selector compuesto (sin espacio — no descendiente):
```js
[`.bg-color-selected.bg-${bgColor}`]: {
  'color': textBasic.white,
  '--heading-color': textBasic.white,
}
```
Sin `.bg-color-selected`, un `.bg-{rol}` solo (el que viene del `?: default` nativo del componente) no dispara nada — el texto se queda con lo que el propio componente/`bases/_base.css` ya tenía puesto (que puede ser heredado sin clase, `§18.1`, o un acento de marca fijo tipo Nivel 1, `§18.6`).

**Qué pasa con los ~4 componentes cuyo fallback nativo YA es un fondo oscuro** (ej. `hero-page` con `'tertiary-dk'`, `manifesto-quote`/`pillars-banner`/`services-mosaic` con `'secondary-dk'`/similar): como el Nivel 2 ya NO se dispara en su estado nativo, su texto (h1, blockquote, atribución) necesita un color fijo a mano en el propio PHP del componente para ese estado por defecto — no distinto en espíritu al Nivel 3 de `§18.6`, salvo que acá se aplica siempre (no condicional a un valor de campo), porque es simplemente el diseño nativo del componente. En la práctica: agregar directo la clase `text-white` (o `text-black`, según el rol nativo) en el heading/párrafo, sin depender de `--heading-color`. El `.eyebrow` NO necesita este arreglo — su selector ensanchado (`§18.2`) reacciona a la presencia de la clase `.bg-{rol}` sola (sin exigir `.bg-color-selected`), porque ese mecanismo es aparte del de `text-colors.js` y fue diseñado para dispararse siempre que el fondo real (elegido o nativo) sea oscuro, no solo cuando el editor lo elige.

**Por qué el helper vive en `functions/utils.php` y no en el propio componente:** se repite en ~21 componentes/cards con el mismo campo clonado (`bg-color`, ver `wp-scf-component-builder/references/editing-existing-field-groups.md`) — es la misma regla de `§6`/reusabilidad de este documento, aplicada a PHP en vez de a CSS.

**18.8 — Markup de un plugin de terceros (Contact Form 7, WooCommerce, etc.) dentro de una sección con `bg-color` seleccionable: es un punto ciego real para `§18.1`/`§18.2`, hay que revisarlo aparte.**

Caso real CAFEXPORT, 2026-08-13. Un componente (`components/contact-form.php`) ya tenía bien resuelto su propio heading (`§18.1`, hereda `color` sin clase fija) — pero el formulario de Contact Form 7 que ese mismo componente incrusta vía `do_shortcode()` se veía con las etiquetas y el botón "Enviar" invisibles/con mal contraste sobre un fondo oscuro elegido desde el admin. La razón: el CSS de ese form (`components/_form.css`, un archivo aparte del componente) tenía sus propios colores fijos —

- `.wpcf7 form label { @apply ... text-primary-dk; }` — un color estático que pisaba por completo el mecanismo de herencia de `§18.1` (el label ni siquiera intentaba heredar, tenía su propia clase de color).
- `.wpcf7 form input[type="submit"]` — estilos de botón escritos a mano (reusando las mismas `--btn-*` de `atoms/_buttons.css`) que NUNCA pasan por `.btn-primary` (es un `<input>`, no tiene esa clase), así que el selector ensanchado `--alt` de `§18.2` (`:where(fondos oscuros) .btn-primary`) tampoco lo alcanza — el botón no tiene ninguna variante para fondo oscuro, ni la automática ni la manual.

**Por qué es un punto ciego fácil de pasar por alto:** auditar SOLO el `.php` del componente no lo muestra — el componente en sí no tiene ningún color fijo, el problema vive en un archivo CSS aparte (`components/_form.css`) que estiliza el HTML que el plugin de terceros genera puertas adentro del `do_shortcode()`. Un grep del componente por `text-` o `bg-` no encuentra nada raro; hay que revisar también el CSS específico de esa librería (ver `§13`, "el CSS específico de una librería externa vive en su propio archivo") CADA VEZ que ese componente vaya a caer en una sección con `bg-color` seleccionable.

**Fix aplicado (mismo criterio de siempre, sin inventar un tercer mecanismo):**
1. Texto plano (`label`, el link "política de..."): sacar la clase de color fija y, si hace falta mantener el mismo comportamiento de headings (var heredable en vez de herencia cruda de `color`), usar la utility `text-heading-color` de `§18.6` en vez de un rol fijo — no un color estático nuevo.
2. Botón (`input[type="submit"]`, no puede llevar `.btn-primary` real): replicar a mano el MISMO selector ensanchado de `§18.2` apuntado a ese selector específico, con la MISMA paleta que ya usa `.btn-primary--alt` (no inventar colores nuevos) — es la única excepción real a "reusar la clase, no reinventar el mecanismo": cuando el elemento no puede llevar la clase base porque es un tag ajeno (`<input>` generado por un plugin), replicar el selector ensanchado apuntándolo a ese selector puntual es la forma correcta de extender el mismo patrón, no una regla nueva.

**Regla concreta: cualquier componente que combine `bg-color` seleccionable + markup de un plugin de terceros (formularios, checkout, etc.) necesita una pasada explícita por `§18.1`/`§18.2`/`§18.6` sobre el CSS de esa librería, no solo sobre el `.php` del componente propio.**

**18.9 — Cuando `§18.4` (`border-current`) NO alcanza: un borde/adorno decorativo que DEBE conservar un acento de marca fijo por defecto. Mismo patrón de 3 niveles que `§18.6`, variable propia.**

`§18.4` resuelve el borde/divisor que solo necesita heredar el `color` que el elemento YA tiene (`border-current`). Pero hay un caso distinto, igual de común que el de `§18.6` para texto: un borde decorativo que SÍ debe tener un color de marca propio por defecto (ej. un marco/línea de acento en `primary-lt`) cuando no hay fondo elegido, y solo adaptarse a blanco cuando el editor elige un fondo oscuro — ahí `border-current` no sirve, porque el elemento puede no tener ningún `color` de texto que valga la pena heredar (es puramente decorativo). Se resuelve exactamente igual que `§18.6`, con su PROPIA variable (nunca reusar `--heading-color` para esto — ver la advertencia de nombres en `§18.6`):

```css
@utility border-accent {
  @apply border-[var(--border-accent-color,var(--color-primary-lt))];
}
```

- **Nivel 1:** `var(--color-primary-lt)` en el fallback (el rol de marca del fallback es decisión de diseño del proyecto, igual que en `§18.6` — acá terminó siendo `primary-lt`, no `primary`).
- **Nivel 2:** `--border-accent-color`, seteada en el MISMO loop de `plugins/text-colors.js` que ya setea `--heading-color`, en el mismo selector compuesto `.bg-color-selected.bg-{rol-oscuro}` (mismo guard de `§18.7` — nunca se dispara con el `?: default` nativo del PHP).
- **Nivel 3:** `class="... [--border-accent-color:hex]"` puntual en el componente que lo necesite.

**Dónde vive:** la utility `.border-accent` va en `settings/_borders.css` (el archivo de settings del DETALLE que sea — borde va en `_borders.css`, no en `_typography.css` aunque el patrón se haya visto primero ahí con `text-heading-color`), nunca en `atoms/` (misma regla de ubicación que `§18.6`). Caso real CAFEXPORT, 2026-08-14: pedido explícito de replicar la dinámica de `text-heading-color` para bordes tipo `border-primary-lt` — confirma que el patrón de 3 niveles no es exclusivo de texto/headings, aplica a cualquier propiedad CSS que necesite "acento de marca + auto-adaptación a fondo oscuro + override puntual", con su propia variable y su propio archivo de settings según qué propiedad CSS controle.

## 19. Selectores arbitrarios (`[&_...]:`) contra una clase BEM con `__`/`--`: escapar el guion bajo literal con `\_`, o el selector se rompe en silencio

Dentro de `[...]` (valores/variantes arbitrarias), Tailwind convierte CUALQUIER `_` en un espacio — es el mecanismo que permite escribir `[&_ul]:flex` (equivalente a `& ul`) sin tener que meter un espacio real dentro del nombre de clase. El problema: esa conversión no distingue "el `_` que yo quería que fuera un espacio" de "el `_` que es parte literal del nombre de una clase BEM" (`footer__column`, `card--active`, etc.) — convierte los dos guiones bajos de `footer__column` en dos espacios también, produciendo un selector roto (`& .footer  column`, con `.footer` y `column` como dos tokens separados en vez de una sola clase) que **no tira error de build ni warning**: compila limpio, el linter de Tailwind de VS Code no lo marca, y la clase generada simplemente no matchea nada en el HTML real — el estilo no se aplica y a simple vista el código se ve correcto.

Caso real CAFEXPORT, 2026-07-30: `[&_.footer__column]:flex` en el wrapper de las columnas del footer compiló a `& .footer  column { display: flex }` — cero efecto visual, detectado solo al inspeccionar el CSS compilado sin minificar (`grep` del selector generado) y confirmar que no coincidía con el HTML. Fix: escapar CADA guion bajo que sea parte literal del nombre de la clase con `\_`, dejando sin escapar únicamente el/los que representan un espacio real entre selectores: `[&_.footer\_\_column]:flex` (el primer `_` después de `&` es el descendiente `& `, los dos `\_\_` siguientes son el `__` literal de BEM).

Regla concreta: antes de escribir un selector arbitrario (`[&_...]`) contra una clase que tenga `_` en su propio nombre (BEM `__`, o cualquier utilidad/clase de terceros con guion bajo), escapar esos guiones bajos con `\_` — y **verificar siempre en el CSS compilado sin minificar** (no solo que el build no tire error) que el selector generado coincide letra por letra con la clase real del HTML, porque este tipo de bug pasa el build limpio y solo se nota mirando el output o probando en el navegador.

**19.1 — Cuándo un `[&_...]:` así de específico deja de valer la pena y conviene pasar a una clase real con `@apply` en un `.css` del componente.** Mismo criterio de `§6`/`§13` (reutilización real o complejidad genuina): si el selector arbitrario empieza a acumular varias clases encadenadas contra varios hijos distintos (título + lista + items, ej. `[&_.footer\_\_column]:flex [&_.footer\_\_column]:flex-col [&_.footer\_\_column]:gap-3 [&_.footer\_\_column-title]:uppercase ...`), es una señal de que ya no es un ajuste puntual sino el estilo completo de un componente estructural — mover esas reglas a `components/_{nombre}.css` con `@apply` sobre las clases BEM reales (`.footer__column { @apply flex flex-col gap-3; }`), dejando el PHP solo con las clases identificadoras. Caso real CAFEXPORT, 2026-07-30: el wrapper de columnas del footer llegó a acumular 8 variantes de `[&_...]:` en una sola lista de clases antes de moverse a `_footer.css` — el usuario lo marcó explícitamente como "demasiado complejo" para vivir en el atributo `class`. Un selector arbitrario corto (1-2 reglas contra un solo hijo, ej. `[&_ul]:flex [&_ul]:gap-4` en un componente chico) sigue siendo el default correcto — no crear un `.css` para eso.
