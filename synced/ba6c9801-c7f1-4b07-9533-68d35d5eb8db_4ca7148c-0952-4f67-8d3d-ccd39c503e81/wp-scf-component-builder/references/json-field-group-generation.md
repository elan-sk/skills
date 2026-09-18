# Generar JSON de grupo de campos SCF desde un diseño anotado a mano

Capacidad: el usuario comparte una imagen del diseño con anotaciones a mano (flechas + texto tipo `NombreCampo: tipo`) y, opcionalmente, un JSON de exportación de referencia (ACF o SCF). A partir de eso hay que generar un JSON de grupo de campos **listo para importar** desde el admin de SCF (pantalla Field Groups → Tools → Import).

## Compatibilidad ACF/SCF confirmada

SCF es un fork de ACF que mantiene la misma API (`get_field`, `have_rows`, etc.) y la misma estructura base de JSON de field groups (`key`, `title`, `fields`, `location`, `menu_order`, `position`, `style`, etc.). Verificado directamente contra los JSON Schema que SCF publica en su repo (`WordPress/secure-custom-fields`, rama `trunk`, carpeta `schemas/`), no solo por documentación de terceros.

**Antes de escribir el JSON, leer `references/scf-schema-reference.md`** — tiene la tabla completa y verificada de qué propiedades acepta cada `type` de campo, los patrones obligatorios de `key`/`name`, y el gotcha de `hide_on_screen` (debe ser `[]`, nunca `""`). No asumir propiedades por analogía con ACF clásico sin chequear esa tabla primero.

Si en algún momento el import falla con un error de validación, comparar el JSON generado contra los schemas fuente (se pueden traer con `curl` desde `https://raw.githubusercontent.com/WordPress/secure-custom-fields/trunk/schemas/...`) en vez de asumir.

## Alcance: componente suelto vs. página completa

Antes de armar la jerarquía, resolver si el pedido es por **un componente** o por **una página completa con varios componentes** (ver `naming-conventions.md`, sección "Grupo de campos (field group)"):

- **Página completa con varios componentes (DEFAULT desde 2026-07-15):** se genera **un solo field group compartido** (ej. "Página Flexible") con **un único campo `flexible_content`** (ej. `page-builder`), y cada componente de esa página es **un `layout`** dentro de ese campo, con sus propios campos/repeaters como `sub_fields` del layout (ver convención B en `naming-conventions.md` y el esqueleto de ejemplo más abajo). Este field group + su plantilla PHP (dispatcher, ver `code-patterns.md` #1.5) se piensan para ser **compartidos entre todas las páginas de ese patrón**, no uno por página — si ya existe uno en el proyecto, el componente nuevo se agrega ahí como layout adicional en vez de generar un field group nuevo.
- **Página completa con field group fijo (patrón viejo, solo si el usuario pide explícitamente NO reordenar/reutilizar):** un field group con el nombre de la página, cada componente como un campo `group` de nivel superior — ver convención C.
- **Componente suelto**: field group = slug del componente, como en la convención A.

**Gotcha de SCF a tener siempre presente con `flexible_content`:** el `name` del campo flexible content debe ser único en TODO el proyecto — si se generan field groups separados por página que cada uno define un campo con el mismo nombre (ej. `page-builder` en dos field groups distintos), SCF puede resolver `get_field()`/`update_field()` contra el field group equivocado (queda cacheada una referencia meta en el post apuntando a la key que no es) y el contenido se guarda vacío sin ningún error visible. Ante la duda, usar un solo field group compartido (ver arriba) en vez de varios con nombres iguales.

## Proceso

1. **Leer las anotaciones de la imagen.** Cada flecha + texto indica: nombre del campo (en el idioma/estilo que use el usuario, ej. "SubtitleIcon") y su tipo (texto, imagen, group, Repeater, select, etc.). Anotar también la jerarquía visual: qué campos están anidados dentro de un `group` o dentro de un `Repeater`.
2. **Aplicar la convención de naming** de `naming-conventions.md`: el field name real en el JSON es `{slug-componente}__{campo-en-kebab-case}`, no el texto literal de la anotación (la anotación es solo para identificar qué es, no el nombre final del campo).
3. **Resolver ambigüedad de tipo "texto|imagen":**
   - **Caso normal** (la inmensa mayoría): la anotación indica un solo tipo (`text` o `imagen`) → crear un único campo de ese tipo. No hay que armar nada especial.
   - **Caso explícito de ambigüedad** (la anotación literalmente marca dos tipos posibles para el mismo campo, ej. `text|image`): crear un `group` con dos subcampos (uno `text`, uno `image`) más un campo `true_false` (booleano) que decide cuál de los dos se muestra en el frontend. Nombrar el booleano como `{prefijo}__use-image` o similar, coherente con el resto.
4. **Generar las `key` únicas** seudo-aleatorias imitando el patrón de ACF/SCF: `group_` + 13 caracteres hexadecimales para grupos, `field_` + 13 caracteres hexadecimales para cada campo. Nunca reutilizar keys entre campos. Se pueden generar así:
   ```bash
   python3 -c "import secrets; print('field_' + secrets.token_hex(7)[:13])"
   ```
5. **Armar la jerarquía real** con `sub_fields` para `group` y `repeater`, heredando el prefijo BEM completo tal como se hace con las cards de repeaters en PHP (ver `naming-conventions.md`, sección "Cards de un repeater"): si el repeater se llama `{slug}-item`, sus subcampos son `{slug}-item__{campo}`.
6. **Mapear tipos** (anotación del usuario → tipo real de campo SCF):

   | Anotación del usuario | Tipo SCF/ACF        |
   |---|---|
   | `text`                | `text`               |
   | `imagen` / `image`    | `image`               |
   | `group`               | `group`               |
   | `Repeater`            | `repeater`             |
   | `select`              | `select`               |
   | `wysiwyg` / `código`  | `wysiwyg`               |
   | `link` / `cta`        | `link`                   |
   | `booleano` / `true/false` | `true_false`         |

   Si aparece una anotación que no está en esta tabla, preguntar al usuario a qué tipo de campo de SCF corresponde antes de generar el JSON.
7. **Location rules**: si el usuario no especifica dónde va a aplicar el grupo (qué post type, plantilla, o página), dejar `location` como un array vacío de reglas de ejemplo razonable basado en el contexto que ya se conoce (ej. si el componente se está conectando a `home.php`, usar `page_template == template-home.php` o el post type correspondiente) y **avisar explícitamente que hay que confirmar/ajustar el location rule a mano en el admin**, igual que se hace con la generación de campos en `acf-json/` (Paso 5 del `SKILL.md` principal).
8. **Formato de imagen fields**: replicar el patrón visto en los componentes PHP existentes (return format array con `url`/`alt`), o sea en el JSON usar `"return_format": "array"`, `"preview_size": "medium"`, `"library": "all"` salvo que el usuario indique otra cosa.
9. **Entregar el JSON como array** (`[ { ...grupo... } ]`), igual que el archivo de ejemplo del usuario — es el formato que espera la pantalla de importación de SCF.
10. **Guardar el archivo** dentro de `field-groups-json/` en la raíz del tema (crearla si no existe) — sirve como artefacto versionado en git, revisable y portable entre entornos (ver nota de despliegue abajo). Nombrar el archivo como el slug del field group (ej. `home.json`).
11. **Si hay WP-CLI accesible en el entorno** (`ddev wp --info`, `wp --info`, o vía SSH — confirmar antes de asumir), **importar el JSON directamente a la base de datos ejecutándolo uno mismo**, sin pedirle al usuario que lo haga a mano desde Field Groups → Tools → Import:
    ```bash
    ddev wp acf json import wp-content/themes/<tema>/field-groups-json/<archivo>.json
    ```
    Confirmado en la práctica: si el grupo ya existe (mismo `key`), lo **actualiza** en vez de duplicarlo — seguro para reimportar después de corregir un campo. Si no hay WP-CLI disponible en ese entorno, ese es el único caso en el que queda como paso manual para el usuario (Tools → Import).

**Por qué igual guardar el `.json` en el repo aunque se importe automáticamente:** el pipeline de despliegue de este tipo de proyecto (ver `CLAUDE.md` del repo — deploy vía FTP a producción) sincroniza archivos, **no** la base de datos. Si el grupo de campos solo se escribe en la base de datos local (por UI o por `wp acf json import`) y el `.json` no queda commiteado, producción nunca va a tener ese grupo de campos. El archivo en `field-groups-json/` es lo que permite reproducirlo en cualquier otro entorno (repitiendo el mismo comando de import ahí).

## Ejemplo de esqueleto de salida (componente suelto)

```json
[
    {
        "key": "group_XXXXXXXXXXXXX",
        "title": "Nombre Componente",
        "fields": [
            {
                "key": "field_XXXXXXXXXXXXX",
                "label": "Título",
                "name": "nombre-componente__title",
                "type": "text"
            }
        ],
        "location": [[{ "param": "page_template", "operator": "==", "value": "..." }]],
        "menu_order": 0,
        "position": "normal",
        "style": "default",
        "label_placement": "top",
        "instruction_placement": "label",
        "hide_on_screen": "",
        "active": true,
        "description": ""
    }
]
```

## Ejemplo de esqueleto de salida (página completa, varios componentes — Flexible Content, DEFAULT)

Un solo field group compartido, un único campo `flexible_content`, cada componente como un `layout` con sus propios `sub_fields`:

```json
[
    {
        "key": "group_XXXXXXXXXXXXX",
        "title": "Página Flexible",
        "fields": [
            {
                "key": "field_XXXXXXXXXXXXX",
                "label": "Secciones de la página",
                "name": "page-builder",
                "type": "flexible_content",
                "button_label": "Agregar sección",
                "layouts": [
                    {
                        "key": "layout_XXXXXXXXXXXXX",
                        "name": "purpose-banner",
                        "label": "Purpose Banner",
                        "display": "block",
                        "sub_fields": [
                            {
                                "key": "field_XXXXXXXXXXXXX",
                                "label": "Título",
                                "name": "purpose-banner__title",
                                "type": "text"
                            }
                        ]
                    },
                    {
                        "key": "layout_XXXXXXXXXXXXX",
                        "name": "origins-cards",
                        "label": "Origins Cards",
                        "display": "block",
                        "sub_fields": [
                            {
                                "key": "field_XXXXXXXXXXXXX",
                                "label": "Tarjetas",
                                "name": "origins-cards__items",
                                "type": "repeater",
                                "layout": "block",
                                "sub_fields": []
                            }
                        ]
                    }
                ]
            }
        ],
        "location": [[{ "param": "page_template", "operator": "==", "value": "templates/flexible-page.php" }]],
        "menu_order": 0,
        "position": "normal",
        "style": "default",
        "label_placement": "top",
        "instruction_placement": "label",
        "hide_on_screen": [],
        "active": true,
        "description": ""
    }
]
```

`layout_XXXXXXXXXXXXX` sigue el mismo patrón pseudo-aleatorio que `group_`/`field_` (prefijo + 13 hex). Cada `key` de layout y de field debe ser única — no reutilizar entre layouts distintos.

**Nota de compatibilidad SCF confirmada:** el mecanismo de import de SCF (`wp acf json import` y el sync del admin) expande automáticamente `layouts[].sub_fields` en registros de campo hijos reales (con `parent` = key del campo flexible content y `parent_layout` = key del layout) — no hace falta aplanarlo a mano. Si tras importar un layout nuevo sus campos no aparecen (`get_sub_field()` devuelve vacío), sospechar primero de una `key` de campo reutilizada de un field group viejo/borrado que dejó una referencia meta cacheada apuntando mal — más seguro regenerar `key`s nuevas para campos que antes pertenecían a otro field group.

## Ejemplo: campo de color de fondo clonado en cada layout (ver `naming-conventions.md`)

Field group aparte, sin `location`, que existe solo como fuente para clonar (nunca se edita como pantalla propia):

```json
[
    {
        "key": "group_XXXXXXXXXXXXX",
        "title": "Color de Fondo (fuente para clonar)",
        "fields": [
            {
                "key": "field_SOURCE_SELECT",
                "label": "Color de fondo",
                "name": "bg-color",
                "type": "select",
                "instructions": "Si no se elige nada, la sección mantiene su color de fondo por defecto.",
                "choices": {
                    "primary": "Ámbar",
                    "secondary-dk": "Verde oscuro",
                    "background": "Crema (fondo)"
                },
                "allow_null": true,
                "multiple": false,
                "ui": true,
                "return_format": "value"
            }
        ],
        "location": [],
        "menu_order": 0,
        "position": "normal",
        "style": "default",
        "label_placement": "top",
        "instruction_placement": "label",
        "hide_on_screen": [],
        "active": true,
        "description": "Field group sin location — existe solo para clonar 'bg-color' en cada layout. No editar desde ninguna pantalla de contenido."
    }
]
```

Y dentro de CADA layout que deba tener color de fondo seleccionable, se le agrega (idealmente como primer sub_field) un campo `clone` apuntando a `field_SOURCE_SELECT`:

```json
{
    "key": "field_CLONE_EN_ESTE_LAYOUT",
    "label": "Color de fondo",
    "name": "bg-color-clone",
    "type": "clone",
    "clone": ["field_SOURCE_SELECT"],
    "display": "seamless",
    "layout": "block",
    "prefix_label": false,
    "prefix_name": false
}
```

`prefix_name: false` + `display: "seamless"` son los que garantizan que el campo se guarde siempre como `bg-color` (no `nombre-layout_bg-color`), sin importar en qué layout esté — así el componente PHP siempre hace `get_sub_field('bg-color')` igual, sin depender de `$class_name`. Cada layout necesita su propia `key` de clone (única), pero todos referencian el mismo `field_SOURCE_SELECT`.

## Ejemplo de esqueleto de salida (página completa, field group fijo — patrón viejo C, solo si el usuario lo pide explícitamente)

Un solo field group para la página, cada componente como campo `group` de nivel superior (sin reordenamiento libre):

```json
[
    {
        "key": "group_XXXXXXXXXXXXX",
        "title": "Home",
        "fields": [
            {
                "key": "field_XXXXXXXXXXXXX",
                "label": "Purpose Banner",
                "name": "purpose-banner",
                "type": "group",
                "sub_fields": [
                    {
                        "key": "field_XXXXXXXXXXXXX",
                        "label": "Título",
                        "name": "purpose-banner__title",
                        "type": "text"
                    }
                ]
            }
        ],
        "location": [[{ "param": "page_template", "operator": "==", "value": "templates/home.php" }]],
        "menu_order": 0,
        "position": "normal",
        "style": "default",
        "label_placement": "top",
        "instruction_placement": "label",
        "hide_on_screen": [],
        "active": true,
        "description": ""
    }
]
```

## Inferencia visual cuando la imagen NO trae anotaciones de texto

Si el usuario pide construir el JSON a partir de un diseño **sin** anotaciones a mano (sin flechas ni texto tipo `campo: tipo`), hay que inferir la estructura visualmente. Reglas:

**Señales fuertes para inferir `repeater`:**
- Bloques visuales repetidos con la misma estructura interna (misma disposición de imagen/título/texto) pero contenido distinto → repeater.
- Indicadores de slider/carrusel (flechas de navegación, dots de paginación, scroll horizontal) → refuerza repeater, y probablemente se implemente con Swiper igual que `slider-main.php`/`slider-category.php`.

**Cómo inferir los campos dentro de cada ítem repetido:**
Por rol visual: lo grande/arriba suele ser imagen o ícono, texto corto en negrita/mayor tamaño suele ser título, texto de párrafo es descripción, elementos con `href` implícito (botón, flecha, "ver más") son link/CTA. Mapear cada uno al tipo SCF correspondiente con la tabla de tipos ya definida.

**Casos donde NO hay que asumir — proponer y confirmar antes de generar el JSON:**
1. **Cantidad fija vs. dinámica.** Ver 3 tarjetas en el diseño no dice si son 3 campos fijos o un repeater real que puede crecer. Proponer la lectura más probable (si hay flechas/paginación → repeater; si es un layout claramente fijo tipo "3 columnas de servicios que no van a cambiar" → considerar campos fijos) pero confirmar con el usuario.
2. **Repeater vs. Flexible Content.** Si los ítems repetidos NO comparten la misma estructura entre sí (layouts distintos por ítem), es probablemente `flexible_content` con varios layouts, no un `repeater` simple — confirmar antes de generar.
3. **Campos opcionales dentro del ítem.** Si algunas repeticiones muestran un elemento (ej. ícono) y otras no, puede ser un campo opcional (aplica regla dura #11 de `code-patterns.md`, con su `if`) o dos variantes de layout distintas — confirmar cuál es.

**Flujo obligatorio en este caso:** armar una propuesta de estructura (qué es repeater, qué campos tiene cada ítem, qué tipo tiene cada uno) y mostrarla al usuario en texto/lista **antes** de generar el JSON final — nunca generar el JSON directo a partir de una inferencia visual sin confirmar.

---

## Cuándo preguntar

- Si un tipo anotado no está en la tabla de mapeo.
- Si hay ambigüedad real de tipo (`text|image` explícito) — confirmar si el patrón grupo+booleano aplica o si el usuario prefiere otra solución.
- Si no queda claro a qué post type/plantilla se debe asignar el `location` rule.
