const SERVER_CATALOG = new Map([
  ["banana-prata", { name: "Banana prata", priceCents: 499 }],
  ["tomate-italiano", { name: "Tomate italiano", priceCents: 799 }],
  ["pao-frances", { name: "Pao frances", priceCents: 90 }],
  ["bolo-cenoura", { name: "Bolo de cenoura", priceCents: 690 }],
  ["leite-integral", { name: "Leite integral", priceCents: 599 }],
  ["suco-laranja", { name: "Suco de laranja", priceCents: 1190 }],
  ["arroz-tipo-1", { name: "Arroz tipo 1", priceCents: 2290 }],
  ["feijao-carioca", { name: "Feijao carioca", priceCents: 899 }],
  ["detergente-neutro", { name: "Detergente neutro", priceCents: 299 }],
  ["sabao-po", { name: "Sabao em po", priceCents: 1290 }],
]);

export function normalizeCheckoutPayload(checkoutPayload = {}) {
  const rawLines = Array.isArray(checkoutPayload.lines)
    ? checkoutPayload.lines
    : Array.isArray(checkoutPayload.items)
      ? checkoutPayload.items
      : [];
  const lines = rawLines.map((line) => {
    const productId = String(line.productId || line.id || line.product?.id || "").trim();
    const quantity = Number(line.quantity || line.qty || 1);
    const unitPriceCents = Number(line.unitPriceCents ?? line.priceCents ?? line.product?.priceCents ?? 0);

    return {
      productId,
      name: String(line.name || line.product?.name || productId),
      quantity,
      unitPriceCents,
      totalCents: Number(line.totalCents ?? unitPriceCents * quantity),
    };
  });
  const subtotalCents = lines.reduce((sum, line) => sum + Number(line.totalCents || 0), 0);
  const deliveryFeeCents = Number(checkoutPayload.deliveryFeeCents ?? checkoutPayload.delivery?.feeCents ?? 0);

  return {
    ...checkoutPayload,
    orderId: String(checkoutPayload.orderId || checkoutPayload.id || checkoutPayload.payload || createServerOrderId()).trim(),
    currency: checkoutPayload.currency || "BRL",
    lines,
    subtotalCents: Number(checkoutPayload.subtotalCents ?? subtotalCents),
    deliveryFeeCents,
    totalCents: Number(checkoutPayload.totalCents ?? subtotalCents + deliveryFeeCents),
    itemCount: Number(checkoutPayload.itemCount ?? lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)),
  };
}

export function buildTelegramInvoiceRequest(checkoutPayload, productLookup = lookupDefaultProduct) {
  const normalizedPayload = normalizeCheckoutPayload(checkoutPayload);

  const itemPrices = normalizedPayload.lines.map((line) => {
    const product = productLookup(line.productId);
    if (!product) {
      throw new Error(`Produto desconhecido: ${line.productId}`);
    }

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Quantidade invalida para ${line.productId}`);
    }

    return {
      label: `${product.name} x${quantity}`,
      amount: product.priceCents * quantity,
    };
  });

  const prices = itemPrices;
  const total = prices.reduce((sum, price) => sum + price.amount, 0);

  if (total <= 0) {
    throw new Error("Pedido vazio");
  }

  return {
    title: `Pedido ${normalizedPayload.orderId}`,
    description: `Mercadinho - ${normalizedPayload.itemCount} itens`,
    payload: normalizedPayload.orderId,
    currency: "BRL",
    prices,
    need_name: true,
    need_phone_number: true,
    need_shipping_address: true,
    is_flexible: true,
  };
}

export function buildShippingOptions() {
  return [
    {
      id: "delivery-local",
      title: "Entrega local",
      prices: [{ label: "Entrega", amount: 500 }],
    },
    {
      id: "pickup-counter",
      title: "Retirar no mercadinho",
      prices: [{ label: "Retirada", amount: 0 }],
    },
  ];
}

function lookupDefaultProduct(productId) {
  return SERVER_CATALOG.get(productId);
}

function createServerOrderId() {
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MJ-${new Date().getFullYear()}-${randomPart}`;
}
