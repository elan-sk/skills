---
name: buenas-practicas-codigo
description: Unifica las convenciones de ELAN-SK para construir y revisar código con una fuente de verdad, módulos verificables, reutilización, código mínimo e inventario de impacto. Usar al implementar lógica o componentes y al revisar su estructura, o cuando el usuario diga "buenas prácticas", "revisá este código", "¿está bien hecho?"; adaptar las reglas al stack y al alcance solicitado.
---

# Buenas prácticas de construcción de código

Aplicar estas decisiones dentro del cambio pedido. No autoriza refactorizaciones ajenas, instalaciones, migraciones, commits, publicaciones ni uso del navegador. Las instrucciones vigentes del usuario y del proyecto prevalecen sobre esta síntesis.

## Antes de editar

- Leer AGENTS.md y MEMORY.md; consultar docs/ para resolver contexto y design.md cuando se toque UI. Verificar que las referencias sigan existiendo.
- Expresar brevemente lo entendido. Preguntar solo por ambigüedades reales; continuar si el cambio es directo y está autorizado.
- Buscar implementaciones, helpers, tokens y componentes probados antes de crear equivalentes. En proyectos que usan Biblioteca Depura, consultar sus instructivos aplicables mediante biblioteca-depura. Si no hay algo reutilizable, decirlo.
- Verificar viabilidad antes de construir; si algo no es viable, decirlo de una vez con la razón técnica. Si lo pedido es técnicamente peor que una alternativa, decirlo en vez de dar la razón por defecto.
- Inventario de impacto: localizar todos los consumidores del comportamiento o dato que cambia (pantallas, listas, buscador, filtros, reportes, API, chat/bot, exportaciones, permisos) y los invisibles (tareas programadas, colas, resúmenes y avisos por WhatsApp, notificaciones o correo). Cada uno queda «se ajusta» o «no aplica, porque…» y se menciona en el cierre. Dimensionar la revisión al impacto real.

## Fuente única de verdad

- Identificar quién define cada dato: configuración, persistencia, entrada del usuario o cálculo. Derivar valores secundarios desde esa fuente; no mantener copias editables independientes.
- Declarar configuración, identidad del módulo y entradas normalizadas antes de la lógica que depende de ellas. Mantener variables temporales en el ámbito más pequeño útil, cerca de su uso; «al principio» no significa convertir todo en global.
- Evitar valores mágicos repetidos y nombres concatenados a mano cuando pueden derivarse de una identidad común. No convertir cada literal obvio en una constante.
- Separar lectura de entradas, validación/normalización, transformación y salida cuando facilite comprobar el comportamiento. No releer una fuente mutable varias veces durante una misma operación sin necesidad.
- Los compilados son resultados: cambiar la fuente y ejecutar el proceso existente cuando corresponda. No reparar a mano el resultado generado.

## Módulos que se puedan verificar

- Dividir por responsabilidad y motivo de cambio, no por una cantidad arbitraria de líneas. Cada módulo debe permitir explicar entradas, salida, dependencias y errores.
- Hacer explícitas las dependencias mediante parámetros o interfaces existentes; evitar estado global oculto. Separar cálculos de efectos externos cuando permita probarlos sin red, base de datos o navegador.
- Extraer código compartido cuando haya reutilización real o complejidad que lo justifique. No crear wrappers, servicios o archivos solo para fragmentar código sencillo.
- Usar nombres por función o estructura, no por el contenido temporal ni por una tecnología intercambiable. Conservar las convenciones efectivas del repositorio.
- Código mínimo y legible: ternario inline en asignaciones simples en vez de if/else, sin variables intermedias que no se reutilicen ni aclaren, sin código comentado ni «por si acaso». Si el cambio deja código huérfano, eliminarlo. Comentar el porqué, no el qué.
- No alterar contratos compartidos para resolver un único uso. Adaptar localmente si basta; revisar consumidores si el contrato realmente debe cambiar.

## Datos y estados

- Definir qué sucede con datos vacíos, inválidos, fallos y estados ya guardados. No rellenar silenciosamente contenido editorial ausente con texto inventado.
- Respetar el contrato de tipos y distinguir ausencia, cero y falso cuando tengan significados distintos. Validar en el límite de entrada y escapar la salida según el contexto.
- No escribir credenciales, tokens ni datos personales en código, repositorio, respaldos, Biblioteca o memoria. Leerlos de configuración local o variables de entorno excluidas del control de versiones; no imprimirlos en la salida.
- No tragar errores: un fallo se maneja, se registra o se propaga, nunca se silencia.
- Para cambios de esquema o persistencia, revisar compatibilidad y lectura de datos existentes antes de escribir; no inferir que editar un archivo sincroniza la base de datos.

## Verificación y cierre

- Relacionar el comportamiento pedido con una comprobación observable. Usar las herramientas existentes y la verificación mínima suficiente: sintaxis, tipos, lint, build o pruebas de comportamiento según el riesgo.
- No crear tests que solo repliquen la implementación ni suites para ajustes triviales. En bugs, comprobar la condición original y los consumidores afectados.
- Comprobar reapertura de datos guardados cuando el flujo persista información. Para UI, considerar móvil, estados, contenido real y accesibilidad básica (alt, labels, foco visible, contraste); compilar no demuestra fidelidad visual.
- Tras un deploy, purgar las cachés existentes (página, CDN, OPcache) antes de dar por verificado en el entorno real.
- Abrir o controlar un navegador solo con autorización explícita para la tarea. Reportar qué quedó sin verificar visualmente.
- Cerrar con qué cambió, qué se verificó, el inventario de impacto y limitaciones reales; enlazar archivos editados. Guardar en la memoria solo decisiones duraderas, sin duplicar código ni historial.
- Mejoras detectadas fuera del alcance (refactor, caso borde, dato útil para mostrar): proponerlas concretas en el cierre, sin aplicarlas ni mezclarlas con el cambio pedido.

## Convenciones condicionales

Para WordPress/SCF o el core Tailwind de ELAN-SK, leer [referencias por stack](references/convenciones-stack.md). No aplicar esas preferencias a otros stacks por analogía ni instalar el core como efecto colateral.

Para requisitos complejos, aprovechar los criterios de impacto y trazabilidad de sdd; ejecutar su proceso completo solo cuando esa skill sea aplicable o haya sido solicitada. Esta skill no crea specs ni tareas de PMSK automáticamente.

## Procedencia y mantenimiento

Síntesis del 2026-10-04: instrucciones y memoria del proyecto de origen; skills biblioteca-depura, skill-creator, sdd, tw-design-system y wp-scf-component-builder. Incorpora el pedido explícito de centralizar variables y dividir en módulos verificables. Revisión del 2026-10-04: inventario de impacto completo, código mínimo, secretos, errores, accesibilidad, cachés tras deploy y sugerencias fuera de alcance. La revisión directa de proyectos personales queda pendiente de que el usuario identifique las rutas.

Los instructivos de Biblioteca relacionados son #754 (naming WordPress), #757 (core Tailwind) y #1306 (componentes flexibles). Consultar su versión vigente cuando apliquen; no copiar aquí sus manuales completos.
