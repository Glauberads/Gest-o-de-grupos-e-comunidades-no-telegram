# Gestor de Comunidades Telegram

SaaS multi-tenant para donos de comunidades Telegram. O cliente assina a plataforma, libera o painel via Asaas, conecta o bot ao grupo e gerencia moderacao, automacoes e operacao da comunidade.

## Documentacao complementar

- Manual operacional: `manual de uso.md`

## Regra de negocio atual

O fluxo principal do MVP e:

1. O dono da comunidade cria conta.
2. O sistema cria a `organization` em `pending_payment`.
3. O cliente escolhe um `platform_plan`.
4. O backend gera cobranca Pix da assinatura do SaaS via Asaas da plataforma.
5. O webhook confirma o pagamento.
6. A `organization` e a `organization_subscription` ficam `active`.
7. O painel e liberado.
8. O cliente conecta o bot Telegram e passa a operar a comunidade.

O modulo futuro de cobranca dos membros da comunidade continua preparado na arquitetura, mas nao e mais o fluxo principal do MVP.

## Arquitetura proposta

### Contextos principais

- `apps/web`: painel admin e checkout publico em React + Vite + Tailwind + componentes no padrao Shadcn UI.
- `apps/api`: API Node.js com Fastify, modulos de dominio, webhooks e servicos de integracao.
- `packages/shared`: contratos compartilhados entre frontend e backend.
- `supabase`: migrations SQL, seeds e artefatos de banco para PostgreSQL/Supabase.

### Principios de desenho

- Multi-tenant por `organization_id` em todas as entidades de negocio.
- Integracoes externas isoladas em `services`.
- Fluxos assincronos orientados a eventos: webhook do Asaas confirma pagamento e dispara automacoes do Telegram.
- Idempotencia por `webhook_events.provider_event_id`.
- Preparado para evoluir de Pix unico para boleto, cartao e assinaturas recorrentes sem reescrever o core.

### Fluxo principal do MVP

1. Admin cria conta e organizacao.
2. Escolhe um plano SaaS.
3. Gera Pix de assinatura via Asaas da plataforma.
4. Webhook confirma o pagamento e ativa a organizacao.
5. Cliente conecta o bot Telegram.
6. Cliente gerencia comunidade, grupos e automacoes.

## Estado atual da implementacao

- Auth real via Supabase no frontend com login, cadastro e sessao persistida.
- Bootstrap automatico do primeiro tenant apos cadastro do admin.
- API autenticada com token Bearer do Supabase para identificar o usuario.
- Persistencia real de `users`, `organizations`, `organization_users`, `communities` e `plans`.
- Camada de billing SaaS com `platform_plans`, `organization_subscriptions` e `organization_payments`.
- Script para promover usuarios a `super_admin` via `app_metadata`.
- Guardas de frontend para bloquear o painel quando a organizacao nao estiver `active`.
- Fluxo de Telegram por bot com validacao de token, registro de grupo e mensagem de teste.

## Deploy recomendado atual

- Frontend: Cloudflare Pages apontando para `apps/web`.
- Backend: Render Web Service usando `render.yaml`.
- Banco e Auth: Supabase.

### Cloudflare Pages

- Framework preset: `Vite`.
- Root directory: `apps/web`.
- Build command: `npm install && npm run build`.
- Build output directory: `dist`.
- Variaveis obrigatorias:
  - `VITE_API_URL=https://<seu-backend-render>.onrender.com`
  - `VITE_SUPABASE_URL=https://exuffrthxjvnankwzcqh.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<sua-anon-key>`
- O arquivo `apps/web/public/_redirects` ja foi adicionado para o SPA fallback do React Router.

### Render

- O arquivo `render.yaml` ja descreve o servico do backend.
- Se preferir configurar manualmente no painel:
  - Service type: `Web Service`
  - Runtime: `Node`
  - Root directory: `.`
  - Build command: `npm install && npm run build -w @gestor/api`
  - Start command: `npm run start -w @gestor/api`
  - Health check path: `/health`
- Variaveis obrigatorias:
  - `APP_URL=https://<seu-projeto>.pages.dev`
  - `APP_URLS=https://<seu-projeto>.pages.dev,https://<dominio-custom>`
  - `DATABASE_URL=<connection-string-se-voce-for-usar>`
  - `SUPABASE_URL=https://exuffrthxjvnankwzcqh.supabase.co`
  - `SUPABASE_ANON_KEY=<sua-anon-key>`
  - `SUPABASE_SERVICE_ROLE_KEY=<sua-service-role>`
  - `JWT_SECRET=<segredo-forte>`
  - `ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3`
  - `ASAAS_API_KEY=<sua-chave-asaas>`
  - `ASAAS_WEBHOOK_TOKEN=<token-webhook-asaas>`
  - `TELEGRAM_BOT_TOKEN=<token-bot>`
  - `TELEGRAM_WEBHOOK_SECRET=<segredo-webhook-telegram>`

### Ordem de publicacao

1. Aplicar `supabase/migrations/0001_initial_schema.sql` no projeto Supabase.
2. Publicar a API no Render e copiar a URL publica.
3. Configurar `VITE_API_URL` no Cloudflare Pages com a URL do Render.
4. Publicar o frontend no Cloudflare Pages.
5. Atualizar `APP_URL` e `APP_URLS` no Render com a URL final do Pages.
6. Configurar webhooks do Asaas e do Telegram apontando para o backend publicado.

## Riscos tecnicos

- Permissoes do Telegram: o bot precisa estar como administrador com permissao para aprovar/restringir membros.
- Confiabilidade de webhook: duplicidade, atraso ou entrega fora de ordem exigem idempotencia e reconciliacao.
- Convites e aprovacoes: links do Telegram podem expirar ou ser usados fora da janela esperada; isso exige rastreio por `invite_links`.
- Inadimplencia automatica: remover membro sem considerar feriados, grace period e falhas de webhook gera suporte manual.
- Multi-tenant e seguranca: qualquer consulta sem `organization_id` pode vazar dados entre admins.
- Checkout publico: CPF/CNPJ, email e telefone precisam validacao minima e auditoria.
- Operacao em VPS/Vercel: webhook do Telegram e Asaas exige endpoint publico HTTPS e observabilidade.

## Estrutura de pastas

```text
.
|-- apps
|   |-- api
|   |   |-- src
|   |   |   |-- config
|   |   |   |-- lib
|   |   |   |-- modules
|   |   |   |-- routes
|   |   |   `-- services
|   |   `-- package.json
|   `-- web
|       |-- src
|       |   |-- components
|       |   |-- features
|       |   |-- lib
|       |   |-- pages
|       |   `-- styles
|       `-- package.json
|-- packages
|   `-- shared
|-- supabase
|   `-- migrations
`-- README.md
```

## Schema inicial do banco

### Tabelas centrais

- `users`: identidade do admin.
- `organizations`: tenant principal.
- `organization_users`: vinculo N:N entre usuario e tenant.
- `platform_plans`: planos do SaaS.
- `organization_subscriptions`: assinatura do cliente para usar a plataforma.
- `organization_payments`: pagamentos da assinatura SaaS.
- `communities`: configuracao funcional e comercial da comunidade do cliente.
- `telegram_bots`: bot conectado por organization.
- `telegram_groups`: grupos/canais vinculados por organization.
- `plans`: preparado para community plans futuros.
- `members`, `payments`, `subscriptions`, `invite_links`: base para modulo futuro de cobranca de membros.
- `webhook_events`: auditoria e idempotencia.
- `bot_logs`: rastreio de acoes de automacao.
- `automations`: regras parametrizadas por comunidade.

### Decisoes de modelagem

- `members` guarda o estado consolidado do acesso.
- `payments` guarda eventos financeiros unitarios, inclusive Pix.
- `subscriptions` fica opcional no MVP, mas ja prevista.
- `webhook_events` armazena payload bruto para auditoria.

## Roadmap incremental

### Fase 1

- Monorepo, auth base, schema SQL e API de health.
- Cadastro de organizacao/comunidade/plano.
- Checkout publico Pix.
- Webhook Asaas com idempotencia.
- Liberacao de membro e convite Telegram.

### Fase 2

- Dashboard com metricas reais.
- Avisos de vencimento e remocao automatica.
- Boleto, cartao e assinaturas.
- RLS no Supabase e observabilidade.

## Ambiente

Copie `apps/api/.env.example` para `apps/api/.env` e `apps/web/.env.example` para `apps/web/.env`.

### Supabase conectado

- `apps/web/.env` ja foi preenchido com a `SUPABASE_URL` e a `anon key` informadas por voce.
- `apps/api/.env` ja foi preenchido com `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- O frontend usa Supabase Auth para login e cadastro do admin.
- O backend usa Supabase Admin em `apps/api/src/lib/supabase.ts` para persistencia segura server-side.
- Se a confirmacao de email estiver ativa no projeto Supabase, o login so funciona apos confirmar o email.
- A migration `supabase/migrations/0001_initial_schema.sql` precisa estar aplicada no projeto Supabase para os endpoints persistentes funcionarem corretamente.

### Super admin

- O projeto reconhece `super_admin` via `app_metadata` no Supabase Auth.
- O script `npm run set:super-admin -- <user-id>` promove um usuario para `app_metadata.role = "super_admin"` e `app_metadata.is_super_admin = true`.
- O backend expoe esse papel em `apps/api/src/lib/auth.ts`.

### Seguranca

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Como a `service role` foi compartilhada durante a configuracao, o recomendado e rotaciona-la no painel do Supabase apos concluir o setup inicial.
- Mantenha chaves do Asaas e do Telegram apenas em variaveis de ambiente server-side.

## Endpoints atuais

- `GET /health`
- `GET /api/auth/me`
- `POST /api/auth/bootstrap`
- `GET /api/platform-plans`
- `POST /api/billing/checkout/pix`
- `GET /api/billing/subscription`
- `POST /api/billing/reactivate`
- `GET /api/organizations`
- `POST /api/communities`
- `GET /api/communities?organizationId=<uuid>`
- `POST /api/plans`
- `GET /api/plans?organizationId=<uuid>&communityId=<uuid>`
- `POST /api/telegram/bot/connect`
- `GET /api/telegram/bot/status`
- `POST /api/telegram/test-message`
- `POST /api/telegram/groups`
- `GET /api/telegram/groups?organizationId=<uuid>`
- `POST /api/webhooks/asaas`

## Comandos

```bash
npm install
npm run dev
npm run check
npm run build
npm run set:super-admin -- <user-id>
```
