# GestorGram

SaaS multi-tenant para donos de comunidades Telegram. O cliente assina a plataforma, libera o painel via Asaas, conecta o bot ao grupo e passa a operar comunidades, grupos e automações em um painel único.

## Documentação complementar

- Operação técnica e deploy: `manual de uso.md`
- Manual do cliente final: `manual de uso pro cliente final.md`

## Regra de negócio atual

O fluxo principal do produto é:

1. o usuário cria conta e faz login
2. o sistema cria a `organization` em `pending_payment`
3. o cliente escolhe um plano SaaS da plataforma
4. o backend gera a cobrança Pix via Asaas
5. o webhook confirma o pagamento
6. a `organization` e a `organization_subscription` ficam `active`
7. o painel é liberado
8. o cliente conecta o bot Telegram e gerencia a comunidade

Importante:

- o produto **não** está usando como fluxo principal a cobrança de membros da comunidade
- cobrança de membros continua como módulo futuro

## Arquitetura atual

### Stack

- Frontend: React + TypeScript + Vite
- UI: TailwindCSS + componentes próprios em estilo Shadcn
- Backend: Fastify + Node.js
- Banco/Auth: Supabase/PostgreSQL
- Pagamentos: Asaas
- Bot: Telegram Bot API

### Estrutura

```text
.
|-- apps
|   |-- api
|   |   `-- src
|   |       |-- config
|   |       |-- lib
|   |       |-- modules
|   |       `-- services
|   `-- web
|       `-- src
|           |-- components
|           |-- features
|           |-- lib
|           `-- pages
|-- packages
|   `-- shared
|-- render.yaml
|-- supabase
|   `-- migrations
|-- README.md
|-- manual de uso.md
`-- manual de uso pro cliente final.md
```

## Experiência atual do produto

### Público

- `/`: landing pública
- `/auth`: login e cadastro
- `/c/:slug`: checkout público de comunidade

### Tenant

- `/app`: redireciona conforme status
- `/app/dashboard`: visão executiva do workspace
- `/app/communities`
- `/app/communities/new`
- `/app/telegram/connect`
- `/app/telegram/groups`
- `/app/telegram/logs`
- `/app/subscription`
- `/app/subscription/history`

### Super admin

- `/app/admin/dashboard`
- `/app/admin/plans`
- `/app/admin/users`
- `/app/admin/organizations`

## Guards e redirecionamentos

Regras centralizadas no frontend:

- super admin entra pelo login normal e cai em `/app/admin/dashboard`
- super admin não usa a área `/app/subscription`
- tenant `pending_payment` vai para `/app/subscription`
- tenant `overdue`, `suspended` ou `cancelled` também vai para `/app/subscription`
- tenant `active` acessa o painel normalmente
- rotas Telegram exigem organização ativa no backend

## Estados de assinatura

- `pending_payment`: aguardando confirmação
- `active`: operação liberada
- `overdue`: pagamento vencido, precisa regularizar
- `suspended`: uso bloqueado até nova cobrança
- `cancelled`: assinatura cancelada, precisa reativar

## O que já está implementado

- autenticação Supabase Auth
- bootstrap da organização principal
- shell SaaS com sidebar, header e navegação separada
- área de super admin separada
- billing SaaS da plataforma
- checkout Pix via Asaas
- histórico de pagamentos da assinatura
- webhook Asaas idempotente
- health check mais robusto
- validação do bot Telegram com `getMe`
- cadastro de grupos conectados
- envio de mensagem teste
- logs operacionais do bot
- guards centralizados para tenant e super admin
- lazy loading das rotas privadas e administrativas

## Endpoints principais

### Sistema

- `GET /health`

### Auth e organização

- `GET /api/auth/me`
- `POST /api/auth/bootstrap`
- `GET /api/organizations`

### Billing SaaS

- `GET /api/platform-plans`
- `POST /api/billing/checkout/pix`
- `POST /api/billing/reactivate`
- `GET /api/billing/subscription?organizationId=<uuid>`
- `GET /api/billing/history?organizationId=<uuid>`

### Comunidades

- `POST /api/communities`
- `GET /api/communities?organizationId=<uuid>`

### Telegram

- `POST /api/telegram/bot/connect`
- `GET /api/telegram/bot/status?organizationId=<uuid>`
- `POST /api/telegram/test-message`
- `POST /api/telegram/groups`
- `GET /api/telegram/groups?organizationId=<uuid>`
- `GET /api/telegram/logs?organizationId=<uuid>`

### Admin global

- `GET /api/admin/users`
- `GET /api/admin/organizations`

### Público

- `POST /api/public/checkout/pix`
- `POST /api/webhooks/asaas`

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` fica somente no backend
- `ASAAS_API_KEY` fica somente no backend
- token do bot não volta a ser exibido no frontend depois de salvo
- endpoints privados exigem `Authorization: Bearer <token>`
- webhook do Asaas continua idempotente via `webhook_events`
- erros em produção não expõem stack trace
- validação de env falha com mensagem clara

## Health check

`GET /health` agora retorna:

- `status`
- `service`
- `env`
- `uptimeSeconds`
- `timestamp`
- `app.allowedOrigins`
- `integrations.supabase`
- `integrations.asaas`
- `integrations.telegram`

## Build e validação

Comandos:

```bash
npm install
npm run check
npm run build
```

Status atual:

- `npm run check`: ok
- `npm run build`: ok

## Deploy recomendado

- Frontend: Cloudflare Pages apontando para `apps/web`
- Backend: Render apontando para o monorepo com build do workspace `@gestor/api`
- Banco/Auth: Supabase

## Super admin

Para promover um usuário:

```bash
npm run set:super-admin -- <user-id>
```

Esse script define:

- `app_metadata.role = "super_admin"`
- `app_metadata.is_super_admin = true`

## Observações finais

- o produto já está com fluxo coerente para venda: cadastro → assinatura → pagamento → painel liberado → conectar bot → operar comunidade
- analytics avançados e cobrança de membros continuam como evolução futura
