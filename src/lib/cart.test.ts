import { describe, expect, it } from "vitest";
import {
  addItemToCart,
  createEmptyCart,
  decrementItem,
  incrementItem,
  selectCartSummary,
} from "./cart";
import type { Product } from "../types";

const banana: Product = {
  id: "banana-prata",
  name: "Banana prata",
  category: "Hortifruti",
  unit: "kg",
  priceCents: 499,
  image: "banana",
};

const pao: Product = {
  id: "pao-frances",
  name: "Pao frances",
  category: "Padaria",
  unit: "un",
  priceCents: 90,
  image: "pao",
};

describe("cart domain", () => {
  it("adds products and calculates subtotal, delivery fee, total, and item count", () => {
    let cart = createEmptyCart();

    cart = addItemToCart(cart, banana);
    cart = addItemToCart(cart, banana);
    cart = addItemToCart(cart, pao);

    expect(selectCartSummary(cart, { deliveryFeeCents: 500 })).toEqual({
      subtotalCents: 1088,
      deliveryFeeCents: 500,
      totalCents: 1588,
      itemCount: 3,
    });
  });

  it("increments, decrements, and removes an item when quantity reaches zero", () => {
    let cart = createEmptyCart();

    cart = addItemToCart(cart, banana);
    cart = incrementItem(cart, banana.id);
    cart = decrementItem(cart, banana.id);
    cart = decrementItem(cart, banana.id);

    expect(cart.items).toEqual({});
    expect(selectCartSummary(cart, { deliveryFeeCents: 500 })).toEqual({
      subtotalCents: 0,
      deliveryFeeCents: 0,
      totalCents: 0,
      itemCount: 0,
    });
  });
});
