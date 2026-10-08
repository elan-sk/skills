import { bgColors, textBasic } from './variables.js';
import { getTextColorForBg } from './functions.js';
import { darkBgRoles } from './dark-bg-variants.js';

/* Nivel 2 de color (ver philosophy.md §18.6 y §18.7).
Exige AMBAS clases juntas (".bg-color-selected.bg-{rol}", selector
compuesto): .bg-color-selected la agrega el PHP/JS del componente SOLO
cuando el editor eligió un color real desde el CMS, nunca con el fondo por
defecto del propio componente. Así un .bg-X solo no pisa el texto.
Solo roles oscuros: en roles claros el texto conserva su color (herencia
natural / fallback del Nivel 1 en settings/_typography.css). */
export default function ({ addBase }) {
  darkBgRoles.forEach((role) => {
    const onColor = getTextColorForBg(bgColors[role], textBasic.white, textBasic.black);
    addBase({
      [`.bg-color-selected.bg-${role}`]: {
        'color': onColor,
        '--heading-color': onColor,
        '--border-accent-color': onColor,
      },
    });
  });
}
