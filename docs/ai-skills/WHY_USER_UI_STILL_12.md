# Por que a UI continua em “User 12”

## Diagnóstico

A tela **Customize → Skills → User** lista skills do **home local do Cursor Desktop** (`~/.cursor/skills` no Mac/Windows), **não** do servidor SSH.

| Onde você rodou o comando | O que aconteceu | Efeito na UI User |
|---------------------------|-----------------|-------------------|
| Terminal **Remote SSH** (VPS) | Arquivos em `/root/.cursor/skills` (já há **46**) | **Nenhum** — User lê o PC local |
| Terminal **local** do Mac/PC | Arquivos em `~/.cursor/skills` da Desktop | Deve subir a contagem User após Reload |

As 12 skills que você já vê (`ai-product-strategy`, `design-md`, etc.) **não existem na VPS** — só no seu computador. Por isso a lista não mudou.

As 46 skills **já estão no servidor** para o Agent remoto. A UI User é outro “cofre”.

---

## O que fazer agora (no Mac/PC local — NÃO no SSH)

### 1) Confirme que o terminal é local

```bash
hostname
echo "HOME=$HOME"
# NÃO deve ser r14653s.vps-kinghost.net
# HOME NÃO deve ser /root
```

### 2) Instale as 46 skills no home local

No clone do repo (branch com o pack), **no terminal local**:

```bash
cd /caminho/do/PRECIVOX-
mkdir -p "$HOME/.cursor/skills"
tar -xzf docs/ai-skills/cursor-user-skills-46.tgz -C "$HOME/.cursor/"
ls "$HOME/.cursor/skills" | wc -l
# esperado: >= 46 (ou 12+46 se misturar com as antigas)
```

Ou:

```bash
bash docs/ai-skills/install-to-cursor-user-skills.sh
ls "$HOME/.cursor/skills" | wc -l
```

### 3) Recarregue o Cursor

`Cmd/Ctrl+Shift+P` → **Developer: Reload Window**  
(ou feche e abra o Cursor)

### 4) Onde olhar na UI

- **User** — skills do `~/.cursor/skills` local  
- Role a página / outras seções (**Agent Decides**, plugins) — skills de projeto/plugin aparecem separado

### 5) Teste no Agent (mesmo se User ainda parecer estranho)

No chat Agent (janela SSH ou local):

```text
/systematic-debugging
```

ou

```text
/brainstorming
```

Se o Agent carregar a skill, ela está operacional mesmo que a contagem User atrase.

---

## O que NÃO fazer

- Não rode o install de novo só no SSH esperando a UI User mudar.
- Não use `~/.cursor/skills-cursor/` (reservado ao Cursor).
- Não reinstale as 8 archive-candidates.

---

## Se ainda falhar

Cole a saída destes comandos **no terminal local**:

```bash
hostname
echo "HOME=$HOME"
ls -la "$HOME/.cursor/skills" 2>&1 | head -60
ls "$HOME/.cursor/skills" 2>/dev/null | wc -l
```

Com isso dá para ver se o install caiu no home certo.
