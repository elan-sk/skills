#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-}"
OUT_DIR="${OUT_DIR:-}"
OUT_PARENT=""
STAGING_PARENT=""
THEME_DIR=""
ARCHIVE_FILE=""
LOG_FILE=""
VISUAL_PID=""
DDEV_EXPORT_TIMEOUT="${DDEV_EXPORT_TIMEOUT:-120}"

log() {
  printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"
}

run_visual_log() {
  if can_use_zenity; then
    tail -n +1 -f "$LOG_FILE" | zenity --text-info \
      --title="Cafexport - preparando entrega" \
      --width=980 \
      --height=680 \
      --auto-scroll &
    VISUAL_PID=$!
  elif can_use_kdialog; then
    tail -n +1 -f "$LOG_FILE" | kdialog --textbox - 980 680 &
    VISUAL_PID=$!
  else
    log "Sin ventana grafica disponible; el progreso queda en esta terminal."
  fi
}

cleanup() {
  if [[ -n "${VISUAL_PID:-}" ]]; then
    kill "$VISUAL_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$STAGING_PARENT" && -d "$STAGING_PARENT" ]]; then
    rm -r -- "$STAGING_PARENT"
  fi
}
trap cleanup EXIT

can_use_zenity() {
  command -v zenity >/dev/null 2>&1 && [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]
}

can_use_kdialog() {
  command -v kdialog >/dev/null 2>&1 && [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]
}

info() {
  local text="$1"

  if can_use_zenity; then
    zenity --info --title="Cafexport - preparar entrega" --width=720 --text="$text" || true
  elif can_use_kdialog; then
    kdialog --msgbox "$text" --title "Cafexport - preparar entrega" || true
  else
    printf '%s\n' "$text"
  fi
}

die() {
  local msg="Error: $*"
  printf '%s\n' "$msg" >&2
  if can_use_zenity; then
    zenity --error --title="Cafexport - error" --width=720 --text="$msg" || true
  elif can_use_kdialog; then
    kdialog --error "$msg" --title "Cafexport - error" || true
  fi
  exit 1
}

show_summary() {
  log "Resumen de entrega"
  find "$OUT_DIR" -maxdepth 3 -mindepth 1 -print | sed "s#^$OUT_DIR#  #"
}

copy_if_exists() {
  local src="$1"
  local dest="$2"

  if [[ -e "$src" ]]; then
    mkdir -p "$dest"
    cp -a "$src" "$dest/"
    printf '  ok  %s -> %s\n' "$src" "$dest"
  else
    printf '  --  no existe: %s\n' "$src"
  fi
}

archive_dir_if_exists() {
  local src_dir="$1"
  local dest_file="$2"
  local size=""

  if [[ -d "$src_dir" ]]; then
    mkdir -p "$(dirname "$dest_file")"
    size="$(du -sh "$src_dir" 2>/dev/null | awk '{print $1}' || true)"
    printf '  ..  empaquetando %s%s\n' "$src_dir" "${size:+ ($size)}"
    tar \
      --exclude='node_modules' \
      --exclude='*/node_modules' \
      --exclude='*/node_modules/*' \
      -czf "$dest_file" \
      -C "$src_dir" .
    printf '  ok  %s -> %s\n' "$src_dir" "$dest_file"
  else
    printf '  --  no existe carpeta: %s\n' "$src_dir"
  fi
}

require_project() {
  if [[ -z "$PROJECT_ROOT" ]]; then
    PROJECT_ROOT="$(detect_project_root)"
  fi

  if [[ ! -d "$PROJECT_ROOT/.ddev" || ! -d "$PROJECT_ROOT/wp-content" ]]; then
    die "PROJECT_ROOT no parece ser el repo Cafexport: $PROJECT_ROOT"
  fi

  THEME_DIR="$PROJECT_ROOT/wp-content/themes/hello-elementor-depura"
  log "Repo detectado: $PROJECT_ROOT"
}

detect_project_root() {
  local dir="$PWD"

  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.ddev" && -d "$dir/wp-content" ]]; then
      printf '%s\n' "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done

  local script_root
  script_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  if [[ -d "$script_root/.ddev" && -d "$script_root/wp-content" ]]; then
    printf '%s\n' "$script_root"
    return
  fi

  die "Ejecuta este script desde la raiz del repo Cafexport o define PROJECT_ROOT."
}

pick_output_dir() {
  local default_parent="$HOME"
  local selected_parent=""

  if [[ -z "$OUT_DIR" ]]; then
    if can_use_zenity; then
      selected_parent="$(zenity --file-selection --directory --title="Selecciona donde guardar cafexport-entrega.tar.gz" --filename="$default_parent/")" || die "No se selecciono carpeta destino."
    elif can_use_kdialog; then
      selected_parent="$(kdialog --getexistingdirectory "$default_parent" --title "Selecciona donde guardar cafexport-entrega.tar.gz")" || die "No se selecciono carpeta destino."
    else
      printf '\nDonde quieres guardar cafexport-entrega.tar.gz?\n'
      printf 'Carpeta padre sugerida: %s\n' "$default_parent"
      read -r -p 'Carpeta destino [Enter para usar la sugerida]: ' selected_parent
    fi

    OUT_PARENT="${selected_parent:-$default_parent}"
  else
    case "$(basename "$OUT_DIR")" in
      cafexport-entrega) OUT_PARENT="$(dirname "$OUT_DIR")" ;;
      *) OUT_PARENT="$OUT_DIR" ;;
    esac
  fi

  case "$OUT_PARENT" in
    "~") OUT_PARENT="$HOME" ;;
    "~/"*) OUT_PARENT="$HOME/${OUT_PARENT#"~/"}" ;;
  esac

  OUT_PARENT="$(realpath -m "$OUT_PARENT")"
  mkdir -p "$OUT_PARENT"

  STAGING_PARENT="$(mktemp -d -t cafexport-entrega-work-XXXXXX)"
  OUT_DIR="$STAGING_PARENT/cafexport-entrega"
  ARCHIVE_FILE="$OUT_PARENT/cafexport-entrega.tar.gz"
}

make_structure() {
  mkdir -p "$OUT_DIR/00-leer-primero"
  mkdir -p "$OUT_DIR/01-wordpress/"{base-datos,uploads,plugins,themes,languages}
  mkdir -p "$OUT_DIR/02-configuracion-local/"{wordpress,ddev,theme-env,claude,codex,vscode}
  mkdir -p "$OUT_DIR/.claude/skills"
  mkdir -p "$OUT_DIR/.codex/skills"
  mkdir -p "$OUT_DIR/04-mcp-y-accesos"
  mkdir -p "$OUT_DIR/05-solicitudes-componentes/"{referencias,prompts,ubicacion-wp}
  mkdir -p "$OUT_DIR/06-verificacion"
}

copy_manuals() {
  log "Copiando manuales"
  copy_if_exists "$PROJECT_ROOT/docs/00-manual-preparacion-entrega-cafexport.html" "$OUT_DIR/00-leer-primero"
  copy_if_exists "$PROJECT_ROOT/docs/01-manual-instalacion-ambiente-cafexport.html" "$OUT_DIR/00-leer-primero"
  copy_if_exists "$PROJECT_ROOT/docs/02-manual-flujo-trabajo-ia-cafexport.html" "$OUT_DIR/00-leer-primero"
  copy_if_exists "$PROJECT_ROOT/docs/scripts/preparar-entrega-cafexport.sh" "$OUT_DIR/00-leer-primero"
  copy_if_exists "$PROJECT_ROOT/docs/scripts/restaurar-entrega-cafexport.sh" "$OUT_DIR/00-leer-primero"
  copy_if_exists "$PROJECT_ROOT/docs/scripts/restaurar-entrega-cafexport.sh" "$OUT_DIR"
}

export_database() {
  log "Exportando base de datos"
  if command -v ddev >/dev/null 2>&1 && command -v timeout >/dev/null 2>&1; then
    printf '  ..  intentando exportar con DDEV, maximo %s segundos\n' "$DDEV_EXPORT_TIMEOUT"
    if (cd "$PROJECT_ROOT" && timeout "$DDEV_EXPORT_TIMEOUT" ddev export-db --file="$OUT_DIR/01-wordpress/base-datos/cafexport-db.sql.gz"); then
      printf '  ok  base de datos -> %s\n' "$OUT_DIR/01-wordpress/base-datos/cafexport-db.sql.gz"
    else
      printf '  --  no se pudo exportar la base de datos; revisa que DDEV este iniciado.\n'
    fi
  elif command -v ddev >/dev/null 2>&1; then
    printf '  --  falta timeout; no se ejecuta ddev export-db para evitar que el script se quede detenido.\n'
  else
    printf '  --  ddev no esta disponible; exporta la base manualmente.\n'
  fi
}

archive_wordpress_files() {
  log "Empaquetando archivos WordPress"
  archive_dir_if_exists "$PROJECT_ROOT/wp-content/uploads" "$OUT_DIR/01-wordpress/uploads/uploads.tar.gz"
  archive_dir_if_exists "$PROJECT_ROOT/wp-content/plugins" "$OUT_DIR/01-wordpress/plugins/plugins.tar.gz"
  archive_dir_if_exists "$PROJECT_ROOT/wp-content/themes" "$OUT_DIR/01-wordpress/themes/themes.tar.gz"
  archive_dir_if_exists "$PROJECT_ROOT/wp-content/languages" "$OUT_DIR/01-wordpress/languages/languages.tar.gz"
}

copy_local_config() {
  log "Copiando configuraciones locales"
  copy_if_exists "$PROJECT_ROOT/wp-config.php" "$OUT_DIR/02-configuracion-local/wordpress"
  copy_if_exists "$PROJECT_ROOT/wp-config-ddev.php" "$OUT_DIR/02-configuracion-local/wordpress"
  copy_if_exists "$THEME_DIR/.env" "$OUT_DIR/02-configuracion-local/theme-env"
  copy_if_exists "$PROJECT_ROOT/.claude/settings.local.json" "$OUT_DIR/02-configuracion-local/claude"
  copy_if_exists "$HOME/.codex/config.toml" "$OUT_DIR/02-configuracion-local/codex"
}

copy_ddev_config() {
  log "Copiando configuracion DDEV"
  copy_if_exists "$PROJECT_ROOT/.ddev/config.yaml" "$OUT_DIR/02-configuracion-local/ddev"

  if [[ -f "$OUT_DIR/02-configuracion-local/ddev/config.yaml" ]]; then
    printf '  ok  DDEV listo en: %s\n' "$OUT_DIR/02-configuracion-local/ddev/config.yaml"
  else
    printf '  --  falta DDEV config: %s\n' "$OUT_DIR/02-configuracion-local/ddev/config.yaml"
  fi
}

copy_skills() {
  log "Copiando skills"
  if ! command -v rsync >/dev/null 2>&1; then
    printf '  --  falta rsync; instala con: sudo apt install -y rsync\n'
    return
  fi

  if [[ -d "$HOME/.claude/skills" ]]; then
    rsync -a --delete --exclude='.git/' --exclude='node_modules/' "$HOME/.claude/skills/" "$OUT_DIR/.claude/skills/"
    printf '  ok  ~/.claude/skills -> %s\n' "$OUT_DIR/.claude/skills"
  else
    printf '  --  no existe ~/.claude/skills\n'
  fi

  if [[ -d "$HOME/.codex/skills" ]]; then
    rsync -a --delete --exclude='.git/' --exclude='node_modules/' "$HOME/.codex/skills/" "$OUT_DIR/.codex/skills/"
    printf '  ok  ~/.codex/skills -> %s\n' "$OUT_DIR/.codex/skills"
  else
    printf '  --  no existe ~/.codex/skills\n'
  fi
}

make_checksums() {
  log "Generando SHA256SUMS.txt"
  (
    cd "$OUT_DIR"
    sha256sum \
      01-wordpress/base-datos/cafexport-db.sql.gz \
      01-wordpress/uploads/uploads.tar.gz \
      01-wordpress/plugins/plugins.tar.gz \
      01-wordpress/themes/themes.tar.gz \
      01-wordpress/languages/languages.tar.gz \
      02-configuracion-local/ddev/config.yaml \
      2>/dev/null > 06-verificacion/SHA256SUMS.txt || true
  )
  printf '  ok  %s\n' "$OUT_DIR/06-verificacion/SHA256SUMS.txt"
}

make_delivery_archive() {
  log "Creando comprimido de entrega"
  printf '  ..  esto puede tardar si uploads, plugins o themes son grandes\n'
  tar \
    --exclude='node_modules' \
    --exclude='*/node_modules' \
    --exclude='*/node_modules/*' \
    -czf "$ARCHIVE_FILE" \
    -C "$STAGING_PARENT" cafexport-entrega
  printf '  ok  %s\n' "$ARCHIVE_FILE"
}

main() {
  require_project
  pick_output_dir
  LOG_FILE="$(mktemp -t cafexport-preparar-XXXXXX.log)"
  exec > >(tee -a "$LOG_FILE") 2>&1
  run_visual_log
  log "Preparando entrega temporal en $OUT_DIR"
  log "Destino final: $ARCHIVE_FILE"
  make_structure
  copy_manuals
  export_database
  archive_wordpress_files
  copy_local_config
  copy_ddev_config
  copy_skills
  make_checksums
  show_summary
  make_delivery_archive
  log "Comprimido listo: $ARCHIVE_FILE"
  info "$(printf 'Entrega lista.\n\nSolo queda el comprimido:\n%s' "$ARCHIVE_FILE")"
}

main "$@"
