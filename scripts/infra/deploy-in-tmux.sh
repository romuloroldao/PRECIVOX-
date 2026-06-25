#!/bin/bash
# Roda deploy dentro da sessão tmux precivox-deploy (sobrevive a queda SSH).
set -euo pipefail

SESSION="${TMUX_DEPLOY_SESSION:-precivox-deploy}"
CMD="${1:-npm run deploy:sync}"

if [[ -z "${TMUX:-}" ]]; then
  if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux new-session -d -s "$SESSION"
  fi
  echo ">>> Iniciando em tmux:$SESSION → $CMD"
  echo ">>> Anexar: tmux attach -t $SESSION"
  tmux send-keys -t "$SESSION" "cd /root && $CMD 2>&1 | tee -a /var/log/precivox-deploy.log && npm run deploy:verify; echo EXIT_CODE=\$? > /tmp/precivox-deploy-done" C-m
  exit 0
fi

cd /root
exec bash -c "$CMD"
