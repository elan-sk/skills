import plugin from 'tailwindcss/plugin';
import { bgColors, bgPrimaries, bgSecondaries, bgTertiaries } from './variables.js';
import { findBestContrastColor } from './functions.js'

/**
 * Por cada fondo (.bg-X) setea --link-color/--link-hover-color heredables
 * con el mejor contraste disponible entre los 9 tonos de marca, para que
 * un <a> suelto (sin clase .btn-*) siempre se lea bien sin importar la
 * sección en la que caiga. atoms/_buttons.css las consume con un
 * !important escrito a mano.
 *
 * Importante: NO se puede lograr el !important poniendo el texto
 * "!important" dentro de un valor generado por addComponents/addUtilities
 * — es un bug real de Tailwind v4: el optimizador de CSS vuelve a parsear
 * el valor y duplica el "!important", lo que rompe el build entero
 * ("Unexpected token Delim('!')"). Por eso este plugin solo setea
 * variables CSS (valores planos, sin "!important" en ningún lado) y quien
 * consume esas variables con !important real es CSS escrito a mano en
 * atoms/_buttons.css — ahí sí funciona, porque es CSS parseado del
 * archivo tal cual, no un valor armado dinámicamente en JS.
 */
export default plugin(function({ addComponents }) {
  // Fallback por defecto (sin ancestro .bg-X que sete las variables): lo
  // consume atoms/_buttons.css como var(--link-color, var(--a-color)) —
  // --a-color/--a-hover-color viven en el :root de ese archivo, no acá.

  Object.entries(bgColors).forEach(([bgColorKey, bgColorValue]) => {
    const bestContrast = findBestContrastColor(
      bgColorValue,
      { ...bgPrimaries, ...bgSecondaries, ...bgTertiaries }
    );

    addComponents({
      [`.bg-${bgColorKey}:not(html, .bg-background)`]: {
        '--link-color': bestContrast[0],
        '--link-hover-color': bestContrast[1],
      }
    });
  });
});
