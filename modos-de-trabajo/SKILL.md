---
name: modos-de-trabajo
description: Formato de confirmación de alineación con el usuario y modos de trabajo. Se dispara con "/entendido", "/dudas" (o esas palabras sueltas usadas como comando), "/consulta" (solo lectura, para evaluar una idea o viabilidad sin tocar nada), "/solo" (recopilar todas las preguntas por adelantado y luego trabajar sin pedir más confirmaciones) y "/solo-ya" (arrancar de inmediato con lo claro y dejar las dudas para el reporte final). En los modos solo quedan prohibidas las acciones destructivas o irreversibles; con listas de 5 o más ítems se entrega además un informe HTML con checklist.
---

# Entendido / Dudas / Consulta / Solo / Solo-ya

Formato de confirmación de alineación antes de ejecutar un pedido, modo de evaluación sin tocar archivos, y modo de trabajo autónomo desatendido (preguntando todo por adelantado, o resolviendo al vuelo y reportando al final).

## Disparadores

- `/entendido` (o "entendido"/"ok" usado como comando de confirmación, no como palabra suelta en una frase)
- `/dudas` (o "dudas" usado como comando de confirmación)

`/consulta`, `/solo` y `/solo-ya` NO son disparadores directos de esta skill — tienen sus propios comandos dedicados (`commands/consulta.md`, `commands/solo.md`, `commands/solo-ya.md`) que se activan al escribirlos y delegan en las secciones de más abajo para el detalle de comportamiento. Así se evita que compitan dos mecanismos por el mismo trigger.

## Comportamiento

### `/entendido`
Responder SIEMPRE con dos partes, nunca solo un sí/no:
1. Confirmación explícita de si se entendió o no ("Sí, entendí" / "No, no me quedó claro").
2. Qué fue exactamente lo que se entendió — repetido con mis propias palabras, en base al pedido más reciente del usuario.

### `/dudas`
Responder SIEMPRE con tres partes:
1. Confirmación explícita de si se entendió o no.
2. Qué fue lo que se entendió — repetido con mis propias palabras.
3. Dudas concretas, si las hay. Si no hay ninguna duda real, decirlo explícitamente ("No tengo dudas") en vez de omitir la sección.

### `/consulta` (o "consulte viabilidad", "consultar viabilidad")
Modo estrictamente de solo lectura. El pedido es evaluar una idea, metodología o viabilidad — NO ejecutar, implementar, ni tocar ningún archivo del proyecto.
- Permitido: leer/investigar (Read, Grep, Explore, WebSearch, WebFetch) para fundamentar la respuesta.
- Prohibido: Edit, Write, o cualquier comando que modifique, cree o mueva archivos — incluso si la conclusión de la evaluación es "sí, hacelo".
Responder con tres partes:
1. Evaluación u opinión directa (viable / no viable / con matices).
2. Fundamento técnico — por qué, comparado con qué.
3. Si implementar la conclusión requeriría tocar archivos, decirlo explícitamente y preguntar si se procede — nunca ejecutar por cuenta propia dentro de una `/consulta`.

### `/solo`
Modo de trabajo autónomo desatendido. El usuario se va a desconectar justo después de dar la orden (dormir, salir) y espera el resultado listo para cuando vuelva — no va a poder responder preguntas mientras tanto.

1. Al recibir `/solo`, ANTES de ejecutar nada, hacer TODAS las preguntas necesarias para tener el pedido 100% claro — de una sola vez (AskUserQuestion si son opciones concretas, lista numerada si son abiertas). No dosificar preguntas para después: esta es la única ventana para preguntar. La investigación previa a esas preguntas (leer código, memoria, estado del repo) debe ser breve y quedar contenida en un solo tramo de tool calls — no encadenar rondas y rondas de exploración en silencio. Si la investigación se estira, cortarla y responder ya con lo que se tiene: confirmar entendimiento + las preguntas reales que queden, aunque la exploración no esté 100% terminada. El usuario que dispara `/solo` espera desconectarse rápido; dejarlo esperando sin señales mientras se sigue investigando contradice el propósito del modo.
2. Una vez respondidas, enviar SIEMPRE un mensaje aparte que diga explícitamente en qué estado queda el usuario: si ya se puede ir ("Listo, tengo todo claro, andá tranquilo") o si todavía falta algo antes de poder irse — nunca dejarlo sin esa definición clara. Después de mandar ese mensaje, ESPERAR a que el usuario confirme que lo vio (alcanza un simple "ok"/"dale") antes de arrancar a trabajar. No empezar a ejecutar nada del trabajo autónomo hasta recibir esa confirmación — recién ahí se suspende la regla general de "preguntar antes de actuar" del CLAUDE.md global mientras dure el `/solo`.
3. Antes de tocar cualquier archivo, correr `git status`. Si YA hay cambios sin commitear (trabajo previo del usuario, no propio), commitearlos primero como punto de seguridad — mensaje claro de que son cambios previos del usuario — ANTES de arrancar el trabajo propio. Así, si algo del `/solo` sale mal, hay una base limpia para volver sin arriesgar lo que el usuario ya tenía hecho. Si el working tree ya está limpio, saltear este paso.
4. Si surge una duda real durante el trabajo y el usuario no está disponible: no detenerse a esperar. Inferir la opción más adecuada en base a memoria (preferencias guardadas, feedback anterior, convenciones ya usadas en el proyecto) y seguir. Dejar registrado qué se asumió y por qué, para que el usuario lo revise al volver.
5. Prohibido de forma absoluta, sin excepción ni siquiera con `/solo` activo: cualquier acción destructiva o irreversible — borrar/truncar bases de datos, `git reset --hard`, `git push --force`, `rm -rf` sin respaldo, sobrescribir trabajo previo sin poder recuperarlo. Todo lo que se toque debe poder revertirse (checkpoints/branches antes de cambios grandes, respaldo antes de tocar datos). Los cambios PROPIOS del `/solo` no se commitean al terminar (ver paso 3: ese commit es solo para aislar el punto de partida, no para el trabajo propio) — el usuario hace sus propios commits cuando vuelve, salvo que pida explícitamente lo contrario.
6. Siempre entregar algún resultado concreto al terminar — no queda permitido terminar con las manos vacías. Si no se puede completar todo, entregar la porción máxima razonable y dejar notas claras de qué falta y por qué. Si el pedido era una lista de 5 o más ítems, entregar además el informe de resultados (ver la sección "Informe de resultados"); la URL base de la app para los links de prueba se resuelve en la ronda de preguntas inicial si no se puede deducir de la config del proyecto.
7. Al volver el usuario, se espera una ronda de ajustes sobre lo entregado — es parte normal del flujo, no señal de que algo salió mal.

### `/solo-ya`
Modo de trabajo autónomo, igual que `/solo` en el fondo (sin frenar a pedir confirmación por cada paso, sin acciones destructivas/irreversibles), pero con la ronda de preguntas invertida: en vez de preguntar todo por adelantado, arranca a trabajar YA con lo que esté claro y deja las preguntas/dudas para el reporte final. Pensado para cuando el usuario sigue disponible y prefiere ver avance rápido en vez de esperar una tanda de preguntas antes de empezar.

1. Al recibir `/solo-ya`, NO hacer una ronda previa de preguntas. Empezar a trabajar de inmediato con la parte del pedido que esté clara.
2. Si durante el trabajo surge algo ambiguo o dudoso: no detenerse a preguntar. Resolverlo con el criterio más razonable disponible (memoria — preferencias guardadas, feedback anterior —, convenciones ya usadas en el proyecto, o la interpretación más literal y mínima del pedido) y seguir. Registrar qué se asumió y por qué, para reportarlo al final.
3. Antes de tocar cualquier archivo, correr `git status`. Si YA hay cambios sin commitear (trabajo previo del usuario, no propio), commitearlos primero como punto de seguridad — mensaje claro de que son cambios previos del usuario — ANTES de arrancar el trabajo propio. Si el working tree ya está limpio, saltear este paso.
4. Prohibido de forma absoluta, sin excepción ni siquiera con `/solo-ya` activo: cualquier acción destructiva o irreversible — borrar/truncar bases de datos, `git reset --hard`, `git push --force`, `rm -rf` sin respaldo, sobrescribir trabajo previo sin poder recuperarlo. Todo lo que se toque debe poder revertirse. Los cambios PROPIOS del `/solo-ya` no se commitean al terminar (el commit del paso 3 es solo para aislar el punto de partida) — el usuario hace sus propios commits, salvo que pida explícitamente lo contrario.
5. Siempre entregar algún resultado concreto al terminar — no queda permitido terminar con las manos vacías. Si no se puede completar todo, entregar la porción máxima razonable. Si el pedido era una lista de 5 o más ítems, entregar además el informe de resultados (ver la sección "Informe de resultados").
6. Al terminar (o al toparse con un límite real que impide seguir), reportar SIEMPRE en un solo mensaje con tres partes:
   1. Qué se hizo concretamente.
   2. Qué se asumió o infirió en el camino y por qué (los puntos del paso 2).
   3. Preguntas o dudas reales que quedaron abiertas — si no hubo ninguna, decirlo explícitamente ("No quedaron dudas") en vez de omitir la parte.
7. A diferencia de `/solo`, acá no hay mensaje de "listo, andá tranquilo" antes de empezar — el momento de preguntar/aclarar se corrió del principio al final.

## Informe de resultados (listas grandes)

Aplica dentro de `/solo` y `/solo-ya` cuando el pedido trae una lista de **5 o más ítems** (puntos numerados, viñetas, un documento de instrucciones con varias tareas). Con menos ítems alcanza el reporte del chat. No aplica a `/consulta` (solo lectura).

1. **Qué generar**: un único HTML dentro del proyecto, en `docs/informe-<tema>/informe.html` (`<tema>` en kebab-case corto; si ya existe uno del mismo tema, agregar la fecha al nombre de la carpeta). Se crea desde `templates/informe.html` (en esta misma carpeta de la skill): copiarla y reemplazar SOLO el JSON de `<script id="informe-data">` — no rediseñar ni tocar el script. No se commitea (misma regla del modo). El JSON no puede contener la secuencia `</script`.
2. **Un ítem del JSON por cada ítem pedido**, en el mismo orden y con el título que usó el usuario. Campos: `id`, `titulo`, `estado` (`hecho` | `parcial` | `no_hecho`), `paso`, `pasos` (lista), `debe`, `link`, `linkTexto`, `comando`.
   - `paso` = "Qué pasó": qué se hizo, qué se asumió y por qué, y cualquier límite. Es el lugar de las suposiciones ítem por ítem; en el chat no se repiten una por una.
   - `pasos` + `debe`: cómo probarlo (numerado) y el resultado esperado. El usuario los tilda con la casilla del ítem.
   - **No** escribir un "qué se puede mejorar" propio: cada ítem trae una caja de comentarios para que lo escriba el usuario.
3. **Link de prueba** (`baseUrl` del JSON + `link` de cada ítem): el usuario debe poder saltar directo al lugar donde probar cada cambio.
   - `baseUrl` = URL donde corre la app del proyecto en el que se trabaja; deducirla de `NEXTAUTH_URL`/`.env`/`.env.example`, del puerto del script `dev` en `package.json` o de la config del proyecto. Si no se puede deducir, preguntarla UNA vez (en `/solo`, en la ronda de preguntas inicial) y dejar la suposición anotada en `resumen`.
   - `link` = ruta de la pantalla afectada: un cambio en agenda → `/agenda`; en el Gantt de un proyecto → `/projects/<id>?view=gantt`. Usar ids reales solo si se conocen; si no, la ruta más cercana y explicar en `pasos` cómo llegar. Si el cambio no se ve en ninguna pantalla (script, config, backend), usar `comando` o la ruta del archivo en vez de `link`.
4. **Comentarios del usuario**: se escriben en el informe y quedan en el navegador de él — no llegan solos. El informe trae «Copiar mis comentarios» (para pegar en el chat) y «Descargar comentarios (.json)» (baja `comentarios-<tema>-<fecha>.json` a Descargas). Cuando el usuario avise que dejó comentarios: leer lo pegado en el chat o el JSON más reciente de `~/Descargas` que coincida con `comentarios-<tema>-*.json`, y tratarlos como feedback/ajustes pedidos por él. Los comentarios admiten **capturas pegadas con Ctrl+V**: viajan solo en el `.json` (campo `imagenes` de cada ítem, data URLs JPEG); «Copiar» lleva solo el texto y avisa cuántas capturas hay. Para verlas, decodificar el base64 a archivos temporales (fuera del proyecto) y abrirlos con Read.
5. **Datos para releer**: el bloque `informe-data` es la versión estructurada del informe. En otra sesión se lee directo de ahí (sin parsear el HTML) para estudiarlo, compararlo con los comentarios y continuar.
6. **Pruebas en el navegador**: rige la regla global — pedir autorización antes de usar Chrome. Sin autorización, `estado` y `paso` se sustentan en tsc/lint/scripts/lectura de código, y se aclara qué no se probó visualmente. Capturas de evidencia solo si el usuario autorizó las pruebas.
7. **En el chat**: mensaje breve que apunta al informe (ruta clickable) e incluye los links de prueba principales. En `/solo-ya` siguen siendo obligatorias las tres partes del reporte final, pero resumidas: el detalle por ítem vive en el informe.

## Formato general de la respuesta

- Siempre numerar los puntos (1, 2, 3...), incluso si es una lista corta.
- Si alguno de los puntos implica elegir entre opciones o alternativas concretas, usar la herramienta AskUserQuestion (ventana de opciones) en vez de solo texto — no forzar todo a prosa cuando hay una decisión discreta que tomar.
