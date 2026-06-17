# Mercadinho Telegram Mini App

Mini App de mercadinho para Telegram com cardapio, controle de quantidade direto nos produtos, checkout Pix estatico, comprovante e painel de controle.

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

Sem tokens do Telegram, o app ainda cria pedido local e mostra o Pix configurado. Dentro do Telegram, o bot recebe o pedido pelo Web App e envia o Pix no chat.

## Painel de controle local

O painel administrativo deste projeto fica na rota:

```text
http://127.0.0.1:5173/painel
```

As areas seguem a organizacao do painel antigo do mercadinho e as funcoes principais ja rodam dentro deste projeto:

- Dashboard com resumo de pedidos, produtos, clientes e estoque.
- Secoes, grupos de produtos e produtos/opcoes com cadastro pelo painel.
- Estoque com ajuste rapido por produto.
- Pedidos criados pelo checkout Pix do Mini App.
- Conferencia de comprovante Pix com aprovar/recusar no painel.
- Entregadores com cadastro, atribuicao de pedido, aceite e atualizacao de status.
- Fornecedores com cadastro e solicitacoes de atualizacao de preco.
- Clientes e configuracoes gerais da loja.

Os dados locais do painel ficam em:

```text
data/panel-state.json
```

O cardapio do cliente carrega `GET /api/miniapp/catalog`, que e gerado a partir dos produtos cadastrados no painel. O backend tambem usa esse mesmo catalogo para validar os precos do pedido Pix.

## Pagamento Pix no Telegram

1. Crie o bot no BotFather.
2. Copie `.env.example` para `.env`.
3. Preencha `TELEGRAM_BOT_TOKEN`, `TELEGRAM_DELIVERY_BOT_TOKEN` e `TELEGRAM_ADMIN_BOT_TOKEN`.
4. Preencha `PIX_RECEBEDOR`, `PIX_CHAVE`, `PIX_CIDADE` e `PIX_COPIA_COLA`.
5. Rode `node index.js` ou `npm run dev:full`.
6. Configure o webhook HTTPS do bot do cliente apontando para `/api/telegram/webhook`.
7. Configure o webhook HTTPS do bot de entregadores apontando para `/api/telegram/delivery-webhook`.

O fluxo real e:

1. Cliente escolhe produtos no cardapio usando `- quantidade +`.
2. Cliente abre o checkout para revisar o pedido.
3. Cliente clica em `Gerar Pix no Telegram`.
4. Frontend chama `POST /api/miniapp/checkout/pix`.
5. Backend valida os itens pelo catalogo do servidor e grava o pedido como `aguardando_comprovante`.
6. Mini App envia o pedido ao bot com `Telegram.WebApp.sendData`.
7. Bot do cliente envia a mensagem Pix com valor, recebedor e copia e cola.
8. Cliente paga fora do Telegram e envia foto/documento do comprovante no chat.
9. Webhook salva o comprovante e muda o pagamento para `comprovante_recebido`.
10. Painel aprova ou recusa o comprovante.
11. Pedido aprovado avanca para separacao/preparo e pode ser atribuido ao entregador.
12. Entregador usa `/entregas`, `/aceitar CODIGO` e `/status CODIGO entregue` no bot de entregadores.

## Publicacao no GitHub Pages

A publicacao do Mini App no GitHub Pages usa a branch `gh-pages`, gerada a partir do build estatico em `dist`.

A URL publica fica no formato:

```text
https://mvmozzer.github.io/MiniAppTelegramMercadinho/
```

Essa URL pode ser colocada no bot como Web App URL. O checkout usa `Telegram.WebApp.sendData` para enviar o pedido ao bot e manter Pix/comprovante dentro do Telegram.

Para operacao real, hospede tambem o backend Express em HTTPS, configure os tokens dos bots, configure o Pix estatico e aponte os webhooks para `/api/telegram/webhook` e `/api/telegram/delivery-webhook`.

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
