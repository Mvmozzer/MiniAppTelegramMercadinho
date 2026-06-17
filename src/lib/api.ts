import type { CheckoutPayload } from "../types";
import type { Product } from "../types";

export interface InvoiceResponse {
  invoiceUrl: string;
  orderId: string;
  mocked?: boolean;
}

export async function createInvoice(payload: CheckoutPayload): Promise<InvoiceResponse> {
  const response = await fetch("/api/telegram/create-invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel criar o pagamento no Telegram.");
  }

  return response.json() as Promise<InvoiceResponse>;
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
