# Manual de uso para o cliente final

Este manual foi criado para orientar o uso da plataforma `Gestorgram` por administradores de comunidades no Telegram.

## O que e a plataforma

O `Gestorgram` permite:

- vender acesso a comunidades pagas no Telegram
- gerenciar membros
- organizar planos de acesso
- acompanhar pagamentos
- automatizar parte da operacao da comunidade

## Como acessar

1. Abra o site oficial da plataforma
2. Entre com seu email e senha
3. Apos o login, voce sera levado ao painel principal

Se ainda nao tiver conta:

1. Clique em `Criar conta`
2. Preencha seus dados
3. Finalize o cadastro
4. Entre no painel com seu email e senha

## O que voce encontra no painel

No painel principal voce pode visualizar:

- informacoes gerais da operacao
- tenant ou organizacao atual
- indicativos de membros
- receita estimada
- status inicial da estrutura da comunidade

## Como funciona a estrutura da plataforma

A organizacao da plataforma segue esta logica:

- `Conta`: seu acesso pessoal ao sistema
- `Organizacao`: sua operacao principal
- `Comunidade`: o grupo, canal ou ambiente pago
- `Plano`: a oferta comercial da comunidade
- `Membro`: o cliente que comprou acesso

## Comunidades

Cada comunidade representa um grupo ou canal vinculado ao seu negocio.

Em uma comunidade, voce podera cadastrar:

- nome
- descricao
- link publico
- identificador do chat no Telegram
- configuracoes de automacao

## Planos

Os planos sao as formas de acesso vendidas ao seu cliente.

Exemplos:

- mensal
- trimestral
- anual
- vitalicio

Cada plano pode ter:

- nome
- descricao
- preco
- duracao
- status ativo ou inativo

## Membros

Os membros sao as pessoas que compram acesso a sua comunidade.

Cada membro pode ter:

- nome
- email
- WhatsApp
- CPF ou CNPJ
- plano atual
- status de acesso
- historico de pagamento

## Status de membro

Os principais status de membro sao:

- `pendente`: cadastro iniciado, aguardando pagamento ou liberacao
- `ativo`: acesso liberado
- `vencido`: pagamento expirado ou acesso vencido
- `removido`: acesso encerrado e membro retirado
- `cancelado`: assinatura ou acesso cancelado

## Pagamentos

O sistema foi preparado para trabalhar com pagamentos digitais.

No fluxo principal:

1. o cliente escolhe um plano
2. preenche os dados
3. gera o pagamento
4. apos confirmacao, o acesso e liberado automaticamente

No MVP, o foco principal e:

- Pix

Depois, a operacao pode evoluir para:

- boleto
- cartao
- assinatura recorrente

## Telegram

Para a automacao funcionar corretamente:

- o bot precisa estar no grupo ou canal
- o bot precisa ter permissao adequada
- a comunidade precisa estar conectada ao Telegram corretamente

Com isso, o sistema pode:

- gerar convite
- aprovar entrada
- liberar acesso
- restringir ou remover inadimplentes

## Boas praticas para o cliente final

- use um email que voce acessa com frequencia
- mantenha sua senha em local seguro
- confirme se o bot esta corretamente configurado no Telegram
- revise se o plano, preco e comunidade estao corretos antes de vender
- acompanhe periodicamente membros ativos e pagamentos

## Quando algo parecer errado

Se voce encontrar um comportamento inesperado, verifique:

- se o login foi feito com a conta correta
- se a comunidade esta ligada ao tenant correto
- se o plano esta ativo
- se o pagamento foi realmente confirmado
- se o bot tem permissao no Telegram

## Suporte

Se houver erro de acesso, pagamento ou operacao da comunidade, tenha em maos:

- email da conta
- nome da comunidade
- nome do plano
- horario do problema
- print da tela, se possivel

Isso acelera a analise e a correcao.

## Resumo rapido

O fluxo normal de uso da plataforma e:

1. entrar no painel
2. configurar sua organizacao
3. criar ou revisar sua comunidade
4. cadastrar os planos
5. conectar o Telegram
6. divulgar o link de venda
7. acompanhar membros e pagamentos

## Estado atual do produto

Nesta fase, a plataforma ja possui:

- autenticacao
- painel inicial
- tenant carregado
- base para comunidades, planos, pagamentos e Telegram

Novas funcoes serao adicionadas de forma progressiva para ampliar a operacao.
