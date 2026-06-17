import { describe, expect, it } from "vitest";
import { catalog } from "../data/catalog";
import { addItemToCart, createEmptyCart } from "./cart";
import { createCheckoutPayload } from "./order";

describe("checkout payload", () => {
  it("builds a checkout payload with only menu items and totals", () => {
    let cart = createEmptyCart();
    const banana = catalog.find((product) => product.id === "banana-prata")!;
    const arroz = catalog.find((product) => product.id === "arroz-tipo-1")!;

    cart = addItemToCart(cart, banana);
    cart = addItemToCart(cart, arroz);

    const payload = createCheckoutPayload(cart);

    expect(payload).toMatchObject({
      currency: "BRL",
      itemCount: 2,
      deliveryFeeCents: 0,
      lines: [
        { productId: "banana-prata", quantity: 1, unitPriceCents: 499 },
        { productId: "arroz-tipo-1", quantity: 1, unitPriceCents: 2290 },
      ],
      subtotalCents: 2789,
      totalCents: 2789,
    });
    expect(payload).not.toHaveProperty("fulfillment");
    expect(payload).not.toHaveProperty("address");
    expect(payload).not.toHaveProperty("note");
  });
});
