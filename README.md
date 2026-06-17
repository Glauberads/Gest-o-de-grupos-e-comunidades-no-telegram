# Gestor de Comunidades Telegram

MVP SaaS para venda e operacao de comunidades pagas no Telegram com checkout Pix via Asaas, automacao por bot e arquitetura preparada para multi-tenant.

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

1. Admin cria organizacao, comunidade e planos.
2. Checkout publico cria cliente e cobranca Pix no Asaas.
3. Asaas envia webhook de confirmacao.
4. API valida evento, persiste pagamento e ativa membro.
5. Servico Telegram gera convite unico e libera o acesso.

## Estado atual da implementacao

- Auth real via Supabase no frontend com login, cadastro e sessao persistida.
- Bootstrap automatico do primeiro tenant apos cadastro do admin.
- API autenticada com token Bearer do Supabase para identificar o usuario.
- Persistencia real de `users`, `organizations`, `organization_users`, `communities` e `plans`.
- Script para promover usuarios a `super_admin` via `app_metadata`.
- Checkout Pix, Telegram e webhooks ainda estao em modo base estrutural, prontos para a proxima iteracao funcional.

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
- `communities`: configuracao funcional e comercial da comunidade.
- `telegram_chats`: metadados do grupo/canal e permissao do bot.
- `plans`: catalogo de planos por comunidade.
- `members`: ciclo de vida do acesso do comprador.
- `asaas_customers`: espelho do customer remoto.
- `payments`: cobrancas unicas e seus estados.
- `subscriptions`: recorrencia futura.
- `invite_links`: links gerados e consumidos pelo Telegram.
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
- `GET /api/organizations`
- `POST /api/communities`
- `GET /api/communities?organizationId=<uuid>`
- `POST /api/plans`
- `GET /api/plans?organizationId=<uuid>&communityId=<uuid>`
- `POST /api/public/checkout/pix`
- `POST /api/webhooks/asaas`

## Comandos

```bash
npm install
npm run dev
npm run check
npm run build
npm run set:super-admin -- <user-id>
```
