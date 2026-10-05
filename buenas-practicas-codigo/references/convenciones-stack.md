# Convenciones según el stack

Aplicar solo si el proyecto utiliza estas herramientas. Leer la skill especializada y el código vigente antes de asumir rutas o nombres.

## WordPress con SCF

- Identidad del componente al inicio (`$class_name`) y nombres derivados coherentes con la norma BEM del proyecto. No renombrar campos persistidos sin evaluar los datos y consumidores.
- Componentes reutilizables y reordenables: usar el dispatcher y los layouts de Flexible Content existentes; evitar duplicar plantillas o field groups por página.
- En el patrón propio, cada ítem iterable se renderiza en `cards/` mediante `get_template_part()` con argumentos explícitos. Esta regla de archivos es específica del stack, no una obligación para cada bucle en cualquier lenguaje.
- Verificar el formato real de retorno de campos y escapar texto, atributos y URLs en su contexto. No asumir que SCF es ACF Pro.
- Verificar cómo se sincronizan los field groups: un JSON editado no implica cambio en la base. Preservar keys y datos al actualizar; importar y releer cuando sea parte del cambio autorizado.
- Reutilizar wrappers existentes para sliders y utilidades de fondo; no inicializar una segunda implementación equivalente.

## Core Tailwind de ELAN-SK

- Leer design.md antes de reutilizar incluso un átomo existente: su forma, color y uso pueden no corresponder al diseño actual.
- La paleta y tipografía se definen en fuentes de tokens; consumir roles semánticos y colores `on-*`, sin replicar valores literales en componentes ni editar CSS compilado.
- Revisar los valores reales del rol antes de elegirlo. No crear un token nuevo para encubrir una referencia rota ni asumir un tono por su nombre.
- Usar clases y `@apply` según el core. CSS directo solo cuando la utilidad disponible no exprese la necesidad.
- Layouts simples con `flex-grid`, sus columnas y `flex-grid-gap-*`; grid real si la estructura compleja lo requiere. No extrapolar esta preferencia a proyectos sin ese core.
- Copiar estructura y clases desde el catálogo o un uso real. Adaptar un caso particular localmente; no cambiar un átomo global sin revisar el impacto.
- Crear CSS separado cuando se reutilice o su complejidad lo justifique; para un uso sencillo, mantener las utilidades en el markup.
- Revisar móvil, overflow y herencia de color; un build exitoso no verifica contraste ni disposición visual.
- Las utilidades de Tailwind v4 viven en `@layer` y pierden contra CSS sin capa del tema (p. ej. `a{color:inherit}`): cuando choquen, usar el modificador `!` (`text-blue!`) en lugar de subir especificidad a mano.

## Referencias

- Biblioteca: #754, Class Name en WordPress; #757, Core de css con TailwindCSS; #1306, Componentes flexibles con SCF.
- Skills especializadas: wp-scf-component-builder, tw-design-system y wp-swiper-slider-builder (solo para sliders).
- Las restricciones de navegador y alcance del usuario prevalecen sobre automatismos de cualquier referencia.
