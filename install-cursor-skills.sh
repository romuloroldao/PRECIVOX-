#!/usr/bin/env bash
# Instala as 46 skills Precivox no escopo USER/GLOBAL do Cursor (todos os projetos nesta máquina).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PACK="$ROOT/cursor-skills-pack"

echo "==> Instalando via skills CLI (global)..."
npx --yes skills add "$PACK" --all -g -y -a cursor

# Espelhar para ~/.cursor/skills (UI Customize → User / discovery Cursor)
SRC_AGENTS="${HOME}/.agents/skills"
DEST="${HOME}/.cursor/skills"
mkdir -p "$DEST"
if [[ -d "$SRC_AGENTS" ]]; then
  echo "==> Espelhando ~/.agents/skills -> ~/.cursor/skills"
  for d in "$SRC_AGENTS"/*/; do
    [[ -d "$d" ]] || continue
    name="$(basename "$d")"
    rm -rf "$DEST/$name"
    cp -a "$d" "$DEST/$name"
  done
fi

echo "==> Contagens"
echo -n "agents: "; find "${HOME}/.agents/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l
echo -n "cursor: "; find "${HOME}/.cursor/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l
echo
echo "Pronto. No Cursor: Cmd/Ctrl+Shift+P → Developer: Reload Window"
echo "Em outro PC/projeto: rode este mesmo script OU:"
echo "  npx skills add romuloroldao/PRECIVOX- --all -g -y"
echo "  (após o pack estar na branch/main acessível)"
