import type { Cart, CartLine, CartSummary, Product } from "../types";

export function createEmptyCart(): Cart {
  return { items: {} };
}

export function addItemToCart(cart: Cart, product: Product): Cart {
  const current = cart.items[product.id];
  return setLine(cart, product.id, {
    product,
    quantity: (current?.quantity ?? 0) + 1,
  });
}

export function incrementItem(cart: Cart, productId: string): Cart {
  const current = cart.items[productId];
  if (!current) {
    return cart;
  }

  return setLine(cart, productId, {
    ...current,
    quantity: current.quantity + 1,
  });
}

export function decrementItem(cart: Cart, productId: string): Cart {
  const current = cart.items[productId];
  if (!current) {
    return cart;
  }

  if (current.quantity <= 1) {
    const nextItems = { ...cart.items };
    delete nextItems[productId];
    return { items: nextItems };
  }

  return setLine(cart, productId, {
    ...current,
    quantity: current.quantity - 1,
  });
}

export function removeItem(cart: Cart, productId: string): Cart {
  const nextItems = { ...cart.items };
  delete nextItems[productId];
  return { items: nextItems };
}

export function getCartLines(cart: Cart): CartLine[] {
  return Object.values(cart.items);
}

export function selectCartSummary(
  cart: Cart,
  options: { deliveryFeeCents: number },
): CartSummary {
  const lines = getCartLines(cart);
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0,
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const deliveryFeeCents = itemCount > 0 ? options.deliveryFeeCents : 0;

  return {
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents,
    itemCount,
  };
}

function setLine(cart: Cart, productId: string, line: CartLine): Cart {
  return {
    items: {
      ...cart.items,
      [productId]: line,
    },
  };
}
