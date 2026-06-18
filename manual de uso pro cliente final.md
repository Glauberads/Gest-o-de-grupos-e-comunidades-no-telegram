# Manual de uso para o cliente final

Este manual explica como usar o `GestorGram` no fluxo atual do produto.

## O que é o GestorGram

O GestorGram é um SaaS para donos de comunidades Telegram.

Hoje, o fluxo principal é:

1. criar conta
2. assinar a plataforma
3. liberar o painel após pagamento
4. conectar o bot Telegram
5. gerenciar comunidades e grupos

Importante:

- a cobrança principal hoje é a **assinatura do próprio GestorGram**
- cobrança de membros da comunidade ainda é uma etapa futura do produto

## Como acessar

### Primeiro acesso

1. abra `https://gestorgram.glauberads.com.br`
2. clique em `Criar conta`
3. faça seu cadastro
4. entre com email e senha

### Se você já tiver conta

1. abra `https://gestorgram.glauberads.com.br/auth`
2. informe email e senha
3. clique em `Entrar`

## O que acontece depois do login

O sistema verifica o status da sua assinatura.

### Se estiver ativa

Você entra normalmente no painel.

### Se ainda não estiver ativa

Você vai para a área de assinatura em:

- `/app/subscription`

Lá o sistema mostra exatamente o que falta fazer:

- pagar o Pix
- regularizar um vencimento
- reativar uma conta suspensa

## Estrutura do painel

O painel está organizado em módulos:

- `Dashboard`
- `Comunidades`
- `Telegram`
- `Automações`
- `Membros`
- `Assinatura`
- `Configurações`

## Fluxo ideal de uso

### 1. Criar conta

Você cria sua conta e entra no sistema.

### 2. Escolher um plano

Na página de assinatura, escolha o plano da plataforma:

- Starter
- Pro
- Scale

### 3. Gerar o pagamento Pix

Informe CPF ou CNPJ e clique para gerar a cobrança.

O sistema pode mostrar:

- QR Code Pix
- código Pix copia e cola
- botão para abrir a cobrança do Asaas dentro da própria tela

### 4. Aguardar a confirmação

Depois do pagamento, o sistema libera o painel automaticamente.

Você não precisa pedir liberação manual.

### 5. Entrar no dashboard

Com a assinatura ativa, você acessa:

- dashboard executivo
- comunidades
- Telegram
- demais áreas do painel

## Comunidades

Na área de comunidades você pode:

- ver todas as comunidades cadastradas
- criar uma nova comunidade
- revisar status
- organizar link público e descrição

## Telegram

Depois da assinatura ativa, vá em:

- `/app/telegram/connect`

### Antes de conectar

Você precisa:

1. criar o bot no BotFather
2. copiar o token
3. adicionar o bot no grupo
4. tornar o bot administrador
5. liberar permissões necessárias

### O que o painel faz

O painel ajuda você a:

- validar o token do bot
- salvar o bot com segurança
- vincular o grupo correto
- testar envio de mensagem

### Grupos conectados

Na página:

- `/app/telegram/groups`

você consegue ver:

- nome do grupo
- comunidade vinculada
- chat ID
- tipo do chat
- permissões operacionais

### Logs do bot

Na página:

- `/app/telegram/logs`

você acompanha:

- validação do bot
- vínculos de grupos
- mensagens teste
- eventos operacionais recentes

## Assinatura da plataforma

Na página:

- `/app/subscription`

você encontra:

- plano atual
- status da assinatura
- próxima cobrança
- checkout Pix
- caminho de regularização

### Histórico

Na página:

- `/app/subscription/history`

você encontra:

- cobranças já geradas
- valor
- vencimento
- status
- link da cobrança

## Significado dos status

### Pendente

Sua cobrança foi gerada, mas o pagamento ainda não foi confirmado.

### Ativo

Seu painel está liberado.

### Vencido

Existe uma cobrança em atraso e você precisa regularizar.

### Suspenso

A conta está bloqueada até a regularização.

### Cancelado

A assinatura foi encerrada e precisa ser reativada.

## Quando algo não funcionar

Confira:

- se você está logado com a conta correta
- se a assinatura está ativa
- se o bot foi criado corretamente no BotFather
- se o bot está como admin no grupo
- se o `chat_id` está correto
- se o pagamento Pix foi confirmado

## O que o sistema não mostra por segurança

Depois que o token do bot é salvo:

- ele não aparece novamente no painel

Isso protege sua operação.

## Boas práticas

- use um email que você acompanha
- guarde o token do bot em local seguro
- mantenha o bot como admin apenas no grupo certo
- revise a página de assinatura se o painel bloquear
- confira os logs do bot depois da conexão

## Resumo rápido

O uso ideal hoje é:

1. entrar no site
2. criar conta
3. assinar o GestorGram
4. pagar o Pix
5. aguardar confirmação
6. entrar no painel
7. conectar o bot
8. vincular grupos
9. operar a comunidade
