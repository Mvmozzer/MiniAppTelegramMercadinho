# Mercadinho Telegram Mini App - Option A Spec

Data: 2026-06-16

## Objetivo

Criar um Mini App de mercadinho para Telegram em que o cliente consiga navegar pelo catalogo, adicionar produtos ao carrinho, escolher entrega ou retirada, revisar o pedido e iniciar o pagamento por invoice do Telegram.

## Direcao Visual Aprovada

Referencia visual: `docs/design/mercadinho-option-a-flow.png`

- Interface compacta, pratica e clara.
- Fundo branco, detalhes verdes e separadores cinza discretos.
- Catalogo em grade densa com fotos de produtos, preco em BRL e controles `- quantidade +` no proprio card.
- Sem tela de carrinho separada: o cliente ajusta quantidades direto nas secoes do cardapio.
- Checkout apenas revisa os itens escolhidos e o total do cardapio.
- Entrega, retirada e pagamento sao resolvidos na invoice do Telegram.
- Confirmacao local apenas informa que o pedido foi enviado ao Telegram.

## Fluxo do Cliente

1. Cliente abre o Mini App pelo Telegram.
2. Ve catalogo com busca e categorias.
3. Adiciona produtos pelo botao `+`.
4. Ajusta as quantidades direto nos cards do cardapio.
5. Abre o checkout para revisar os itens e o total.
6. Clica em `Finalizar no Telegram`.
7. Em producao, o backend cria um invoice link com a Bot API.
8. O Mini App abre a invoice com `Telegram.WebApp.openInvoice`.
9. O Telegram coleta endereco/opcao de entrega e pagamento.
10. O bot responde `shipping_query`, `pre_checkout_query` e registra `successful_payment`.

## Escopo Desta Primeira Versao

- Frontend React/Vite funcional com fluxo completo local.
- Dados de catalogo mockados em arquivo local.
- Estado real de quantidades no cardapio, checkout e envio ao Telegram.
- Integracao Telegram encapsulada, com fallback local para desenvolvimento fora do Telegram.
- Backend Express minimo para criar invoice link real quando `TELEGRAM_BOT_TOKEN` e `TELEGRAM_PROVIDER_TOKEN` estiverem configurados.
- Webhook minimo para `shipping_query`, `pre_checkout_query` e `successful_payment`.

## Fora Do Escopo Agora

- Banco de dados real.
- Painel administrativo.
- Autenticacao completa de cliente.
- Provedor de pagamento configurado no BotFather.
- Publicacao em dominio HTTPS.
