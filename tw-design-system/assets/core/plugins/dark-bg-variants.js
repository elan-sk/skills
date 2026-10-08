import plugin from 'tailwindcss/plugin';
import { bgColors, textBasic } from './variables.js';
import { getContrastRatio } from './functions.js';

export const darkBgRoles = Object.keys(bgColors).filter((role) => {
  const hex = bgColors[role];
  return getContrastRatio(hex, textBasic.white) >= getContrastRatio(hex, textBasic.black);
});

export default plugin(function ({ addComponents }) {
  darkBgRoles.forEach((role) => {
    addComponents({
      [`.bg-${role}:not(html)`]: {
        '--link-color': textBasic.white,
        '--logo-filter': 'brightness(0) invert(1)',
      },
    });
  });
});
