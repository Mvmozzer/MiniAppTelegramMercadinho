import type { CheckoutPayload, PixCheckoutResponse, Product } from "../types";

export async function createPixCheckout(payload: CheckoutPayload): Promise<PixCheckoutResponse> {
  const response = await fetch("/api/miniapp/checkout/create", {
    method: "POST",
    headers: miniAppHeaders(),
    body: JSON.stringify(toBotMerceariaCheckoutPayload(payload)),
  });
  const data = await response.json() as BotMerceariaCheckoutResponse;

  if (!response.ok || data.ok === false) {
    throw new Error("Nao foi possivel criar o pedido Pix.");
  }

  return normalizePixCheckoutResponse(data);
}

export async function fetchPublicCatalog(): Promise<Product[]> {
  const response = await fetch("/api/miniapp/catalogo");

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o catalogo do painel.");
  }

  const payload = await response.json() as BotMerceariaCatalogResponse;
  const products = payload.products || (Array.isArray(payload.catalogo) ? payload.catalogo : payload.catalogo?.produtos) || [];

  if (!Array.isArray(products)) {
    throw new Error("Catalogo invalido.");
  }

  return products.map(normalizeCatalogProduct).filter((product) => product.active !== false);
}

interface BotMerceariaCatalogResponse {
  products?: Product[];
  catalogo?: Product[] | { produtos?: BotMerceariaProduct[] };
}

interface BotMerceariaProduct {
  id?: string;
  produto_id?: string;
  name?: string;
  nome?: string;
  category?: string;
  categoryId?: string;
  secao?: string;
  secao_id?: string;
  secao_nome?: string;
  unit?: string;
  unidade?: string;
  unidadeVenda?: string;
  priceCents?: number;
  precoCents?: number;
  preco?: number;
  price?: number;
  image?: string;
  imagem?: string;
  imagem_url?: string;
  description?: string;
  descricao?: string;
  observacao?: string;
  stock?: number;
  estoque?: number;
  active?: boolean;
  ativo?: boolean;
}

interface BotMerceariaCheckoutResponse {
  ok?: boolean;
  order?: {
    id?: string;
    status?: string;
    totalCents?: number;
  };
  pedido?: {
    id?: string;
    status?: string;
    statusPagamento?: string;
    total?: number;
    totalCents?: number;
  };
  pix?: {
    copiaCola?: string;
    copia_cola?: string;
    pixCopiaECola?: string;
    recebedor?: string;
    valor?: number;
    valorCents?: number;
  };
  pixMessage?: string;
}

function toBotMerceariaCheckoutPayload(payload: CheckoutPayload) {
  return {
    client_order_id: payload.orderId,
    forma_pagamento: "pix",
    modalidade_entrega: "retirada",
    items: payload.lines.map((line) => ({
      produto_id: line.productId,
      quantidade: line.quantity,
    })),
  };
}

function normalizePixCheckoutResponse(data: BotMerceariaCheckoutResponse): PixCheckoutResponse {
  const order = data.order || data.pedido || {};
  const pix = data.pix || {};
  return {
    ok: data.ok !== false,
    order: {
      id: String(order.id || ""),
      status: String(order.status || data.pedido?.statusPagamento || ""),
      totalCents: cents(order.totalCents ?? data.pedido?.total ?? pix.valor ?? pix.valorCents ?? 0),
    },
    pix: {
      copiaCola: String(pix.copiaCola || pix.copia_cola || pix.pixCopiaECola || ""),
      recebedor: pix.recebedor,
      valorCents: cents(pix.valorCents ?? pix.valor ?? order.totalCents ?? data.pedido?.total ?? 0),
    },
    pixMessage: data.pixMessage,
  };
}

function normalizeCatalogProduct(product: Product | BotMerceariaProduct): Product {
  const raw = product as BotMerceariaProduct;
  const categoryId = String(raw.categoryId || raw.secao || raw.secao_id || "").trim();
  return {
    id: String(raw.id || raw.produto_id || "").trim(),
    name: String(raw.name || raw.nome || "").trim(),
    category: String(raw.category || raw.secao_nome || categoryId || "Produtos").trim(),
    categoryId,
    unit: String(raw.unit || raw.unidade || raw.unidadeVenda || "un").trim(),
    priceCents: cents(raw.priceCents ?? raw.precoCents ?? raw.preco ?? raw.price ?? 0),
    image: String(raw.image || raw.imagem || raw.imagem_url || "").trim(),
    description: String(raw.description || raw.descricao || raw.observacao || "").trim(),
    stock: Number(raw.stock ?? raw.estoque ?? 0),
    active: raw.active ?? raw.ativo ?? true,
  };
}

function miniAppHeaders() {
  const initData = window.Telegram?.WebApp?.initData || "";
  const token = window.localStorage?.getItem("mj_miniapp_bridge_token") || "";
  return {
    "Content-Type": "application/json",
    ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function cents(value: number | string | undefined): number {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  if (Number.isInteger(amount) && amount > 100) return amount;
  return Math.round(amount * 100);
}
