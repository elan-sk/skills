---
name: sync-agent-skills
description: Sincroniza skills entre agentes locales. Usar cuando el usuario diga "actualizar skill", "actualizar skills", "sincronizar skills", "copiar skills entre agentes", "actualiza las skills de Claude/Codex/Agents", o pida crear/actualizar skills en todas las carpetas de agentes. Crea skills faltantes y resuelve conflictos copiando el archivo mas nuevo.
---

# Sync Agent Skills

Sincronizar las carpetas de skills de los agentes locales para que Claude,
Codex y Agents tengan las mismas skills disponibles.

## Regla Principal

Cuando el usuario diga algo como **"actualizar skill"**, **"actualizar
skills"**, **"sincroniza las skills"** o **"copia las skills entre agentes"**:

1. Ejecutar `scripts/sync_agent_skills.py` desde esta skill.
2. Sincronizar estas raices por defecto:
   - `~/.claude/skills`
   - `~/.codex/skills`
   - `~/.agents/skills`
3. Crear cualquier skill que exista en una raiz y falte en otra.
4. Para cada archivo con conflicto, copiar el archivo con `mtime` mas reciente.
5. Ignorar `.git`, `node_modules`, `__pycache__`, `.pytest_cache` y archivos
   temporales del sistema.
6. Validar las skills sincronizadas con `quick_validate.py` cuando exista.

No borrar archivos por defecto. La sincronizacion por defecto es union de
archivos: si un archivo existe en una raiz y falta en otra, se copia.

## Comando

Desde cualquier directorio:

```bash
python3 ~/.codex/skills/sync-agent-skills/scripts/sync_agent_skills.py
```

Primero hacer simulacion si el usuario pide revisar antes:

```bash
python3 ~/.codex/skills/sync-agent-skills/scripts/sync_agent_skills.py --dry-run
```

Sincronizar solo algunas skills:

```bash
python3 ~/.codex/skills/sync-agent-skills/scripts/sync_agent_skills.py dev-inspector-toolbar graphify
```

## Validacion Esperada

El script imprime:

- carpetas de skill creadas;
- archivos copiados y fuente elegida;
- conflictos con empate exacto de `mtime`, si existen;
- resumen de hashes por skill;
- resultado de validacion de `SKILL.md`.

Un resultado correcto debe terminar con hashes iguales para cada skill
sincronizada entre las raices existentes.

## Si Hay Empate Exacto

Si dos archivos tienen el mismo `mtime` pero distinto contenido, no hay un
"mas nuevo" real. En ese caso usar preferencia determinista:

1. `~/.codex/skills`
2. `~/.claude/skills`
3. `~/.agents/skills`

El script reporta esos empates para que el usuario los pueda revisar.
