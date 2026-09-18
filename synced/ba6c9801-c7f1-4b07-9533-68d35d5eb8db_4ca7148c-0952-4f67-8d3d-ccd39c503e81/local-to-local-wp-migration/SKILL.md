---
name: local-to-local-wp-migration
description: Prepare and restore local-to-local WordPress DDEV migration handoff packages. Use when the user needs to move a local WordPress/DDEV project from one developer machine to another, create a single compressed delivery file, restore that delivery into a cloned local repo, include database/uploads/plugins/themes/local configs, keep project-local Claude/Codex skills, or document/update this handoff workflow.
---

# Local To Local WordPress Migration

## Core Rules

- Produce a single final file: `cafexport-entrega.tar.gz` or the project-specific equivalent.
- Do not leave a delivery folder in the selected output location. Build in a temporary folder, compress it, then remove the temporary workspace.
- Put AI skills in project-local paths inside the package:
  - `.claude/skills/`
  - `.codex/skills/`
- Do not use legacy folders like `03-skills-ia/`.
- Ignore `node_modules`, `.git`, caches, generated DDEV internals, and machine-specific artifacts.
- For DDEV, deliver `.ddev/config.yaml`; do not copy the whole `.ddev/` folder.
- For receiver docs, assume Windows + WSL2/Ubuntu unless the user says otherwise. The project should live inside the Linux filesystem, not `/mnt/c`.
- Prefer visual progress for scripts. If GUI is unavailable, fall back to terminal prompts and logs.

## Bundled Scripts

Use the scripts in `scripts/` as the starting point for project handoff automation:

- `scripts/preparar-entrega-cafexport.sh`: prepare a single compressed handoff from the current Cafexport repo.
- `scripts/restaurar-entrega-cafexport.sh`: restore a compressed handoff into a local cloned repo.

When adapting to another project, copy the script into that repo and update only project-specific names, theme path, expected files, and final archive name.

## Preparation Workflow

1. Detect the current repo from `PWD` by walking upward until project markers exist, such as `.ddev/` and `wp-content/`.
2. Ask where to save the final compressed file.
3. Create a temporary staging folder.
4. Build this internal structure:

```text
project-entrega/
  00-leer-primero/
  01-wordpress/
    base-datos/
    uploads/
    plugins/
    themes/
    languages/
  02-configuracion-local/
    wordpress/
    ddev/
    theme-env/
    claude/
    codex/
    vscode/
  .claude/
    skills/
  .codex/
    skills/
  04-mcp-y-accesos/
  05-solicitudes-componentes/
  06-verificacion/
```

5. Export database with `ddev export-db` using a timeout so the script cannot hang forever.
6. Archive `uploads`, `plugins`, `themes`, and `languages`, excluding `node_modules`.
7. Copy local config files:
  - `wp-config.php`
  - `wp-config-ddev.php`
  - `.ddev/config.yaml`
  - theme `.env`
  - relevant local Claude/Codex config if intentionally included
8. Copy general user skills into the package as project-local skills:
  - `~/.claude/skills/` -> `.claude/skills/`
  - `~/.codex/skills/` -> `.codex/skills/`
9. Generate `SHA256SUMS.txt` when source files exist.
10. Compress the staging folder into the selected final archive.
11. Remove the staging folder so only the compressed archive remains.

## Restoration Workflow

1. Ask for the compressed handoff file only. Do not offer a folder-vs-archive choice.
2. Extract it into a temporary folder.
3. Ask for the destination repo folder inside WSL2/Ubuntu.
4. Copy:
  - database to `_handoff/`
  - `SHA256SUMS.txt` to `_handoff/`
  - `.ddev/config.yaml` to `.ddev/config.yaml`
  - `wp-config.php` and `wp-config-ddev.php` to repo root
  - theme `.env` to the theme folder
  - `.claude/skills/` to `.claude/skills/`
  - `.codex/skills/` to `.codex/skills/`
5. Extract:
  - `uploads.tar.gz` to `wp-content/uploads/`
  - `plugins.tar.gz` to `wp-content/plugins/`
  - `themes.tar.gz` to `wp-content/themes/`
  - `languages.tar.gz` to `wp-content/languages/` when present
6. Report every step and destination path.
7. Finish by telling the user to run database import from the project:

```bash
ddev import-db --file=_handoff/cafexport-db.sql.gz
```

## Git Ignore

For projects using local skills, ensure these are ignored:

```gitignore
/.claude/skills/
/.codex/skills/
```

Keep shared repo config such as `.claude/settings.json` tracked only if the project intentionally uses it.

## Documentation Guidance

When updating handoff manuals:

- Manual 00 is for the person preparing the compressed package.
- Manual 01 and Manual 02 are for the receiver/developer.
- Do not mix preparation-only instructions into receiver manuals.
- In receiver manuals, always show both locations when useful:
  - inside the extracted package
  - inside the destination repo
- Avoid commands that recreate files the sender is already delivering, such as `.env` or `wp-config.php`.
