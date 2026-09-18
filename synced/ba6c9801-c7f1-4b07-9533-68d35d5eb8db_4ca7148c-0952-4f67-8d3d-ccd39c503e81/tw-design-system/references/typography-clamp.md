# Fórmula de `clamp()` para tipografía responsive

Réplica exacta de la lógica de https://elan-sk.github.io/calculadora-clamp-css/ (repo `elan-sk/calculadora-clamp-css`), para poder calcular un `clamp()` a mano si la calculadora no está disponible. Hay dos variantes, con breakpoints de contenedor DISTINTOS entre sí (no unificar, son fieles al código fuente real de cada una).

**`containerMax` default = 900px** (ambas variantes) desde 2026-07-24, bajado de 1400px a pedido del usuario tras verificar en el proyecto CAFEXPORT que a su ventana de trabajo real (~837px) la tipografía no llegaba al techo con 1400. Esta copia es estática (no está sincronizada con el repo/calculadora online real) — si la herramienta online también cambió a 900, esta nota queda alineada; si no, hay que confirmar con el usuario antes de asumir 1400 o 900 en un proyecto nuevo con un viewport de referencia distinto.

## Variante A — proporcional (solo tamaño desktop), `dinamic-font-max.html`

Se dan el tamaño máximo (desktop) y una proporción de reducción; el mínimo (móvil) se deriva de ahí.

- `containerMin = 350`, `containerMax = 900` (px)
- `proportion = 0.85` por defecto (85%) — **configurable**, no es un valor fijo del sistema. Cuando el usuario pida "una diferencia/reducción de X%", ese X% reemplaza este valor.

```js
fontMin = fontDesktop * proportion
vw = ((fontDesktop - fontMin) / (containerMax - containerMin)) * 100
offsetPx = fontMin - (fontDesktop - fontMin) * (containerMin / (containerMax - containerMin))

clamp(fontMin/16 rem, offsetPx/16 rem + vw vw, fontDesktop/16 rem)
```

Ejemplo con `fontDesktop = 56px`, `proportion = 0.85`, `containerMax = 900`:
```
fontMin = 47.6px
vw = ((56-47.6)/550)*100 = 1.527vw
offsetPx = 47.6 - (56-47.6)*(350/550) = 42.255px
clamp(2.975rem, 2.641rem + 1.527vw, 3.5rem); /*47.6-56px*/
```

## Variante B — mínimo y máximo explícitos, `dinamic-font-min-max.html`

Se dan ambos extremos directamente (sin proporción).

- `containerMin = 576`, `containerMax = 900` (px) — el `containerMin` sigue **distinto** del de la Variante A (350). No armonizar sin que el usuario lo pida.

```js
vw = ((max - min) / (containerMax - containerMin)) * 100
offsetPx = min - (max - min) * (containerMin / (containerMax - containerMin))

clamp(min/16 rem, offsetPx/16 rem + vw vw, max/16 rem)
```

## Cuándo usar cada una

- Si el usuario da un solo tamaño (el de desktop/máximo) + un % de reducción → Variante A.
- Si el usuario da los dos tamaños (mínimo y máximo) directamente → Variante B.
- Ante duda sobre si un "X% de diferencia/reducción" significa `min = max * (1 - X/100)` o `min = max * (X/100)`, preguntar — ver el ejemplo real resuelto en [[project-cafexport-reconstruccion]] (85% de la Variante A significa `fontMin = fontDesktop * 0.85`, es decir una reducción SUAVE del 15%, no una reducción del 85%).
