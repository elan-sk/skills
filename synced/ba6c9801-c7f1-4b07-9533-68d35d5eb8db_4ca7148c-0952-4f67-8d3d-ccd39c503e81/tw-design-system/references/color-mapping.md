# Mapeo de una paleta importada → roles fijos del core

Objetivo: encajar la paleta del diseño recibido en las 15 variables de `bgColors` de `plugins/variables.js`, sin inventar roles nuevos salvo excepción real confirmada con el usuario.

## Roles destino (siempre estos, en este orden de prioridad al mapear)

1. `primary-dk / primary / primary-lt` — el color de marca/CTA principal del diseño y sus 2 variantes tonales.
2. `secondary-dk / secondary / secondary-lt` — segundo color de marca / acción secundaria.
3. `tertiary-dk / tertiary / tertiary-lt` — color de acento/decoración.
4. `background` — fondo general de la página en el diseño.
5. `surface` — fondo de tarjetas/secciones elevadas.
6. `outline` — color de bordes/divisores.
7. `success / info / error` — colores de estado (buscar en el diseño; si no están explícitos, usar convención estándar: verde/gris azulado/rojo o el matiz del sistema que más se le parezca).

**Un rol es una función, no un hex exclusivo.** Es válido y esperado que dos o más roles distintos terminen con el mismo valor hex (ej. `outline` y `success` apuntando al mismo verde que `primary-lt`, o `error` reusando el mismo rojo que `secondary`) — no es un error ni hay que generarles un tono "propio" solo para diferenciarlos visualmente si el diseño de origen ya los repite. Lo que nunca se repite es el ROL en sí (no puede haber dos definiciones de `primary`), pero sí su valor.

**Si el usuario marca un rol como "completar" (o similar) al entregar la paleta**, es una instrucción para que la IA lo rellene con criterio propio de diseño (ver Paso 3: generar `-dk`/`-lt` ajustando luminosidad sobre el mismo matiz, nunca inventando un hue distinto) — no es un dato faltante que haya que devolverle al usuario a preguntar antes de continuar.

## Paso 0: definir `textBasic` (negro/blanco) ANTES de calcular contrastes

`textBasic.black` y `textBasic.white` son la base de todos los `on-*` (ver `plugins/variables.js`). Nunca usar negro/blanco puros (`#000000`/`#ffffff`) por defecto — siempre preferir un matiz tomado de la propia paleta:

1. Si el diseño importado trae explícitamente un color de texto definido para fondos oscuros y/o claros (ej. un "texto sobre oscuro" o "texto sobre claro" en su documentación/tokens), usar esos valores tal cual para `textBasic.white`/`textBasic.black` respectivamente.
2. Si no hay algo explícito, revisar si el diseño ya trae colores muy cercanos al blanco o al negro (luminancia muy alta o muy baja) entre su paleta general — si los hay, usarlos como `textBasic.white`/`textBasic.black`.
3. Si nada de eso existe, derivar:
   - `textBasic.black` = el color **más oscuro** de toda la paleta importada (no `#000000` puro).
   - `textBasic.white` = el color **más claro** de toda la paleta importada (no `#ffffff` puro).
   - **Validar que tengan suficiente potencia antes de usarlos tal cual**: calcular la luminancia relativa de ese tono más oscuro/más claro. Si no es lo bastante oscuro (luminancia demasiado alta para funcionar como "negro") o no lo bastante claro (luminancia demasiado baja para funcionar como "blanco") — es decir, si no logra buen contraste (≥ 4.5:1, idealmente más) contra los fondos típicos del proyecto (`background`, `surface`, `primary`, etc.) — no usarlo tal cual: partir de ese mismo tono (mismo matiz/hue) y oscurecerlo o aclararlo más (bajando/subiendo luminosidad, sin cambiar el hue) hasta que sí tenga suficiente potencia para funcionar como negro/blanco del proyecto.
   - El objetivo es que `textBasic.black`/`textBasic.white` sigan emparentados visualmente con la paleta (mismo matiz que el tono más oscuro/claro real), pero con la fuerza de contraste necesaria para ser legibles en cualquier combinación.
4. Con esos `textBasic` definidos, recién ahí calcular los `on-*` de cada rol con `getContrastRatio` (paso 5 más abajo), usando siempre `textBasic.black`/`textBasic.white` como candidatos — nunca negro/blanco absolutos salvo que efectivamente sean los valores derivados o explícitos del paso 1-3.

## Procedimiento

1. Extraer todos los colores distintos del input (imagen, Figma, doc, HTML/CSS).
2. Agrupar por **función observada en el diseño**, no por similitud de tono: ¿en qué elementos aparece cada color? (botones CTA → primary; fondos de cards → surface; links/acentos → tertiary o secondary; alertas → success/info/error).
3. Para cada rol con 3 variantes (primary/secondary/tertiary), si el diseño solo trae 1 tono, generar `-dk` y `-lt` ajustando luminosidad (más oscuro/más claro), no inventando un hue distinto.
4. Si el diseño trae más de 3 colores de acento y ninguno calza claramente en background/surface/outline/mensajes: **antes de descartar, intentar encajarlos**. Solo si de verdad no caben, preguntar al usuario si agregar un rol nuevo (excepción, no la norma).
5. Calcular cada `on-*` con `getContrastRatio`/`findBestContrastColor` de `plugins/functions.js` (WCAG), no a ojo, usando como candidatos los `textBasic.white`/`textBasic.black` definidos en el Paso 0 (no blanco/negro absolutos), salvo que el diseño ya defina sus propios "textos sobre X" explícitos para un rol puntual.
6. Escribir el resultado en `plugins/variables.js` respetando exactamente la misma forma/exports que el archivo original (no cambiar la arquitectura del archivo, solo los valores hex y, si aplica, agregar el rol excepcional).
7. Si el core del proyecto ya tenía botones/enlaces configurados (`:root` de `atoms/_buttons.css` con `--btn-*`/`--a-*`), mantener su estructura y solo actualizar a qué `var(--color-{rol})` apunta cada uno — no tocar la lógica de `buttons-variants.js` ni `anchor-variants.js`.

## Cuando el mapeo llega hasta un selector de admin (SCF/ACF): verificar la etiqueta contra el hex real, no asumirla

Si el proyecto expone un selector de "color de fondo" editable desde WordPress admin (patrón común con `tw-design-system` + `wp-scf-component-builder`, campo clonado tipo `bg-color`), las ETIQUETAS que ve el editor de contenido (ej. "Ámbar oscuro", "Verde oliva") son un mapeo aparte del código — pueden desincronizarse del hex real sin que ningún build ni linter lo detecte, porque son solo texto en un JSON/admin, no CSS.

Caso real CAFEXPORT, 2026-07-24: las choices de un campo `bg-color` (14 roles) tenían las etiquetas completamente cruzadas contra `plugins/variables.js` — `primary-dk` (verde casi negro, `#00240B`) estaba etiquetado "Ámbar oscuro"; `tertiary-dk` (ámbar/café, `#7B4D0F`) estaba etiquetado "Crimson oscuro". El editor de contenido elegía "Ámbar oscuro" esperando un fondo ámbar y le aparecía verde — nadie lo iba a notar leyendo el código, solo usando el selector real.

**Regla concreta: antes de escribir o confirmar las etiquetas de un selector de color para el admin, cruzar cada `value` (el slug del rol) contra su hex real en `variables.js` y describir el hex con un nombre de color simple y correcto** (ver también `references/frameworks/wordpress.md` para cómo se genera/edita ese campo). No copiar nombres de una paleta de referencia genérica ni asumir que el nombre del ROL (`tertiary`, `outline`) sugiere el tono correcto — cada proyecto mapea los roles a hex distintos (`§2` de `philosophy.md`).

Para el detalle de CÓMO editar ese campo de forma confiable en SCF/ACF (el textarea de "choices" exige el separador exacto `" : "` con espacio a ambos lados, y un `local JSON` de referencia no se sincroniza solo con la base salvo que el proyecto tenga configurado `acf/settings/load_json`), ver `references/editing-existing-field-groups.md` de la skill `wp-scf-component-builder`.
