## Plano de implementação

### 1. Perfil oficial @garavelotem (plataforma)

**Banco:**
- Adicionar `garavelotem` à lista `reserved` na função `validate_business_username` (impede que qualquer empresa use esse username).
- Adicionar coluna `is_platform boolean default false` em `businesses` — marca a empresa oficial da plataforma.
- Criar registro `businesses` oficial com `username='garavelotem'`, `is_platform=true`, `status='approved'`, `is_verified=true`, vinculado ao seu user_id de admin, plano Pro.

**Filtros no frontend (ocultar de listagens):**
- `src/routes/index.tsx`, `src/routes/buscar.tsx`, `src/routes/categorias.$slug.tsx`, `src/routes/empresas.tsx`, `src/routes/favoritos.tsx` (qualquer query pública de listagem) — adicionar `.eq('is_platform', false)` ou `.or('is_platform.is.null,is_platform.eq.false')`.
- Página `/garavelotem` continua acessível normalmente via `$username.tsx`.
- Avatar/nome em comentários e likes do feed clicam para `/garavelotem`.

### 2. Sistema de avaliações com aprovação

**Banco — alterações em `reviews`:**
- Adicionar `status review_status default 'pending'` (enum: pending, approved, rejected).
- Adicionar `reviewed_at`, `reviewed_by`, `admin_note`.
- **Atualizar RLS:**
  - SELECT público: apenas `status = 'approved'` (autor vê as suas próprias + admin vê todas).
  - INSERT: usuário autenticado cria (sempre nasce pending).
  - UPDATE: **removida** para o autor; apenas admin pode atualizar (aprovar/rejeitar).
  - DELETE: **removida** para autor e dono da empresa; apenas admin.
- Trigger: impedir o autor de editar `rating`/`comment` após criação (UPDATE só permitido para admin via política).

**Frontend:**
- Componente `BusinessReviews` na página da empresa (`empresa.$slug.tsx`): formulário (estrelas 1-5 + comentário), lista de avaliações aprovadas com média.
- Aviso "sua avaliação está em análise" quando o próprio autor visualiza.
- Nova aba admin `/admin/avaliacoes` — fila de pendentes, botões Aprovar / Rejeitar / Excluir, com nota interna.
- Adicionar tab "Avaliações" no menu admin.

### 3. Sistema de seguidores (empresa-alvo)

**Banco — nova tabela `business_followers`:**
- `id`, `business_id` (alvo, sempre empresa), `follower_user_id` (nullable), `follower_business_id` (nullable), `created_at`.
- Constraint: exatamente um de `follower_user_id` ou `follower_business_id` preenchido.
- Unique `(business_id, follower_user_id)` e `(business_id, follower_business_id)`.
- Constraint: empresa não pode seguir a si mesma.
- RLS: SELECT público (para contadores); INSERT/DELETE pelo dono (usuário próprio ou dono da empresa seguidora).

**Frontend:**
- Botão "Seguir" na página da empresa:
  - Usuário logado sem empresa: segue como usuário.
  - Usuário logado com 1+ empresas Pro: dropdown para escolher seguir como pessoa ou como uma das suas empresas.
- Contador de seguidores na página da empresa.
- Aba "Seguindo" em `/conta` listando empresas seguidas (pessoais + por empresa).

### 4. Perfis de usuário não-clicáveis

Auditar `BusinessFeed.tsx` e qualquer renderização de comentários/likes/avaliações:
- Avatar + nome de usuário comum: apenas texto, sem link.
- Avatar + nome quando o autor é uma empresa (incluindo @garavelotem): link para `/$username` ou `/empresa/$slug`.
- Para isso, comentários/likes/avaliações passam a poder ser "feitos por uma empresa" — adicionar coluna opcional `as_business_id` em `post_comments`, `post_likes`, `reviews`. Quando preenchida, a UI mostra a identidade da empresa (clicável); caso contrário mostra usuário (não clicável).

### Detalhes técnicos

- Migrations em ordem: (a) reserved username + is_platform + insert oficial; (b) reviews approval; (c) followers; (d) as_business_id em interações.
- Após cada migration, atualizar `types.ts` é automático.
- Frontend: criar `src/components/site/BusinessReviews.tsx`, `src/components/site/FollowButton.tsx`, `src/routes/_authenticated.admin.avaliacoes.tsx`.

### Pergunta antes de começar

Para criar o registro oficial `@garavelotem` preciso do seu `user_id` de admin. Quer que eu use o primeiro admin encontrado em `user_roles` automaticamente, ou prefere informar um e-mail específico?
