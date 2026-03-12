# Modelo de autoridade de autenticação (Auth V2)

## Princípio único

- **Backend (Express) + banco (usuarios) são a autoridade** para autorização.
- **NextAuth não é autoridade** — é apenas mecanismo de login (identidade).

## Regras nas rotas protegidas (ex.: `/api/admin/*`)

1. **TokenManager em primeiro lugar**  
   Valida access token do backend (cookie `precivox-access-token` ou header `Authorization: Bearer`).  
   Se válido → usuário autorizado conforme o token (e, quando aplicável, tokenVersion).

2. **Fallback: NextAuth só identifica**  
   Se não houver token do backend, usar `getServerSession(authOptions)` apenas para obter **email** (identidade).  
   **Não** usar `session.user.role` do JWT como fonte de verdade.

3. **Banco autoriza**  
   Com o email da sessão: `prisma.user.findUnique({ where: { email } })`.  
   Autorizar (ex.: ADMIN) somente se `dbUser.role === 'ADMIN'`.  
   Se não houver usuário no banco ou role inadequado → 403 (ou 401 quando não houver sessão).

## Código esperado (padrão)

```ts
let user = await TokenManager.validateRole('ADMIN', { headers: request.headers, cookies: request.cookies });

if (!user) {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true, nome: true },
    });
    if (dbUser?.role === 'ADMIN') {
      user = { id: dbUser.id, email: dbUser.email, role: dbUser.role, nome: dbUser.nome };
    }
  }
}

if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

## O que não fazer

- **Não** aceitar `session.user.role === 'ADMIN'` (JWT do NextAuth) como suficiente para autorizar.  
- **Não** tratar o JWT do NextAuth como segunda autoridade ao lado do backend.

## Consequências

- **tokenVersion / logout-all** no backend invalida tokens do backend; sessões que dependem só de NextAuth continuam até expirar (ou até o banco revogar/alterar o usuário).
- Para kill switch total em todas as sessões (incluindo NextAuth), ver opções abaixo.

---

## Kill switch: três opções técnicas

### Opção A — Minimalista (estado atual)

- **logout-all** invalida apenas tokens do backend (tokenVersion).
- Sessão NextAuth segue válida até expirar.
- Banco continua sendo autoridade para role; revogação imediata de **identidade** não é total.
- **Adequado para:** maioria dos SaaS; modelo atual está coerente.

### Opção B — Rigorosa (kill switch total)

- **logout-all** invalida tokens do backend **e** invalida sessão NextAuth.
- Implementação: na callback **jwt** do NextAuth, ler `tokenVersion` (ou um campo `sessionVersion`) do usuário no banco; se for maior que o valor guardado no JWT, retornar token vazio / null → NextAuth trata como sessão inválida → força logout no cliente.
- Assim, ao incrementar `tokenVersion` no backend (logout-all), a próxima leitura de sessão no Next já falha e o usuário é deslogado.
- **Requer:** persistir `tokenVersion` (ou equivalente) no JWT do NextAuth no login e revalidar contra o banco em toda callback `jwt`.

**Esboço de implementação (Opção B):**

1. Na callback `jwt` de `authOptions`, ao montar o token (quando há `user`), incluir `tokenVersion: usuario.tokenVersion` (ler de `prisma.user`).
2. Em toda invocação da callback `jwt` (incluindo refresh), ler `tokenVersion` atual do banco para o usuário; se `dbUser.tokenVersion > token.tokenVersion`, retornar `{}` ou não repassar o token → sessão inválida.
3. No backend, ao executar logout-all, incrementar `tokenVersion` do usuário. Na próxima requisição que passar pelo NextAuth, a callback invalida a sessão.

### Opção C — Radical (uma única sessão)

- Rotas protegidas **não** usam fallback NextAuth: sem access token do backend → 401.
- NextAuth só para fluxo de login na UI; após login, o backend emite token e o cliente usa só esse token.
- Kill switch = só backend; uma única fonte de sessão.
- **Custo:** mais fricção (issueTokens obrigatório após login; sem fallback por sessão).

---

## Decisão atual

- **Vigente:** Opção A (minimalista). Logout-all mata apenas tokens backend; sessão NextAuth expira naturalmente.
- Para evoluir para **Opção B** (kill switch total), usar o esboço da seção “Opção B” acima e implementar a revalidação de `tokenVersion` na callback `jwt` do NextAuth.

---

## Referência

- Rotas alinhadas a este modelo: `api/admin/stats`, `api/admin/recent-users`, `api/admin/users` (GET e POST).
- TokenManager: usa `request.cookies` quando passado (Route Handlers).
