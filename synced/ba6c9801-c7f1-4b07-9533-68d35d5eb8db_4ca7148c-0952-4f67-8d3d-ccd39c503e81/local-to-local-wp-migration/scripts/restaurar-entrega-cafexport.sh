#!/usr/bin/env bash
set -Eeuo pipefail

TMP_DIR=""
LOG_FILE=""
VISUAL_PID=""

log() {
  local line="[$(date +%H:%M:%S)] $*"
  printf '\n%s\n' "$line"
  if [[ -n "$LOG_FILE" ]]; then
    printf '\n%s\n' "$line" >> "$LOG_FILE"
  fi
}

die() {
  local msg="Error: $*"
  local log_text=""
  printf '%s\n' "$msg" >&2
  if [[ -n "$LOG_FILE" ]]; then
    printf '\n%s\n' "$msg" >> "$LOG_FILE"
    log_text="\n\nLog:\n$LOG_FILE"
  fi
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="Cafexport - error" --width=720 --text="$msg$log_text" || true
  elif command -v kdialog >/dev/null 2>&1; then
    kdialog --error "$msg$log_text" --title "Cafexport - error" || true
  fi
  exit 1
}

run_visual_log() {
  if can_use_zenity; then
    tail -n +1 -f "$LOG_FILE" | zenity --text-info \
      --title="Cafexport - restaurando entrega" \
      --width=900 \
      --height=620 \
      --auto-scroll &
    VISUAL_PID=$!
  elif can_use_kdialog; then
    tail -n +1 -f "$LOG_FILE" | kdialog --textbox - 900 620 &
    VISUAL_PID=$!
  else
    log "Sin ventana grafica disponible; el progreso queda en esta terminal."
  fi
}

can_use_zenity() {
  command -v zenity >/dev/null 2>&1 && [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]
}

can_use_kdialog() {
  command -v kdialog >/dev/null 2>&1 && [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]
}

pick_directory() {
  local title="$1"
  local default_dir="${2:-$HOME}"

  if can_use_zenity; then
    zenity --file-selection --directory --title="$title" --filename="$default_dir/" || exit 1
  elif can_use_kdialog; then
    kdialog --getexistingdirectory "$default_dir" --title "$title" || exit 1
  else
    local value
    printf '\n%s\n' "$title" >&2
    printf 'Sugerido: %s\n' "$default_dir" >&2
    read -r -p 'Ruta: ' value
    printf '%s\n' "${value:-$default_dir}"
  fi
}

pick_file() {
  local title="$1"
  local default_dir="${2:-$HOME}"

  if can_use_zenity; then
    zenity --file-selection --title="$title" --filename="$default_dir/" || exit 1
  elif can_use_kdialog; then
    kdialog --getopenfilename "$default_dir" --title "$title" || exit 1
  else
    local value
    printf '\n%s\n' "$title" >&2
    printf 'Sugerido: %s\n' "$default_dir" >&2
    read -r -p 'Archivo: ' value
    [[ -n "$value" ]] || die "No se indico archivo."
    printf '%s\n' "$value"
  fi
}

confirm() {
  local text="$1"

  if can_use_zenity; then
    zenity --question --title="Cafexport - confirmar restauracion" --width=620 --text="$text"
  elif can_use_kdialog; then
    kdialog --yesno "$text" --title "Cafexport - confirmar restauracion"
  else
    local answer
    printf '\n%s\n' "$text"
    read -r -p 'Continuar? [s/N]: ' answer
    [[ "$answer" == "s" || "$answer" == "S" || "$answer" == "si" || "$answer" == "SI" ]]
  fi
}

info() {
  local text="$1"

  if can_use_zenity; then
    zenity --info --title="Cafexport" --width=620 --text="$text" || true
  elif can_use_kdialog; then
    kdialog --msgbox "$text" --title "Cafexport" || true
  else
    printf '%s\n' "$text"
  fi
}

cleanup() {
  if [[ -n "${VISUAL_PID:-}" ]]; then
    kill "$VISUAL_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

extract_archive() {
  local archive="$1"
  TMP_DIR="$(mktemp -d)"

  case "$archive" in
    *.tar.gz|*.tgz)
      tar -xzf "$archive" -C "$TMP_DIR"
      ;;
    *.zip)
      command -v unzip >/dev/null 2>&1 || die "Falta unzip. Instala con: sudo apt install -y unzip"
      unzip -q "$archive" -d "$TMP_DIR"
      ;;
    *)
      die "Formato no soportado. Usa carpeta, .tar.gz, .tgz o .zip"
      ;;
  esac
}

find_handoff_root() {
  local base="$1"

  if [[ -d "$base/01-wordpress" && -d "$base/02-configuracion-local" ]]; then
    printf '%s\n' "$base"
    return
  fi

  local found
  found="$(find "$base" -maxdepth 3 -type d -name 01-wordpress -print -quit 2>/dev/null || true)"
  [[ -n "$found" ]] || die "No encontre una estructura cafexport-entrega valida dentro de: $base"
  dirname "$found"
}

copy_if_exists() {
  local src="$1"
  local dest="$2"

  if [[ -e "$src" ]]; then
    mkdir -p "$dest"
    cp -a "$src" "$dest/"
    printf '  ok  %s -> %s\n' "$src" "$dest" | tee -a "$LOG_FILE"
  else
    printf '  --  no existe: %s\n' "$src" | tee -a "$LOG_FILE"
  fi
}

extract_if_exists() {
  local archive="$1"
  local dest="$2"

  if [[ -f "$archive" ]]; then
    mkdir -p "$dest"
    tar -xzf "$archive" -C "$dest"
    printf '  ok  %s -> %s\n' "$archive" "$dest" | tee -a "$LOG_FILE"
  else
    printf '  --  no existe: %s\n' "$archive" | tee -a "$LOG_FILE"
  fi
}

validate_project_dest() {
  local dest="$1"
  [[ -d "$dest" ]] || die "La carpeta destino no existe: $dest"

  if [[ -d "$dest/wp-content" || -d "$dest/.ddev" || -d "$dest/.git" ]]; then
    return
  fi

  if [[ -z "$(find "$dest" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
    log "La carpeta destino esta vacia; se preparara estructura base."
    return
  fi

  die "La carpeta destino no parece ser el proyecto Cafexport ni esta vacia: $dest"
}

restore_handoff() {
  local handoff="$1"
  local dest="$2"

  log "Restaurando entrega"
  log "Entrega: $handoff"
  log "Destino: $dest"
  mkdir -p "$dest/_handoff"
  mkdir -p "$dest/.ddev"
  mkdir -p "$dest/.claude"
  mkdir -p "$dest/.codex"
  mkdir -p "$dest/wp-content/"{uploads,plugins,themes,languages}

  copy_if_exists "$handoff/01-wordpress/base-datos/cafexport-db.sql.gz" "$dest/_handoff"
  copy_if_exists "$handoff/06-verificacion/SHA256SUMS.txt" "$dest/_handoff"

  log "Restaurando configuracion DDEV"
  copy_if_exists "$handoff/02-configuracion-local/ddev/config.yaml" "$dest/.ddev"
  if [[ -f "$dest/.ddev/config.yaml" ]]; then
    printf '  ok  DDEV listo en: %s\n' "$dest/.ddev/config.yaml" | tee -a "$LOG_FILE"
  else
    printf '  --  falta DDEV config en la entrega: %s\n' "$handoff/02-configuracion-local/ddev/config.yaml" | tee -a "$LOG_FILE"
  fi

  copy_if_exists "$handoff/02-configuracion-local/wordpress/wp-config.php" "$dest"
  copy_if_exists "$handoff/02-configuracion-local/wordpress/wp-config-ddev.php" "$dest"
  copy_if_exists "$handoff/02-configuracion-local/theme-env/.env" "$dest/wp-content/themes/hello-elementor-depura"

  log "Restaurando skills locales del proyecto"
  copy_if_exists "$handoff/.claude/skills" "$dest/.claude"
  copy_if_exists "$handoff/.codex/skills" "$dest/.codex"

  extract_if_exists "$handoff/01-wordpress/uploads/uploads.tar.gz" "$dest/wp-content/uploads"
  extract_if_exists "$handoff/01-wordpress/plugins/plugins.tar.gz" "$dest/wp-content/plugins"
  extract_if_exists "$handoff/01-wordpress/themes/themes.tar.gz" "$dest/wp-content/themes"
  extract_if_exists "$handoff/01-wordpress/languages/languages.tar.gz" "$dest/wp-content/languages"
}

main() {
  LOG_FILE="$(mktemp -t cafexport-restaurar-XXXXXX.log)"

  local source_path handoff_root dest_project
  source_path="$(pick_file "Selecciona cafexport-entrega.tar.gz. Si esta en Windows, busca en /mnt/c/Users/TU_USUARIO_WINDOWS/Downloads" "$HOME")"
  log "Archivo seleccionado: $source_path"
  extract_archive "$source_path"
  handoff_root="$(find_handoff_root "$TMP_DIR")"
  log "Raiz de entrega detectada: $handoff_root"

  dest_project="$(pick_directory "Selecciona la carpeta destino del proyecto Cafexport dentro de Ubuntu/WSL2" "$HOME/projects")"
  log "Destino seleccionado: $dest_project"
  validate_project_dest "$dest_project"

  local confirm_text
  confirm_text="$(printf 'Se restaurara la entrega:\n%s\n\nDentro del proyecto:\n%s\n\nEsto copiara configs y descomprimira uploads, plugins, themes y languages.' "$handoff_root" "$dest_project")"
  confirm "$confirm_text" || exit 1

  run_visual_log
  restore_handoff "$handoff_root" "$dest_project"

  log "Archivos restaurados en: $dest_project"
  log "Log completo: $LOG_FILE"
  local final_text
  final_text="$(printf 'Restauracion lista.\n\nQuedo en:\n%s\n\nSiguiente paso dentro del proyecto:\ncd "%s"\nddev import-db --file=_handoff/cafexport-db.sql.gz\n\nLog:\n%s' "$dest_project" "$dest_project" "$LOG_FILE")"
  info "$final_text"
  log "Restauracion lista"
}

main "$@"
