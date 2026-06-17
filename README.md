# Mercadinho Telegram Mini App

Mini App de mercadinho para Telegram com cardapio, controle de quantidade direto nos produtos, checkout e invoice do Telegram.

## Rodar localmente

```bash
npm install
npm run dev:full
```

Ou, se quiser iniciar direto pelo Node:

```bash
node index.js
```

Abra:

```text
http://127.0.0.1:5173
```

Sem tokens do Telegram, o backend retorna uma invoice mock e o app simula pagamento aprovado para desenvolvimento local.

## Painel de controle local

O painel administrativo deste projeto fica na rota:

```text
http://127.0.0.1:5173/painel
```

As areas seguem a organizacao do painel antigo do mercadinho e as funcoes principais ja rodam dentro deste projeto:

- Dashboard com resumo de pedidos, produtos, clientes e estoque.
- Secoes, grupos de produtos e produtos/opcoes com cadastro pelo painel.
- Estoque com ajuste rapido por produto.
- Pedidos criados pelo checkout do Mini App.
- Clientes e configuracoes gerais da loja.

Os dados locais do painel ficam em:

```text
data/panel-state.json
```

O cardapio do cliente carrega `GET /api/miniapp/catalog`, que e gerado a partir dos produtos cadastrados no painel. O backend tambem usa esse mesmo catalogo para validar os precos da invoice do Telegram.

## Pagamento real no Telegram

1. Crie o bot no BotFather.
2. Configure um provedor de pagamento no BotFather para obter `TELEGRAM_PROVIDER_TOKEN`.
3. Copie `.env.example` para `.env`.
4. Preencha `TELEGRAM_BOT_TOKEN` e `TELEGRAM_PROVIDER_TOKEN`.
5. Rode `npm run dev:full`.
6. Configure um webhook HTTPS apontando para `/api/telegram/webhook`.

O fluxo real e:

1. Cliente escolhe produtos no cardapio usando `- quantidade +`.
2. Cliente abre o checkout para revisar o pedido.
3. Cliente clica em `Finalizar no Telegram`.
4. Frontend chama `POST /api/telegram/create-invoice`.
5. Backend valida os itens pelo catalogo do servidor e chama `createInvoiceLink`.
6. Mini App abre a invoice com `Telegram.WebApp.openInvoice`.
7. Telegram coleta endereco/opcao de entrega e pagamento.
8. Telegram envia `shipping_query` e `pre_checkout_query` para o webhook.
9. Backend responde `answerShippingQuery` e `answerPreCheckoutQuery`.
10. Telegram envia `successful_payment`.
11. Pedido fica confirmado pelo webhook.

## Publicacao no GitHub Pages

A publicacao do Mini App no GitHub Pages usa a branch `gh-pages`, gerada a partir do build estatico em `dist`.

A URL publica fica no formato:

```text
https://mvmozzer.github.io/MiniAppTelegramMercadinho/
```

Essa URL pode ser colocada no bot como Web App URL. Quando o Mini App roda no GitHub Pages sem um backend HTTPS de invoice, o checkout usa `Telegram.WebApp.sendData` para enviar o pedido ao bot e manter entrega/pagamento dentro do Telegram.

Para invoice real do Telegram, hospede tambem o backend Express em HTTPS, configure `TELEGRAM_BOT_TOKEN` e `TELEGRAM_PROVIDER_TOKEN`, e aponte o webhook para `/api/telegram/webhook`.

## Scripts

```bash
npm test
npm run build
npm run dev
npm run server
npm run dev:full
```

## Referencia visual

A direcao aprovada esta em:

```text
docs/design/mercadinho-option-a-flow.png
```
