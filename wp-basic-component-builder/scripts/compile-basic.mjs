#!/usr/bin/env node
// Compila el CSS escopado del componente "Básico" fuera del navegador,
// reimplementando el mismo compileClasses()/scopeCSS() que usa
// js/admin/basic/compiler.js del tema — mismo paquete `tailwindcss`, mismo
// theme.json, mismos plugins propios. No se importa compiler.js directo
// porque su `import theme from './theme.json'` exige un import attribute
// bajo Node puro (bajo esbuild/navegador no hace falta) — acá se lee el JSON
// con fs en vez de import, el resto es la misma lógica byte a byte.
//
// Uso:
//   node compile-basic.mjs --theme <ruta-al-tema> --content <archivo.html> [--section "clases del <section>"]
//
// Imprime a stdout el JSON {version:1, source, css} listo para el subcampo
// basic__compiled (ver components/basic.php y functions/settings/basic-editor.php).

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const themeRoot = path.resolve(arg('theme', process.cwd()));
const contentFile = arg('content');
const section = arg('section', '');
if (!contentFile) {
  console.error('Uso: node compile-basic.mjs --theme <ruta-tema> --content <archivo.html> [--section "clases"]');
  process.exit(1);
}

const fileUrl = p => pathToFileURL(path.join(themeRoot, p)).href;

const { compile } = await import(fileUrl('node_modules/tailwindcss/dist/lib.mjs'));
const { default: parse } = await import(fileUrl('node_modules/postcss/lib/parse.js'));
const { default: variables } = await import(fileUrl('tailwindcss/plugins/variables.js'));
const { default: darkBg } = await import(fileUrl('tailwindcss/plugins/dark-bg-variants.js'));
const { default: textPlugin } = await import(fileUrl('tailwindcss/plugins/text-colors.js'));
const theme = JSON.parse(readFileSync(path.join(themeRoot, 'js/admin/basic/theme.json'), 'utf8'));

// --- de acá para abajo, copia fiel de js/admin/basic/compiler.js ---
const scopeToken = '__BASIC_SCOPE__';
const scopeSelector = `[data-basic-scope="${scopeToken}"]`;
const options = {
  loadModule: async id => {
    const module = { variables, 'dark-bg-variants': darkBg, 'text-colors': textPlugin }[id];
    if (!module) throw new Error(`Plugin desconocido: ${id}`);
    return { module, base: '/', path: id };
  },
};

function scopeCSS(css) {
  const ast = parse(css);
  const animations = new Map();
  ast.walkAtRules('keyframes', rule => {
    const name = rule.params;
    const unique = `basic-${scopeToken}-${name}`;
    animations.set(name, unique);
    rule.params = unique;
  });
  ast.walkRules(rule => {
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === 'rule' || (parent.type === 'atrule' && /keyframes$/.test(parent.name))) return;
    }
    rule.selectors = rule.selectors.map(selector => {
      if (/^(:root|:host)$/.test(selector)) return scopeSelector;
      return `${scopeSelector}:is(${selector}), ${scopeSelector} :is(${selector})`;
    });
  });
  ast.walkDecls(decl => {
    if (decl.prop.startsWith('--') || /animation/.test(decl.prop)) {
      for (const [name, unique] of animations) {
        decl.value = decl.value.replace(new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'g'), unique);
      }
    }
  });
  return ast.toString().replace(/--tw-/g, `--basic-${scopeToken}-tw-`);
}

async function compileClasses(candidates) {
  const compiler = await compile(theme.css, options);
  const css = scopeCSS(compiler.build([...new Set(candidates)]));
  if (css.length > 600000) throw new Error('El CSS supera el límite de 600 KB. Divide el contenido en varios componentes.');
  return css;
}
// --- fin copia de compiler.js ---

const html = readFileSync(contentFile, 'utf8');
// Mismo criterio que refresh() en editor.js: candidatos = todas las clases de
// class="..." presentes en el HTML, más las del <section> (que viven aparte,
// en basic__section, no dentro del HTML de contenido).
const classAttr = /\bclass\s*=\s*["']([^"']*)["']/gi;
const candidates = new Set();
let m;
while ((m = classAttr.exec(html))) {
  m[1].split(/\s+/).filter(Boolean).forEach(c => candidates.add(c));
}
section.split(/\s+/).filter(Boolean).forEach(c => candidates.add(c));

const css = await compileClasses([...candidates]);
// Misma normalización que normalized() en editor.js: basic.php exige que
// esto coincida EXACTO con basic__content o descarta el CSS al renderizar.
const source = html.replace(/\r\n?/g, '\n').trim();
process.stdout.write(JSON.stringify({ version: 1, source, css }));
