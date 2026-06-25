#!/bin/bash
# TMUX operacional — deploys sobrevivem à queda de SSH.
set -euo pipefail

TMUX_CONF="/root/.tmux.conf"
BASH_ALIASES_SNIPPET="/root/.precivox-bash-aliases"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v tmux >/dev/null 2>&1; then
  apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq tmux
fi

[[ -f "$TMUX_CONF" ]] && bash "$SCRIPT_DIR/backup-file.sh" "$TMUX_CONF" || true

cat > "$TMUX_CONF" <<'EOF'
# PRECIVOX — sessões resilientes
set -g default-terminal "screen-256color"
set -g history-limit 50000
set -g mouse on
set -g detach-on-destroy off
setw -g mode-keys vi
bind r source-file ~/.tmux.conf \; display "Reloaded"
EOF

cat > "$BASH_ALIASES_SNIPPET" <<'EOF'
# PRECIVOX tmux (source em ~/.bashrc)
alias tdeploy='tmux attach -t precivox-deploy 2>/dev/null || tmux new -s precivox-deploy'
alias tmon='tmux attach -t precivox-monitor 2>/dev/null || tmux new -s precivox-monitor'
alias tlogs='tmux attach -t precivox-logs 2>/dev/null || tmux new -s precivox-logs'
alias thealth='bash /root/scripts/infra/precivox-health.sh'
EOF

if ! grep -q 'precivox-bash-aliases' /root/.bashrc 2>/dev/null; then
  echo '[ -f /root/.precivox-bash-aliases ] && source /root/.precivox-bash-aliases' >> /root/.bashrc
fi

# Sessões padrão (detached)
for s in precivox-deploy precivox-monitor precivox-logs; do
  tmux has-session -t "$s" 2>/dev/null || tmux new-session -d -s "$s"
done

echo "✅ TMUX configurado. Sessões:"
tmux list-sessions 2>/dev/null || true
echo ""
echo "   tdeploy  → sessão de deploy"
echo "   tmon     → htop / health"
echo "   tlogs    → pm2 logs"
