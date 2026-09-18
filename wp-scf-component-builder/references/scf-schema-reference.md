# Referencia del JSON Schema real de SCF (verificado, no de memoria)

Extraído programáticamente (no leído "a ojo") de los schemas que el propio plugin publica en su repo: `WordPress/secure-custom-fields`, rama `trunk`, carpeta `schemas/` (`field-group.schema.json`, `field.schema.json`, `common.schema.json`). Se puede volver a descargar y reprocesar así si hace falta reverificar:

```bash
curl -s "https://raw.githubusercontent.com/WordPress/secure-custom-fields/trunk/schemas/field.schema.json" -o field.schema.json
curl -s "https://raw.githubusercontent.com/WordPress/secure-custom-fields/trunk/schemas/field-group.schema.json" -o field-group.schema.json
```

Esta es la fuente de verdad para construir cualquier JSON de field group — más confiable que artículos de terceros o que asumir el formato viejo de export de ACF. Si algo de acá no coincide con lo que se ve en el admin real de un sitio, priorizar lo que diga la versión de SCF instalada en ese sitio por sobre este documento (el schema puede evolucionar).

## Reglas generales de validación

- **`additionalProperties: false` en todos lados** — cada tipo de campo solo acepta las propiedades listadas para ese tipo específico. No inventar propiedades por analogía con ACF clásico sin confirmar que están en la tabla de abajo.
- **`key` del field group**: debe matchear `^group_.+$`.
- **`key` de cada campo**: debe matchear `^field_.+$`.
- **`name` de cada campo**: debe matchear `^[a-zA-Z0-9_-]*$` (soporta `_` y `-`, coherente con el naming BEM de `naming-conventions.md` que usa `__` para separar componente/campo).
- Cada campo requiere como mínimo: `key`, `label`, `name`, `type`.
- Dentro de un field group, los campos **no necesitan `parent`** explícito (el schema de field-group referencia la definición de campo sin exigir `parent`; sí lo exige el schema standalone `field.schema.json` usado fuera de un grupo, pero no es nuestro caso).
- `sub_fields` (en `group`, `repeater`, `flexible_content` layouts) es simplemente `{"type": "array"}` — no se valida recursivamente contra la lista de tipos, así que los campos anidados no requieren nada especial por estar anidados.

## Propiedades base que acepta CUALQUIER tipo de campo

`key`, `label`, `name`, `aria-label`, `type`, `instructions`, `required`, `conditional_logic`, `wrapper` (`{width, class, id}`), `menu_order`, `parent`, `parent_layout`.

## Field group (nivel `home`/página/componente) — propiedades permitidas

`key`, `title`, `fields`, `location`, `menu_order`, `active`, `modified`, `position`, `style`, `label_placement`, `instruction_placement`, `hide_on_screen`, `description`, `show_in_rest`, `allow_ai_access`, `ai_description`, `display_title`.

| Propiedad | Valores válidos |
|---|---|
| `position` | `normal` \| `side` \| `acf_after_title` |
| `style` | `default` \| `seamless` |
| `label_placement` | `top` \| `left` |
| `instruction_placement` | `label` \| `field` |
| `hide_on_screen` | **array** (no string) de: `permalink`, `the_content`, `excerpt`, `custom_fields`, `discussion`, `comments`, `revisions`, `slug`, `author`, `format`, `page_attributes`, `featured_image`, `categories`, `tags`, `send-trackbacks`. Si no se oculta nada, usar `[]` — **nunca `""`** (gotcha real: el formato viejo de export de ACF usaba `""`, SCF lo rechaza). |

`location`: array de arrays de reglas (`locationGroup[]`, OR entre grupos, AND dentro del grupo). Cada regla (`locationRule`) requiere `param`, `operator` (`==` o `!=` únicamente), `value` (string).

## Tabla de propiedades extra por tipo de campo

Además de las propiedades base de arriba, cada `type` acepta estas propiedades adicionales (y ninguna otra):

| `type` | Propiedades extra permitidas |
|---|---|
| `text` | `append`, `default_value`, `maxlength`, `placeholder`, `prepend` |
| `textarea` | `default_value`, `maxlength`, `new_lines`, `placeholder`, `rows` |
| `number` | `append`, `default_value`, `max`, `min`, `placeholder`, `prepend`, `step` |
| `range` | `append`, `default_value`, `max`, `min`, `placeholder`, `prepend`, `step` |
| `email` | `append`, `default_value`, `placeholder`, `prepend` |
| `url` | `default_value`, `placeholder` |
| `password` | `append`, `placeholder`, `prepend` |
| `wysiwyg` | `default_value`, `delay`, `media_upload`, `tabs`, `toolbar` |
| `true_false` | `default_value`, `message`, `ui`, `ui_off_text`, `ui_on_text` |
| `select` | `ajax`, `allow_null`, `choices`, `create_options`, `default_value`, `multiple`, `placeholder`, `return_format`, `save_options`, `ui` |
| `checkbox` | `allow_custom`, `choices`, `custom_choice_button_text`, `default_value`, `layout`, `return_format`, `save_custom`, `toggle` |
| `radio` | `allow_null`, `choices`, `default_value`, `layout`, `other_choice`, `return_format`, `save_other_choice` |
| `button_group` | `allow_null`, `choices`, `default_value`, `layout`, `return_format` |
| `image` | `library`, `max_height`, `max_size`, `max_width`, `mime_types`, `min_height`, `min_size`, `min_width`, `preview_size`, `return_format` |
| `gallery` | `insert`, `library`, `max`, `max_height`, `max_size`, `max_width`, `mime_types`, `min`, `min_height`, `min_size`, `min_width`, `preview_size`, `return_format` |
| `file` | `library`, `max_size`, `mime_types`, `min_size`, `return_format` |
| `oembed` | `height`, `width` |
| `link` | `return_format` |
| `page_link` | `allow_archives`, `allow_null`, `multiple`, `post_type`, `taxonomy` |
| `post_object` | `allow_null`, `bidirectional_target`, `multiple`, `post_type`, `return_format`, `taxonomy`, `ui` |
| `relationship` | `bidirectional_target`, `elements`, `filters`, `max`, `min`, `post_type`, `return_format`, `taxonomy` |
| `taxonomy` | `add_term`, `allow_null`, `bidirectional_target`, `field_type`, `load_terms`, `multiple`, `return_format`, `save_terms`, `taxonomy` |
| `user` | `allow_null`, `bidirectional_target`, `multiple`, `return_format`, `role` |
| `nav_menu` | `allow_null`, `container`, `save_format` |
| `google_map` | `center_lat`, `center_lng`, `height`, `zoom` |
| `date_picker` | `default_to_current_date`, `display_format`, `first_day`, `return_format` |
| `date_time_picker` | `default_to_current_date`, `display_format`, `first_day`, `return_format` |
| `time_picker` | `display_format`, `return_format` |
| `color_picker` | `custom_palette_source`, `default_value`, `enable_opacity`, `palette_colors`, `return_format`, `show_color_wheel` |
| `icon_picker` | `default_value`, `library`, `return_format`, `tabs` |
| `group` | `layout` (`block`\|`table`\|`row`, default `block`), `sub_fields` |
| `repeater` | `button_label`, `collapsed`, `layout` (`block`\|`table`\|`row`, default `table`), `max`, `min`, `pagination`, `rows_per_page`, `sub_fields` |
| `flexible_content` | `button_label`, `layouts`, `max`, `min` |
| `clone` | `clone`, `display` (`group`\|`seamless`), `layout`, `prefix_label`, `prefix_name` |
| `tab` | `endpoint`, `placement`, `selected` |
| `accordion` | `endpoint`, `multi_expand`, `open` |
| `message` | `esc_html`, `message`, `new_lines` |
| `output` | `html` |
| `separator` | (ninguna extra) |

`layout` (para `group`/`repeater`/`clone`) acepta únicamente: `block`, `table`, `row`.

## Aplicación práctica

Antes de agregar cualquier propiedad a un campo que no esté en la tabla de arriba para ese `type`, no asumirla — buscarla acá primero, y si no aparece, no incluirla (o volver a descargar el schema por si se agregó una versión nueva).
