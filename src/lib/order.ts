import type { Cart, CheckoutPayload } from "../types";
import { getCartLines, selectCartSummary } from "./cart";

export const DELIVERY_FEE_CENTS = 500;

export function createCheckoutPayload(cart: Cart): CheckoutPayload {
  const summary = selectCartSummary(cart, { deliveryFeeCents: 0 });
  const lines = getCartLines(cart).map((line) => ({
    productId: line.product.id,
    name: line.product.name,
    quantity: line.quantity,
    unitPriceCents: line.product.priceCents,
    totalCents: line.product.priceCents * line.quantity,
  }));

  return {
    orderId: createOrderId(),
    currency: "BRL",
    lines,
    subtotalCents: summary.subtotalCents,
    deliveryFeeCents: summary.deliveryFeeCents,
    totalCents: summary.totalCents,
    itemCount: summary.itemCount,
  };
}

function createOrderId(): string {
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MJ-${new Date().getFullYear()}-${randomPart}`;
}
