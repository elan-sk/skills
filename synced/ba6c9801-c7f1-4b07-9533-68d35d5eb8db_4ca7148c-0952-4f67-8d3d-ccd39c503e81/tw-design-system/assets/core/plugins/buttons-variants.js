import plugin from 'tailwindcss/plugin';
import { bgColors, textBasic } from './variables.js';
import { getTextColorForBg } from './functions.js';

/**
 * El borde de .btn-primary/.btn-secondary NO debe verse en la mayoría de
 * los fondos — por defecto coincide con el propio relleno del botón (queda
 * "invisible", como una pastilla sólida sin contorno). Solo debe aparecer
 * cuando el botón cae dentro de una sección de SU MISMA familia de color de
 * marca (ej. btn-primary sobre .bg-primary/.bg-primary-dk/.bg-primary-lt),
 * que es el único caso donde el relleno del botón puede confundirse con el
 * fondo y "desaparecer". Fuera de esa familia (ej. btn-primary sobre
 * .bg-tertiary o .bg-surface) el relleno ya se distingue solo — agregar
 * borde ahí sería un contorno visible sin motivo, no lo que pide el diseño.
 * Este patrón (detectar cuándo el fondo puede confundirse con el propio
 * color del componente y marcar el borde SOLO en ese caso, nunca siempre)
 * aplica a cualquier atom/componente con relleno de marca sobre fondo
 * variable, no solo a botones — replicarlo si aparece el mismo problema en
 * otro lado (ej. un badge o chip de color de marca).
 *
 * Por eso son dos variables SEPARADAS (--btn-context-color-primary,
 * --btn-context-color-secondary), cada una seteada SOLO por los 3 fondos de
 * su propia familia — no una única variable universal seteada por los 15
 * fondos (eso pisaría el borde en fondos donde no hace falta, un bug real
 * de una iteración anterior).
 *
 * Se usa el valor hex literal (getTextColorForBg, functions.js — blanco o
 * negro por contraste real contra ese hex) en vez de `var(--color-on-X)`:
 * esas variables "on-*" nunca se usan como clase real en ningún template
 * (solo aparecen como texto de referencia en la página de prueba), así que
 * Tailwind v4 las optimiza fuera de :root si nunca detecta la clase real
 * usada — cualquier var() que las referencie queda inválida en silencio.
 * El valor literal no depende de que esa variable sobreviva.
 *
 * Nota histórica: antes esto se hacía con selectores anidados por-tipo-de-
 * botón vía addUtilities (".bg-X .btn-Y"), agrupando colores por categoría
 * de tono para adivinar qué botón "hacía juego" con qué fondo. Ese enfoque
 * tenía bugs reales: exigía adivinar la categoría correcta (fallaba en
 * varios fondos, aplicando el color de otro rol), y al registrarse como
 * utility de Tailwind, cualquier componente que hiciera `@apply bg-{rol}`
 * (ej. un icon-circle o un chip) heredaba esas reglas anidadas sin
 * necesitarlas.
 */
export default plugin(function({ addComponents }) {
  // Fallback por defecto (fuera de la familia de color propia): en reposo
  // el borde coincide con el relleno de reposo, invisible; en hover
  // coincide con el relleno de hover (--btn-hover-border-primary), NO con el
  // de reposo — el relleno cambia de color al pasar el mouse, así que si el
  // borde se queda en el color de reposo se ve un anillo de dos tonos aun
  // sin ninguna colisión real con el fondo. Esos dos valores ya viven en el
  // :root de atoms/_buttons.css (--btn-border-primary/--btn-hover-border-
  // primary, etc.) — este plugin no necesita su propia copia "-default".

  ['primary-dk', 'primary', 'primary-lt'].forEach((bgColorKey) => {
    addComponents({
      [`.bg-${bgColorKey}:not(html)`]: {
        '--btn-context-color-primary': getTextColorForBg(bgColors[bgColorKey], textBasic.white, textBasic.black),
      }
    });
  });

  ['secondary-dk', 'secondary', 'secondary-lt'].forEach((bgColorKey) => {
    addComponents({
      [`.bg-${bgColorKey}:not(html)`]: {
        '--btn-context-color-secondary': getTextColorForBg(bgColors[bgColorKey], textBasic.white, textBasic.black),
      }
    });
  });
});
