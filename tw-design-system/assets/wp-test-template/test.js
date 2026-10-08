document.addEventListener('DOMContentLoaded', () => {
  // Círculos de test-colors.php: hex real (no el nombre de la clase) +
  // contraste del "abc" (blanco sobre fondos oscuros, negro sobre claros).
  // Fórmula WCAG: un fondo es "oscuro" cuando el blanco da más contraste
  // que el negro contra su luminancia relativa (umbral ~0.179).
  function relLuminance(r, g, b) {
    const ch = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  }
  function parseRGB(str) {
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b] = m[1].split(',').map((s) => parseFloat(s));
    return { r, g, b };
  }
  function toHex({ r, g, b }) {
    const h = (n) => Math.round(n).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
  }

  document.querySelectorAll('.js-color-circle').forEach((circle) => {
    const rgb = parseRGB(getComputedStyle(circle).backgroundColor);
    if (!rgb) return;
    circle.style.color = relLuminance(rgb.r, rgb.g, rgb.b) < 0.179 ? '#fff' : '#000';
    const hexEl = circle.parentElement.querySelector('.js-hex-value');
    if (hexEl) hexEl.textContent = toHex(rgb);
  });
  document.querySelectorAll('.js-text-color-circle').forEach((circle) => {
    const rgb = parseRGB(getComputedStyle(circle).color);
    if (!rgb) return;
    const hexEl = circle.parentElement.querySelector('.js-hex-value');
    if (hexEl) hexEl.textContent = toHex(rgb);
  });

  document.querySelectorAll('.test-copy').forEach(copyEl => {
    const icon = document.createElement('b');
    icon.classList.add('copy-icon');
    icon.textContent = '📋';
    copyEl.appendChild(icon);

    copyEl.addEventListener('click', async () => {
      let text = '';

      const hiddenEl = copyEl.querySelector('.test-copy-hidden');
      if (hiddenEl) {
        text = hiddenEl.textContent.trim();
      } else {
        text = copyEl.textContent
          .replace(icon.textContent, '')
          .trim();
      }

      try {
        await navigator.clipboard.writeText(text);
        icon.textContent = '✅';
        icon.classList.add('copied');

        setTimeout(() => {
          icon.textContent = '📋';
          icon.classList.remove('copied');
        }, 1500);
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    });
  });
});
