import fs from 'fs';
import { bgColors } from './variables.js';

const colorNames = Object.keys(bgColors || {});
const safelist = colorNames.map(name => `bg-${name}`);

const fileContent = `export default {
  safelist: [
${safelist.map(className => `\t\t'${className}',`).join('\n')}
  ],
}
`;


fs.writeFileSync('./tailwind.config.js', fileContent, 'utf8');

