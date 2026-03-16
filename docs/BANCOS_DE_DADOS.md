# Bancos de dados no servidor / projeto Precivox

## Resumo

| Banco / referência        | Onde aparece                         | Faz sentido? | Ação recomendada |
|---------------------------|--------------------------------------|--------------|-------------------|
| **precivox** (PostgreSQL) | App Next, backend, Prisma, core/ai   | ✅ Sim       | **Manter** – banco principal |
| **test_db** (PostgreSQL)  | `tests/setup.ts`                     | ✅ Sim       | **Manter** – só para testes |
| **produto_images**        | `config/environment.ts` (fallback)   | ❌ Não       | **Remover** – não usado por ninguém |
| **precivox_production**    | `backend/.env.production.example`   | ⚠️ Exemplo   | Usar mesmo `precivox` ou variável única |

---

## 1. PostgreSQL `precivox` — **MANTER**

- **Uso:** aplicação principal (Next.js + Prisma), backend Node, core/ai (prisma-compat).
- **Config:** `DATABASE_URL` em `.env` / `.env.production` → `postgresql://...@localhost:5432/precivox`.
- **Backend:** `backend/config/database.js` usa `DB_NAME` (default `precivox`) ou variáveis `DB_*`.
- **Conclusão:** é o único banco de dados “de produção” do Precivox. Deve ser o único usado em produção.

---

## 2. PostgreSQL `test_db` — **MANTER**

- **Uso:** apenas em `tests/setup.ts` para testes.
- **Conclusão:** faz sentido para CI/testes locais. Manter; em produção não precisa existir.

---

## 3. Referência `produto_images` — **REMOVER / NÃO USAR**

- **Onde:** `config/environment.ts` — fallback `process.env.DATABASE_URL || 'postgresql://.../produto_images'` e exemplo no comentário.
- **Uso real:** nenhum arquivo do projeto importa `config/environment.ts`.
- **Conclusão:** não existe “banco produto_images” em uso; é configuração morta. O fallback foi alterado para usar apenas `DATABASE_URL` (mesmo banco `precivox`), evitando criar um segundo banco por engano.

---

## 4. `precivox_production` no exemplo do backend

- **Onde:** `backend/.env.production.example` → `DB_NAME=precivox_production`.
- **Conclusão:** é só documentação. Em produção o backend deve usar o **mesmo** banco que o Next (por ex. `DB_NAME=precivox` ou uma única `DATABASE_URL`). Não é um banco “a mais” para criar; é só nome de exemplo.

---

## 5. Scripts com credenciais fixas

- **backend/verificar-schema.js:** usa `database: 'precivox'`, user/password em código.
- **Recomendação:** usar variáveis de ambiente (ex.: `process.env.DB_*` ou `DATABASE_URL`) para não espalhar credenciais e para funcionar em qualquer ambiente.

---

## Como listar os bancos no PostgreSQL (no servidor)

Para conferir quais bancos existem de fato no PostgreSQL:

```bash
psql -U precivox_app -h localhost -d postgres -c "\l"
# ou, se tiver DATABASE_URL no .env:
# source .env.production && psql "$DATABASE_URL" -c "\l"
```

Assim você vê se existe apenas `precivox` (e eventualmente `test_db`) e nenhum `produto_images` ou outro banco órfão.
