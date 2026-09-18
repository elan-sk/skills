// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function parseColor(color) {
  if (color.startsWith('var(')) return null;

  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }

  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }

  return null;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function getColorCategory(rgb) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const { h, s, l } = hsl;

  // Acromáticos (sin color)
  if (s < 10) {
    if (l > 85) return 'white';
    if (l < 15) return 'black';
    return 'gray';
  }

  // Muy oscuros o muy claros
  if (l < 10) return 'black';
  if (l > 90) return 'white';

  // Clasificación por Hue (rueda de color simplificada - 5 colores)
  if (h >= 330 || h < 30) return 'red';      // Rojo: 330° - 30°
  if (h >= 30 && h < 90) return 'yellow';    // Amarillo: 30° - 90°
  if (h >= 90 && h < 270) return 'blue';     // Azul (incluye green y cyan): 90° - 270°
  if (h >= 270 && h < 330) return 'magenta'; // Magenta: 270° - 330°

  return 'other';
}

export function groupColorsByCategory(colors, verbose = false) {
  const categories = {
    red: [],
    yellow: [],
    blue: [],      // ahora incluye green, cyan y blue
    magenta: [],
    white: [],
    gray: [],
    black: []
  };

  Object.entries(colors).forEach(([name, value]) => {
    const rgb = parseColor(value);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const category = getColorCategory(rgb);
      categories[category].push({
        name,
        value,
        rgb,
        hsl: {
          h: Math.round(hsl.h),
          s: Math.round(hsl.s),
          l: Math.round(hsl.l)
        }
      });
    }
  });

  // Ordenar por Hue dentro de cada categoría
  Object.keys(categories).forEach(key => {
    categories[key].sort((a, b) => {
      if (a.hsl && b.hsl) {
        // Para categoría red, manejar el wrap around (330-360 y 0-30)
        if (key === 'red') {
          const hA = a.hsl.h > 180 ? a.hsl.h - 360 : a.hsl.h;
          const hB = b.hsl.h > 180 ? b.hsl.h - 360 : b.hsl.h;
          return hA - hB;
        }
        return a.hsl.h - b.hsl.h;
      }
      return 0;
    });
  });

  // Convertir a array, filtrando categorías vacías
  const result = Object.entries(categories)
    .filter(([_, colors]) => colors.length > 0)
    .map(([category, colors]) => ({ category, colors }));

  // Mostrar información detallada si verbose es true
if (verbose) {
    console.log('\n=== CATEGORÍAS DE COLORES ===\n');
    result.forEach(({ category, colors }) => {
      console.log(`📁 Categoría: ${category.toUpperCase()} Total de colores: ${colors.length}`);
      console.log('   Colores:');
      colors.forEach(color => {
        const { r, g, b } = color.rgb;
        // Código ANSI para color de fondo RGB: \x1b[48;2;R;G;Bm
        // Código ANSI para resetear: \x1b[0m
        console.log(
          `   \x1b[48;2;${r};${g};${b}m   \x1b[0m ${color.name}: ${color.value}`
        );
      });
      console.log('');
    });
    console.log(`Total de categorías con colores: ${result.length}\n`);
  }
  return result;
}
// ============================================
// CONTRASTE DE COLORES
// ============================================

function getRelativeLuminance({ r, g, b }) {
  const srgb = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function getContrastRatio(color1, color2) {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  if (!rgb1 || !rgb2) return null;

  const L1 = getRelativeLuminance(rgb1);
  const L2 = getRelativeLuminance(rgb2);

  const brightest = Math.max(L1, L2);
  const darkest = Math.min(L1, L2);

  return (brightest + 0.05) / (darkest + 0.05);
}


// Blanco o negro, el que más contraste da contra ese hex — evita mantener
// una tabla manual "on-{rol}" por color (ver variables.js: no existe
// textColors, cada rol decide su texto solo, con esta misma fórmula WCAG).
export function getTextColorForBg(hex, white, black) {
  return getContrastRatio(hex, white) >= getContrastRatio(hex, black) ? white : black;
}

export function findBestContrastColor(baseColor, candidateColors) {
  // ============================================
  // obtener el mejor contraste
  // ============================================
  const colorList = Array.isArray(candidateColors)
    ? candidateColors
    : Object.values(candidateColors);

  // Calcular el contraste de cada color respecto al color base
  const contrasts = colorList.map(color => ({
    color,
    contrast: getContrastRatio(baseColor, color)
  }));

  // Ordenar por contraste descendente (mayor contraste primero)
  contrasts.sort((a, b) => b.contrast - a.contrast);

  // Tomar los dos primeros y devolver solo los valores de color
  return contrasts.slice(0, 2).map(item => item.color);
}
