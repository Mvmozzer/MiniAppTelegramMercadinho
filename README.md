# Mercadinho Telegram Mini App

Mini App de mercadinho para Telegram com cardapio e controle de quantidade direto nos produtos. O painel de controle e o backend oficial sao os mesmos do `E:\bot-mercearia`.

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

O comando inicia o Mini App deste projeto e o backend/painel oficial do `E:\bot-mercearia` em `http://127.0.0.1:8787`.

## Painel de controle oficial

Este projeto nao mantem um painel paralelo. A rota abaixo encaminha para o painel real do `bot-mercearia`:

```text
http://127.0.0.1:5173/painel
```

O endereco direto do painel oficial local e:

```text
http://127.0.0.1:8787/admin
```

Todas as funcoes administrativas, dados de cliente, produtos, pedidos, estoque, Pix, entregadores e fornecedores continuam no banco/JSON do `E:\bot-mercearia`.

O cardapio do cliente carrega `GET /api/miniapp/catalogo` do backend oficial. O checkout chama `POST /api/miniapp/checkout/create`, que cria pedido real, gera Pix estatico e atualiza o painel oficial.

## Pagamento Pix no Telegram

1. Configure tokens, Pix e usuarios no `.env` do `E:\bot-mercearia`.
2. Rode `node index.js` ou `npm run dev:full` neste projeto.
3. Use `http://127.0.0.1:5173` para o Mini App novo.
4. Use `http://127.0.0.1:5173/painel` ou `http://127.0.0.1:8787/admin` para o painel oficial.

O fluxo real e:

1. Cliente escolhe produtos no cardapio usando `- quantidade +`.
2. Cliente abre o checkout para revisar o pedido.
3. Cliente clica em `Gerar Pix no Telegram`.
4. Frontend chama `POST /api/miniapp/checkout/create` no backend do `bot-mercearia`.
5. Backend oficial valida itens pelo catalogo do painel, grava pedido real e gera Pix.
6. Pedido aparece no painel oficial do `bot-mercearia`.
7. Cliente paga fora do Telegram e envia comprovante pelo fluxo oficial do bot/painel.
8. Painel oficial aprova ou recusa o comprovante e avanca o status.

## Publicacao no GitHub Pages

A publicacao do Mini App no GitHub Pages usa a branch `gh-pages`, gerada a partir do build estatico em `dist`.

A URL publica fica no formato:

```text
https://mvmozzer.github.io/MiniAppTelegramMercadinho/
```

Essa URL pode ser colocada no bot como Web App URL. Em producao, configure a API publica para apontar para o backend oficial hospedado do `bot-mercearia`.

Para operacao real, hospede tambem o backend Express do `bot-mercearia` em HTTPS, configure tokens dos bots e configure o Pix estatico no painel oficial.

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
