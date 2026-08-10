#!/usr/bin/env bash
# Instala skills GLOBAL do account-pack no escopo de usuário (~/.agents/skills).
# Não remove cópias de projeto. Não instala hybrid/local/archive sem flag.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
TARGET="${HOME}/.agents/skills"
MODE="${1:-global}" # global | hybrid | dry-run

mkdir -p "$TARGET"
install_dir() {
  local src="$1"
  local name
  name="$(basename "$src")"
  if [[ "${MODE}" == "dry-run" ]]; then
    echo "[dry-run] would install $name -> $TARGET/$name"
    return
  fi
  if [[ -e "$TARGET/$name" ]]; then
    echo "[skip] already exists: $TARGET/$name (backup manually if replacing)"
    return
  fi
  cp -a "$src" "$TARGET/$name"
  echo "[ok] installed $name"
}

case "$MODE" in
  global|dry-run)
    for d in "$ROOT"/global/*/; do
      [[ -d "$d" ]] || continue
      install_dir "$d"
    done
    # Pacotes oficiais via registry (preferível a cópia local)
    if [[ "$MODE" != "dry-run" ]]; then
      echo "[info] Também recomenda-se:"
      echo "  npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y"
      echo "  npx skills add vercel-labs/agent-skills@vercel-react-native-skills -g -y"
      echo "  npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y"
      echo "  npx skills add vercel-labs/skills@find-skills -g -y"
    fi
    ;;
  hybrid)
    for d in "$ROOT"/hybrid/*/; do
      [[ -d "$d" ]] || continue
      install_dir "$d"
    done
    ;;
  *)
    echo "Uso: $0 [global|hybrid|dry-run]"
    exit 1
    ;;
esac

echo "Done. Mode=$MODE Target=$TARGET"
