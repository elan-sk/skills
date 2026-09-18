import { bgColors, textBasic } from './variables.js';
import { getTextColorForBg } from './functions.js';

//Con esta plugins genero reset de los texto, para que cada color de fondo tenga su respectivo color de texto
export default function ({ addBase }) {
  Object.keys(bgColors).forEach(bgColor => {
    addBase({
      [`.bg-${bgColor}`]: {
        'color': getTextColorForBg(bgColors[bgColor], textBasic.white, textBasic.black),
      },
    });
  });
}
