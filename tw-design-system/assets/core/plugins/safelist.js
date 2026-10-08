import fs from 'fs';
import { bgColors } from './variables.js';

const colorNames = Object.keys(bgColors || {});
// flex-grid-N armado dinámicamente desde un campo de columnas del CMS
// (el valor final nunca aparece literal en el código fuente).
const flexGridBreakpoints = ['', 'sm:', 'md:', 'lg:'];
const flexGridNumbers = [1, 2, 3, 4, 5, 6];
const safelist = [
  ...colorNames.map(name => `bg-${name}`),
  ...flexGridBreakpoints.flatMap(bp => flexGridNumbers.map(n => `${bp}flex-grid-${n}`)),
];

const fileContent = `export default {
  safelist: [
${safelist.map(className => `\t\t'${className}',`).join('\n')}
  ],
}
`;


fs.writeFileSync('./tailwind.config.js', fileContent, 'utf8');

