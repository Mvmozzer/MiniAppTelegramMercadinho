import type { CheckoutPayload } from "../types";
import type { PixCheckoutResponse } from "../types";
import type { Product } from "../types";

export async function createPixCheckout(payload: CheckoutPayload): Promise<PixCheckoutResponse> {
  const response = await fetch("/api/miniapp/checkout/pix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel criar o pedido Pix.");
  }

  return response.json() as Promise<PixCheckoutResponse>;
}

export async function fetchPublicCatalog(): Promise<Product[]> {
  const response = await fetch("/api/miniapp/catalog");

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o catalogo do painel.");
  }

  const payload = await response.json() as { products?: Product[]; catalogo?: Product[] };
  const products = payload.products || payload.catalogo || [];

  if (!Array.isArray(products)) {
    throw new Error("Catalogo invalido.");
  }

  return products;
}
