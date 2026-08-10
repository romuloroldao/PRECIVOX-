#!/usr/bin/env bash
# Instala o pack curado em ~/.cursor/skills (Skills de Usuário na UI Customize).
# NÃO instala as 8 archive-candidates.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PACK="$ROOT/account-pack"
DEST="${CURSOR_USER_SKILLS_DIR:-$HOME/.cursor/skills}"
mkdir -p "$DEST"

EXCLUDE_REGEX='^(debugging-expert|system-architecture|performance-optimizer|tdd|obsidian-vault|git-guardrails-claude-code|migrate-to-shoehorn|setup-pre-commit)$'

install_tree() {
  local src_root="$1"
  local count=0
  for d in "$src_root"/*/; do
    [[ -d "$d" ]] || continue
    local name
    name="$(basename "$d")"
    if [[ "$name" =~ $EXCLUDE_REGEX ]]; then
      echo "[skip-archive] $name"
      continue
    fi
    rm -rf "$DEST/$name"
    cp -a "$d" "$DEST/$name"
    echo "[ok] $name"
    count=$((count + 1))
  done
  echo "[info] from $(basename "$src_root"): $count"
}

echo "Destino: $DEST"
install_tree "$PACK/global"
install_tree "$PACK/hybrid"

# Oficiais via registry (preferível a cópia estática)
if command -v npx >/dev/null 2>&1; then
  npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y -a cursor 2>/dev/null || true
  npx skills add vercel-labs/agent-skills@vercel-react-native-skills -g -y -a cursor 2>/dev/null || true
  npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y -a cursor 2>/dev/null || true
  npx skills add vercel-labs/skills@find-skills -g -y -a cursor 2>/dev/null || true
fi

# Se npx instalou em ~/.agents/skills, espelhar para ~/.cursor/skills (UI User)
AGENTS="${HOME}/.agents/skills"
if [[ -d "$AGENTS" ]]; then
  for name in vercel-react-best-practices vercel-react-native-skills web-design-guidelines find-skills; do
    if [[ -d "$AGENTS/$name" && ! -d "$DEST/$name" ]]; then
      cp -a "$AGENTS/$name" "$DEST/$name"
      echo "[mirror] $name -> $DEST"
    fi
  done
fi

echo "Total em $DEST: $(find "$DEST" -mindepth 1 -maxdepth 1 -type d | wc -l)"
echo "Reinicie o Cursor ou reabra Customize → Skills para atualizar a lista User."
