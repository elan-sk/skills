---
name: modos-de-trabajo
description: Formato de confirmación de alineación con el usuario, modo de consulta de solo lectura, y modo de trabajo autónomo desatendido. Se dispara cuando el usuario escribe "/entendido" o "/dudas" (o las palabras sueltas "entendido"/"dudas" usadas como comando). Los modos /consulta y /solo tienen comandos dedicados propios (commands/consulta.md, commands/solo.md) que delegan en las secciones `/consulta` y `/solo` de esta skill para el detalle de comportamiento. Define cómo responder en cada caso, el formato general de respuesta (numerado, con AskUserQuestion cuando aplique), y para /consulta impone modo estrictamente de solo lectura; para /solo impone recopilar todas las preguntas por adelantado y luego trabajar sin pedir más confirmaciones, con prohibición absoluta de acciones destructivas/irreversibles.
---

# Entendido / Dudas / Consulta / Solo

Formato de confirmación de alineación antes de ejecutar un pedido, modo de evaluación sin tocar archivos, y modo de trabajo autónomo desatendido.

## Disparadores

- `/entendido` (o "entendido" usado como comando de confirmación, no como palabra suelta en una frase)
- `/dudas` (o "dudas" usado como comando de confirmación)

`/consulta` y `/solo` NO son disparadores directos de esta skill — tienen sus propios comandos dedicados (`commands/consulta.md`, `commands/solo.md`) que se activan al escribirlos y delegan en las secciones de más abajo para el detalle de comportamiento. Así se evita que compitan dos mecanismos por el mismo trigger.

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
2. Una vez respondidas, confirmar EXPLÍCITAMENTE en un mensaje aparte que ya se tiene todo claro y dar el OK al usuario para que se pueda ir ("Listo, tengo todo claro, andá tranquilo"). Recién después de ese mensaje de OK, empezar a trabajar de forma autónoma sin volver a pedir confirmación por cada paso — se suspende la regla general de "preguntar antes de actuar" del CLAUDE.md global mientras dure el `/solo`.
3. Antes de tocar cualquier archivo, correr `git status`. Si YA hay cambios sin commitear (trabajo previo del usuario, no propio), commitearlos primero como punto de seguridad — mensaje claro de que son cambios previos del usuario — ANTES de arrancar el trabajo propio. Así, si algo del `/solo` sale mal, hay una base limpia para volver sin arriesgar lo que el usuario ya tenía hecho. Si el working tree ya está limpio, saltear este paso.
4. Si surge una duda real durante el trabajo y el usuario no está disponible: no detenerse a esperar. Inferir la opción más adecuada en base a memoria (preferencias guardadas, feedback anterior, convenciones ya usadas en el proyecto) y seguir. Dejar registrado qué se asumió y por qué, para que el usuario lo revise al volver.
5. Prohibido de forma absoluta, sin excepción ni siquiera con `/solo` activo: cualquier acción destructiva o irreversible — borrar/truncar bases de datos, `git reset --hard`, `git push --force`, `rm -rf` sin respaldo, sobrescribir trabajo previo sin poder recuperarlo. Todo lo que se toque debe poder revertirse (checkpoints/branches antes de cambios grandes, respaldo antes de tocar datos). Los cambios PROPIOS del `/solo` no se commitean al terminar (ver paso 3: ese commit es solo para aislar el punto de partida, no para el trabajo propio) — el usuario hace sus propios commits cuando vuelve, salvo que pida explícitamente lo contrario.
6. Siempre entregar algún resultado concreto al terminar — no queda permitido terminar con las manos vacías. Si no se puede completar todo, entregar la porción máxima razonable y dejar notas claras de qué falta y por qué.
7. Al volver el usuario, se espera una ronda de ajustes sobre lo entregado — es parte normal del flujo, no señal de que algo salió mal.

## Formato general de la respuesta

- Siempre numerar los puntos (1, 2, 3...), incluso si es una lista corta.
- Si alguno de los puntos implica elegir entre opciones o alternativas concretas, usar la herramienta AskUserQuestion (ventana de opciones) en vez de solo texto — no forzar todo a prosa cuando hay una decisión discreta que tomar.
