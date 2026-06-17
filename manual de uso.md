# Manual de uso

Este documento centraliza o uso operacional do projeto `Gestor de Comunidades Telegram`.

## Visao geral

O sistema hoje esta dividido em 3 partes:

- `Frontend`: Cloudflare Pages
- `Backend`: Render
- `Banco + Auth`: Supabase

## URLs atuais

- Frontend principal: `https://gestorgram.glauberads.com.br`
- Frontend alternativo: `https://gestorgram.pages.dev`
- Backend API: `https://gestorgram-api.onrender.com`
- Health check da API: `https://gestorgram-api.onrender.com/health`
- Supabase: `https://exuffrthxjvnankwzcqh.supabase.co`

## Acesso ao painel

1. Abra `https://gestorgram.glauberads.com.br`
2. Entre com email e senha cadastrados no Supabase Auth
3. Ao autenticar, o painel deve redirecionar para `/`
4. O dashboard deve mostrar o tenant atual do usuario

## Ambientes e plataformas

### Cloudflare Pages

Projeto frontend publicado a partir de:

- repositorio GitHub: `Gest-o-de-grupos-e-comunidades-no-telegram`
- branch de producao: `main`
- root directory: `apps/web`
- build command: `npm install && npm run build`
- output directory: `dist`

Variaveis configuradas no Pages:

- `VITE_API_URL=https://gestorgram-api.onrender.com`
- `VITE_SUPABASE_URL=https://exuffrthxjvnankwzcqh.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<anon key do Supabase>`

### Render

Servico backend:

- service name: `gestorgram-api`
- runtime: `Node`
- branch: `main`
- root directory: vazio
- build command: `npm install --include=dev && npm run build -w @gestor/api`
- start command: `npm run start -w @gestor/api`

Variaveis principais no Render:

- `APP_URL=https://gestorgram.glauberads.com.br`
- `APP_URLS=https://gestorgram.glauberads.com.br,https://gestorgram.pages.dev`
- `SUPABASE_URL=https://exuffrthxjvnankwzcqh.supabase.co`
- `SUPABASE_ANON_KEY=<anon key do Supabase>`
- `SUPABASE_SERVICE_ROLE_KEY=<service role key do Supabase>`
- `JWT_SECRET=<segredo forte>`
- `ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3`

### Supabase

Configuracoes importantes:

- `Site URL`: `https://gestorgram.glauberads.com.br`
- `Redirect URLs`:
  - `https://gestorgram.glauberads.com.br`
  - `https://gestorgram.pages.dev`

## Fluxo atual do sistema

### Login

- O frontend autentica o admin usando Supabase Auth
- O token do usuario e enviado no header `Authorization: Bearer <token>`
- O backend valida o token com Supabase Admin

### Tenant

- Cada usuario pode ter uma ou mais `organizations`
- O dashboard atual carrega o tenant principal associado ao usuario

### Comunidades e planos

O backend ja possui endpoints base para:

- criar comunidades
- listar comunidades por organizacao
- criar planos
- listar planos por comunidade

Os endpoints existem, mas o painel ainda esta em fase inicial e ainda nao expoe todo o CRUD visual.

## Endpoints atuais

- `GET /health`
- `GET /api/auth/me`
- `POST /api/auth/bootstrap`
- `GET /api/organizations`
- `POST /api/communities`
- `GET /api/communities?organizationId=<uuid>`
- `POST /api/plans`
- `GET /api/plans?organizationId=<uuid>&communityId=<uuid>`
- `POST /api/public/checkout/pix`
- `POST /api/webhooks/asaas`

## Operacao do projeto localmente

### Requisitos

- Node.js 24+
- npm 11+

### Instalar dependencias

```bash
npm install
```

### Rodar localmente

```bash
npm run dev
```

### Validar o projeto

```bash
npm run check
npm run build
```

## Estrutura principal do repositorio

- `apps/web`: frontend React + Vite
- `apps/api`: backend Fastify
- `packages/shared`: contratos compartilhados
- `supabase/migrations`: schema SQL
- `scripts`: utilitarios operacionais

## Banco e dados iniciais

Migration principal:

- `supabase/migrations/0001_initial_schema.sql`

Entidades principais:

- `users`
- `organizations`
- `organization_users`
- `communities`
- `telegram_chats`
- `plans`
- `members`
- `payments`
- `subscriptions`
- `invite_links`
- `webhook_events`
- `bot_logs`
- `automations`

## Super admin

O projeto reconhece `super_admin` via `app_metadata` no Supabase Auth.

Script utilitario:

```bash
npm run set:super-admin -- <user-id>
```

Esse comando define:

- `app_metadata.role = "super_admin"`
- `app_metadata.is_super_admin = true`

## Dominio customizado

Dominio principal configurado:

- `gestorgram.glauberads.com.br`

Fluxo usado:

1. Criar Pages na Cloudflare
2. Conectar subdominio em `Custom domains`
3. Atualizar `APP_URL` e `APP_URLS` no Render
4. Atualizar `Site URL` e `Redirect URLs` no Supabase

## Boas praticas operacionais

- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Nunca expor credenciais do Asaas no frontend
- Rotacionar chaves sensiveis se forem compartilhadas fora do ambiente seguro
- Usar `Manual Deploy` no Render quando houver mudanca critica de backend
- Confirmar `health` da API apos cada deploy

## Checklist rapido de producao

- Frontend abre no dominio principal
- Login funciona
- Dashboard carrega o tenant
- API responde em `/health`
- Supabase redirect URLs estao corretas
- Render aceita o dominio principal em `APP_URLS`

## Proximos passos recomendados

- Criar CRUD visual de comunidades
- Criar CRUD visual de planos
- Integrar checkout Pix real com Asaas
- Conectar bot Telegram com webhook real
- Automatizar cobranca, liberacao e remocao de membros
