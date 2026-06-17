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

function createServerOrderId() {
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MJ-${new Date().getFullYear()}-${randomPart}`;
}
