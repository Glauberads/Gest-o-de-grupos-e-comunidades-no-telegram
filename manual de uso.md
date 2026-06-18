# Manual de uso

Manual técnico e operacional do projeto `GestorGram`.

## Visão geral

O ambiente está dividido em:

- Frontend: Cloudflare Pages
- Backend: Render
- Banco/Auth: Supabase
- Integrações externas: Asaas + Telegram Bot API

## URLs atuais

- Frontend principal: `https://gestorgram.glauberads.com.br`
- Frontend alternativo: `https://gestorgram.pages.dev`
- Backend API: `https://gestorgram-api.onrender.com`
- Health check: `https://gestorgram-api.onrender.com/health`
- Supabase: `https://exuffrthxjvnankwzcqh.supabase.co`

## Fluxo principal do produto

1. usuário cria conta
2. sistema cria `organization` em `pending_payment`
3. usuário escolhe plano SaaS
4. backend gera Pix via Asaas
5. webhook confirma pagamento
6. organização fica `active`
7. painel é liberado
8. usuário conecta o bot Telegram

## Regras de acesso

### Tenant

- `active`: acessa rotas privadas normalmente
- `pending_payment`: vai para `/app/subscription`
- `overdue`: vai para `/app/subscription`
- `suspended`: vai para `/app/subscription`
- `cancelled`: vai para `/app/subscription`

### Super admin

- entra pelo mesmo `/auth`
- `/app` redireciona para `/app/admin/dashboard`
- `/app/subscription` não é usado pelo super admin
- shell admin é global, sem foco em cobrança do tenant

## Rotas finais

### Públicas

- `/`
- `/auth`
- `/c/:slug`

### Tenant

- `/app/dashboard`
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

## Variáveis de ambiente

### Frontend

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend

- `NODE_ENV`
- `PORT`
- `APP_URL`
- `APP_URLS`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ASAAS_BASE_URL`
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`

## Configuração atual do Cloudflare Pages

- repositório: `Gest-o-de-grupos-e-comunidades-no-telegram`
- branch: `main`
- root directory: `apps/web`
- build command: `npm install && npm run build`
- output directory: `dist`

### Variáveis no Pages

- `VITE_API_URL=https://gestorgram-api.onrender.com`
- `VITE_SUPABASE_URL=https://exuffrthxjvnankwzcqh.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<anon key>`

## Configuração atual do Render

- service: `gestorgram-api`
- runtime: `Node`
- branch: `main`
- root directory: `.`
- build command: `npm install --include=dev && npm run build -w @gestor/api`
- start command: `npm run start -w @gestor/api`
- health check path: `/health`

### Variáveis no Render

- `APP_URL=https://gestorgram.glauberads.com.br`
- `APP_URLS=https://gestorgram.glauberads.com.br,https://gestorgram.pages.dev`
- `SUPABASE_URL=https://exuffrthxjvnankwzcqh.supabase.co`
- `SUPABASE_ANON_KEY=<anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<service role key>`
- `JWT_SECRET=<segredo forte>`
- `ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3`
- `ASAAS_API_KEY=<token do Asaas>`
- `ASAAS_WEBHOOK_TOKEN=<token do webhook>`
- `TELEGRAM_BOT_TOKEN=<token do bot>`
- `TELEGRAM_WEBHOOK_SECRET=<segredo interno>`

## Configuração atual do Supabase

### Auth URL Configuration

- Site URL: `https://gestorgram.glauberads.com.br`
- Redirect URLs:
  - `https://gestorgram.glauberads.com.br`
  - `https://gestorgram.pages.dev`

## Endpoints implementados

### Sistema

- `GET /health`

### Billing

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

### Admin

- `GET /api/admin/users`
- `GET /api/admin/organizations`

### Público

- `POST /api/public/checkout/pix`
- `POST /api/webhooks/asaas`

## Health check

O health retorna:

- `status`
- `service`
- `env`
- `uptimeSeconds`
- `timestamp`
- `app.allowedOrigins`
- `integrations.supabase`
- `integrations.asaas`
- `integrations.telegram`

Uso:

- validar se a API está viva
- validar se Supabase está respondendo
- validar se Asaas e Telegram estão configurados

## Telegram

### Pré-requisitos

- organização `active`
- bot criado no BotFather
- token salvo no backend
- bot adicionado ao grupo
- bot com permissão de admin

### Fluxo técnico

1. `POST /api/telegram/bot/connect`
2. backend valida token com `getMe`
3. backend salva token criptografado
4. usuário vincula grupo via `POST /api/telegram/groups`
5. usuário testa envio via `POST /api/telegram/test-message`
6. eventos aparecem em `/api/telegram/logs`

## Billing / assinatura

### Estados suportados

- `pending_payment`
- `active`
- `overdue`
- `suspended`
- `cancelled`

### Comportamento

- `pending_payment`: cobrança aberta, painel bloqueado
- `active`: painel liberado
- `overdue`: painel bloqueado até regularização
- `suspended`: painel bloqueado
- `cancelled`: precisa nova assinatura/reativação

## Segurança

- nenhuma chave sensível vai para o frontend
- backend exige Bearer token nos endpoints privados
- token do bot não é devolvido ao frontend
- webhooks usam controle de idempotência
- erros em produção não retornam stack trace
- cliente Asaas e Telegram só mockam fora de produção quando falta configuração

## Checklist de deploy

### Cloudflare Pages

- conectar repositório correto
- usar root `apps/web`
- configurar `VITE_API_URL`
- configurar `VITE_SUPABASE_URL`
- configurar `VITE_SUPABASE_ANON_KEY`
- confirmar domínio customizado

### Render

- confirmar branch `main`
- confirmar build/start command
- revisar variáveis sensíveis
- validar `/health`
- testar `GET /api/platform-plans`

### Supabase

- rodar migrations
- revisar `Site URL`
- revisar `Redirect URLs`
- confirmar usuário super admin se necessário

## Checklist de teste em produção

- abrir `/`
- criar conta em `/auth`
- confirmar criação da organização
- validar redirecionamento para `/app/subscription`
- gerar Pix de assinatura
- confirmar webhook do Asaas
- validar acesso ao `/app/dashboard`
- conectar bot em `/app/telegram/connect`
- vincular grupo em `/app/telegram/groups`
- validar logs em `/app/telegram/logs`
- validar super admin em `/app/admin/dashboard`

## Comandos locais

```bash
npm install
npm run dev
npm run check
npm run build
npm run set:super-admin -- <user-id>
```

## Status de validação

- `npm run check`: ok
- `npm run build`: ok
