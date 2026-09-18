/**
 * FUENTE ÚNICA DE VERDAD - Colores del proyecto
 * Estos colores se usan en:
 * - Plugins de Tailwind (build time)
 * - Variables CSS generadas automáticamente
 * - PHP/HTML para referencia
 */

import plugin from 'tailwindcss/plugin';

export const textBasic = {
  /*========================================================
    Color básicos para los texto
  ========================================================*/
  'black': '#303030',
  'white': '#ffffff',
}

export const bgPrimaries = {
  /*========================================================
    PRIMARY COLORS
  ========================================================*/
  'primary-dk': '#000000',
  'primary': '#303030',
  'primary-lt': '#E0E0E0',
}

export const bgSecondaries = {
  /*========================================================
    SECONDARY COLORS
  ========================================================*/
  'secondary-dk': '#4CB1A7',
  'secondary': '#9CE3DD',
  'secondary-lt': '#E1F5F3',
}

export const bgTertiaries = {
  /*==================================================
    TERTIARY COLORS
  ==================================================*/
  'tertiary-dk': '#CC9425',
  'tertiary': '#F7BD38',
  'tertiary-lt': '#FEE080',
}

export const bgBackground = {
  /*==================================================
    BACKGROUND COLORS
  ==================================================*/
  'background': '#FFFFFF',
  'surface': '#E3EDF4',
  'outline': '#9CE3DD',
}

export const bgMessages = {
  /*==================================================
    MESSAGE COLORS
  ==================================================*/
  'success': '#6cc59d',
  'info': '#9daeb5',
  'error': '#A49DF5',
}

export const bgColors = {
    ...bgPrimaries, ...bgSecondaries, ...bgTertiaries,
    ...bgBackground, ...bgMessages
}

/* Colores de botones/enlaces (btn-primary/secondary/tertiary, reposo/hover,
y el color de <a> nativos): ya NO viven acá — son variables CSS literales
en atoms/_buttons.css (bloque :root al principio del archivo), cada una
apuntando a var(--color-{rol}) de abajo. Así se edita un solo valor en un
solo lugar (sin tocar selectores) y además el editor muestra swatch/
autocompletado de color, algo que un objeto JS no da. */

export default plugin(
  /* Registra --color-{rol} en :root para los 15 roles de bgColors + white/
  black de textBasic. Sin esto, Tailwind v4 NO expone ninguna variable CSS
  reusable para colores que llegan vía theme.extend.colors de un plugin —
  cada rol solo existe como valor JS acá y como hex fijo horneado dentro de
  cada utility ya generada. Este addBase es la fuente única para que
  cualquier var(--color-{rol}) en otro archivo (ej. atoms/_buttons.css)
  tenga algo real que leer. */
  ({ addBase }) => {
    addBase({
      ':root': Object.fromEntries(
        Object.entries({ ...bgColors, ...textBasic }).map(([role, hex]) => [`--color-${role}`, hex])
      ),
    });
  },
  { theme: {
    extend: {
      colors: { ...bgColors, ...textBasic }
    }
  }}
)
