export type Category = string;

export interface Product {
  id: string;
  name: string;
  category: Category;
  categoryId?: string;
  unit: string;
  priceCents: number;
  image: string;
  description?: string;
  stock?: number;
  active?: boolean;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: Record<string, CartLine>;
}

export interface CartSummary {
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  itemCount: number;
}

export interface CheckoutLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface CheckoutPayload {
  orderId: string;
  currency: "BRL";
  lines: CheckoutLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  itemCount: number;
}

export interface PixCheckoutResponse {
  ok: boolean;
  order: {
    id: string;
    status: string;
    totalCents: number;
  };
  pix: {
    copiaCola: string;
    recebedor?: string;
    chave?: string;
    valorCents?: number;
  };
  pixMessage?: string;
}
