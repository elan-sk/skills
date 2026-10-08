---
name: biblioteca-depura
description: 'Memoria documental y procedimental de Depura Creatividad (biblioteca.depura-creatividad.com): Componentes (código reutilizable: PHP/ACF/SCF, Drupal, React, SCSS/Tailwind, por cliente) e Instructivos (normas, convenciones, procedimientos, conceptos, soluciones). CONSULTARLA EN SILENCIO, sin pedir permiso, ANTES de crear o maquetar un componente, sección, slider, formulario, header/footer, filtro, plugin o snippet, y antes de decidir naming, estructura, deploy o convenciones — para reutilizar patrones y respetar las normas de la empresa. También cuando el usuario diga "biblioteca", "librería de componentes", "instructivo", "manual de la empresa", "¿ya tenemos un X?", "documentá/subí este componente", "actualizá el instructivo", "borrá esa entrada". Crear/editar/eliminar SIEMPRE va por propuesta con link de aprobación de un administrador; puede subir imágenes y archivos, y toda entrada nueva debe llevar portada (imagen destacada) siempre que sea posible.'
---

# Biblioteca Depura

Sitio WordPress con dos tipos documentales, servidos por el plugin propio **Biblioteca Depura** (`wp-content/plugins/biblioteca-depura` del repo `~/Documentos/DEPURA/DEPURA-SITE-DEV/library-components`). Esta skill **no depende de Novamira**: usa la API `biblioteca/v1` con el script `scripts/bd`.

| Tipo API | Qué documenta | Clase (`clase`) |
|---|---|---|
| `component` (Componente) | Código reutilizable | Banner, Carousel, Filtro, Formulario, Grid, Layout, Mosaico, Slider, Tipo de contenido, Utilidades… |
| `handbook` (Instructivo) | Normas y conocimiento | Norma, Procedimiento, Concepto, Solución, Referencia (únicas clases válidas) |

Cada entrada se clasifica en 3 ejes: **`stack`** (WordPress, Drupal, React, Tailwindcss…), **`clase`** y **`cliente`** (Hidrotecno, Palmas, Sanitex, Dts Solar, Racafe, Hisense, Alfa Laval). Además tiene una **ficha**: `resumen`, `cuando_usar`, `estado` (vigente | revision | obsoleto), `relacionados` (IDs) y, en instructivos, `obligatoriedad` (obligatorio | recomendado | informativo).

## Conexión (incluida en la skill)

Por decisión del usuario (2026-10-07), la conexión viaja dentro de la skill: quien la tiene es porque él se la dio. `scripts/bd` la toma de aquí si no hay `config`.
```bash
BD_URL=https://biblioteca.depura-creatividad.com
BD_TOKEN=ltOrwNuk14p71sD1sFkJoIb15MS9vowtGS4XT1qu
```
Orden en que `scripts/bd` busca la conexión: variables de entorno → `config` de esta carpeta → `~/.config/biblioteca-depura/config` → este bloque del `SKILL.md`. Si da 401, el token se regeneró: pedirle al usuario el nuevo (wp-admin → menú Biblioteca IA → «Conexión de la skill») y actualizar **este bloque y el `config`**. No mostrar el token en el chat.

## Consultar (invisible: no pedir permiso ni anunciarlo largo)

El script es `scripts/bd`, relativo a la carpeta de esta skill (la ruta base que informa el agente al cargarla, p. ej. `~/.claude/skills/biblioteca-depura` o `~/.codex/skills/biblioteca-depura`).

```bash
B="<carpeta de esta skill>/scripts/bd"
$B indice | jq -c '.[] | {id,tipo,titulo,stack,clase,cliente,resumen,estado,portada}'   # barrido barato de todo
$B indice | jq -c '.[] | select(.portada|not) | {id,titulo}'   # entradas sin imagen de portada
$B indice component "slider"        # filtrar por tipo y texto
$B entrada 714                      # detalle: ficha, contenido (markdown), archivos[] con código, campos[], descargas[]
$B taxonomias                       # términos existentes antes de clasificar algo
```

Flujo: 1) `indice` y filtrar con jq por stack/clase/resumen; 2) abrir con `entrada` solo los 1–3 candidatos; 3) reutilizar su código/estructura. Respetar los instructivos con `obligatoriedad: obligatorio` del stack en uso. Ignorar `estado: obsoleto` salvo como referencia histórica. Al usar algo, mencionarlo en una línea ("Basado en *Banner Main (Hidrotecno)*, #714").

## Crear / editar / eliminar (siempre con aprobación)

Nunca escribir directo (ni por Novamira ni por SQL) para cambiar contenido de la biblioteca: se envía una **propuesta** y un administrador la aprueba desde un link.

1. Mostrar al usuario en texto qué se va a proponer y por qué (lo pide su AGENTS.md), incluyendo qué imagen se usará de portada (o por qué no hay).
2. Escribir el JSON en el scratchpad y enviarlo con `$B proponer archivo.json`.
3. Darle al usuario el link `aprobar` (vence en 24 h). Él lo abre logueado como admin (menú Biblioteca IA, con contador de pendientes), ve el diff y aprueba o rechaza.
4. Confirmar con `$B estado ID` antes de decir que quedó aplicado.

```jsonc  // los comentarios son aclaraciones: no van en el JSON real
{
  "accion": "crear | editar | eliminar",
  "tipo": "component | handbook",          // solo en crear
  "id": 714,                                // en editar/eliminar
  "motivo": "Qué cambia y por qué (obligatorio, lo lee el admin)",
  "datos": {                                // en editar: SOLO lo que cambia
    "titulo": "Banner Main",
    "contenido": "<h2>Qué es</h2><p>…</p>",  // HTML completo; para editar partir de `entrada ID html`
    "estado_post": "publish | draft",        // crear publica por defecto
    "terminos": {"stack": ["WordPress"], "clase": ["Banner"], "cliente": ["Hidrotecno"]},  // reemplazan los del eje
    "ficha": {"resumen": "…", "cuando_usar": "…", "estado": "vigente", "relacionados": [712], "obligatoriedad": "obligatorio"},
    "archivos": [{"nombre": "banner-main.php", "lenguaje": "PHP", "ruta": "components/banner-main.php", "tipo": "Component", "codigo": "<?php …"}],
    "campos": [{"nivel": 1, "etiqueta": "Banner main", "machine": "banner-main", "tipo": "Layout/Group"}],
    "adjuntos": [{"ref": "portada", "archivo": "/ruta/portada.png", "alt": "Banner main en escritorio"}, {"ref": "acf", "archivo": "/ruta/acf-banner-main.json"}],
    "imagen_destacada": "portada",
    "descargas": [{"texto": "Campos ACF (JSON)", "adjunto": "acf"}]
  }
}
```
- **Imágenes y archivos** (`adjuntos`): cada uno con `ref` única, `archivo` (ruta local; el script lo convierte a base64) y `alt` si es imagen. Tipos: jpg, jpeg, png, gif, webp, pdf, zip, json; máx. 5 MB c/u y 10 por propuesta. Se usan así:
  - `"imagen_destacada": "ref"` → imagen destacada de la entrada.
  - `{{adjunto:ref}}` dentro de `contenido` → se reemplaza por la imagen (tamaño large, centrada) o por un link si no es imagen.
  - `"descargas": [{"texto": "Campos ACF (JSON)", "adjunto": "ref"}]` → sección Descargas/Anexos. Reemplaza la lista completa: para conservar las existentes, incluirlas como `{"texto": "...", "id": <id de la entrada descargas[].id>}`.
  Hasta la aprobación los archivos quedan en una carpeta protegida; nada entra a la biblioteca de medios sin aprobación.
- Si alguien edita la entrada después de enviar la propuesta, la aprobación queda bloqueada (conflicto): volver a leer la entrada y reenviar.
- `archivos` y `campos` reemplazan la lista completa: en editar, enviar la lista entera. `codigo` va como texto plano (el plugin lo envuelve en el resaltador).
- `lenguaje`: HTML, JavaScript, PHP, React, SCSS, Twig, YML, Otro. `tipo` de archivo: Component, Block, Card, Field, Filter, Form, Function, Include, Layout, Library, Logic Frontend, Loop, Template, Styles, View, Otro.
- `campos.tipo` usa el formato de la tabla ACF (`Basic/Text`, `Content/Image`, `Layout/Repeater`…); en Drupal, el de Drupal (`Texto/Texto (sin formato)`…).
- Eliminar manda a la papelera (recuperable).
- Términos nuevos se crean al aprobar: preferir los existentes (`taxonomias`).

## Imágenes: portada como mínimo

La API **sí puede subir imágenes y archivos** (ver `adjuntos` arriba). Usarlo:

- **Toda entrada nueva lleva portada (`imagen_destacada`) siempre que sea posible.** Sin portada la tarjeta y la entrada muestran un placeholder gris.
- **De dónde sacar la imagen**, en este orden:
  1. La que entregó el usuario (diseño, captura, mockup, Figma exportado).
  2. Una captura del componente funcionando (sitio local o real del proyecto). Pedir autorización antes de abrir el navegador si la regla del usuario lo exige.
  3. Para instructivos sin elemento visual: una captura de la pantalla o herramienta que se explica (panel, admin, terminal).
  4. Si no hay ninguna fuente real: decirlo y preguntar al usuario. **Nunca inventar** ni usar imágenes de terceros sin permiso.
- **Al editar** una entrada sin portada (`portada: false` en el índice), proponer agregarla si se tiene una imagen adecuada.
- **Imágenes dentro del contenido** con `{{adjunto:ref}}` cuando ayuden a entender (pasos de un instructivo, variantes de un componente). Siempre con `alt` descriptivo.
- **Archivos útiles para reutilizar** (JSON de campos ACF/SCF exportado, zip de assets, PDF de referencia) van en `descargas`.
- Formato recomendado para portada: webp o png, horizontal (~1200×675), menos de 1 MB.

## Plantillas de contenido (legibles para humanos)

**Componente**: `## Qué es` → `## Cómo usarlo` (dónde se incluye, dependencias, pasos) → `## Variantes y notas`. El código va en `archivos` y los campos en `campos`, no en el contenido.

**Instructivo**: `## Propósito` → `## Regla` (norma) o `## Pasos` (procedimiento) o `## Explicación` (concepto/solución) → `## Ejemplo` (correcto / incorrecto) → `## Excepciones`.

Ficha: `resumen` en 1–2 líneas concretas (qué hace + stack), `cuando_usar` con casos y cuándo NO.

## Errores comunes
- 401 → token faltante o regenerado. 404 → el ID no es componente/instructivo.
- 400 → falta `motivo`, `tipo` o `datos.titulo`; leer `message`.
- Estado `vencida` → reenviar la propuesta.
- 500 al hacer varias consultas en paralelo: el hosting limita concurrencia. Consultar en serie.
