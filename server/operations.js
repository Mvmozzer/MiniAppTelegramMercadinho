import { catalogProductsFromState } from "./panelStore.js";
import { normalizeCheckoutPayload } from "./checkoutPayload.js";

export function createPixOrderFromCheckout(state, checkoutPayload, options = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);

  const normalized = normalizeCheckoutPayload(checkoutPayload);
  const catalog = new Map(catalogProductsFromState(next).map((product) => [String(product.id), product]));
  const lines = normalized.lines.map((line) => {
    const product = catalog.get(String(line.productId));
    if (!product) throw new Error(`Produto desconhecido: ${line.productId}`);

    const quantity = Number(line.quantity || 0);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Quantidade invalida para ${line.productId}`);
    }
    if (next.config?.checkout?.bloquear_compra_acima_estoque && Number(product.stock ?? 0) < quantity) {
      throw new Error(`Estoque insuficiente para ${product.name}`);
    }

    return {
      produtoId: product.id,
      nome: product.name,
      qtd: quantity,
      precoCents: Number(product.priceCents || 0),
      subtotalCents: Number(product.priceCents || 0) * quantity,
    };
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
  if (subtotalCents <= 0) throw new Error("Pedido vazio");

  const deliveryFeeCents = Number(normalized.deliveryFeeCents || 0);
  const totalCents = subtotalCents + deliveryFeeCents;
  const pix = resolvePixConfig(next.config?.pix || {});
  const now = new Date().toISOString();
  const cliente = normalizeCustomer(checkoutPayload, options);
  const orderId = String(normalized.orderId || createId("MJ")).trim();
  const payment = {
    metodo: "pix_estatico",
    status: "aguardando_comprovante",
    recebedor: pix.recebedor,
    chave: pix.chave,
    cidade: pix.cidade,
    pixCopiaECola: pix.copiaCola,
    valorCents: totalCents,
    criadoEm: now,
  };
  const order = {
    id: orderId,
    status: "aguardando_comprovante",
    status_pagamento: "aguardando_comprovante",
    origem: "telegram-miniapp",
    itens: lines,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    itemCount: lines.reduce((sum, line) => sum + line.qtd, 0),
    cliente,
    pagamento: payment,
    comprovantesPagamento: [],
    comprovantes_pagamento: [],
    createdAt: now,
    updatedAt: now,
  };

  const existingIndex = next.pedidos.findIndex((item) => String(item.id) === orderId);
  if (existingIndex >= 0) {
    const existing = next.pedidos[existingIndex];
    next.pedidos[existingIndex] = {
      ...existing,
      ...order,
      cliente: { ...(existing.cliente || {}), ...cliente },
      comprovantesPagamento: existing.comprovantesPagamento || existing.comprovantes_pagamento || [],
      comprovantes_pagamento: existing.comprovantes_pagamento || existing.comprovantesPagamento || [],
      createdAt: existing.createdAt || order.createdAt,
      updatedAt: now,
    };
  } else {
    next.pedidos.unshift(order);
  }

  const savedOrder = next.pedidos.find((item) => String(item.id) === orderId);
  appendAudit(next, "pedido_pix_criado", { orderId, totalCents });

  return {
    state: next,
    order: savedOrder,
    pix: {
      recebedor: pix.recebedor,
      chave: pix.chave,
      cidade: pix.cidade,
      copiaCola: pix.copiaCola,
      valorCents: totalCents,
    },
    pixMessage: buildPixMessage(savedOrder, pix),
  };
}

export function recordPaymentProofInState(state, orderId, proof = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const order = findOrder(next, orderId);
  const now = new Date().toISOString();
  const normalizedProof = {
    id: proof.id || createId("COMP"),
    origem: String(proof.origem || proof.source || "telegram"),
    tipo: String(proof.tipo || proof.type || (proof.fileId || proof.file_id ? "arquivo" : "texto")),
    texto: String(proof.texto || proof.caption || proof.observacao || "").trim(),
    fileId: String(proof.fileId || proof.file_id || "").trim(),
    fileName: String(proof.fileName || proof.file_name || "").trim(),
    mimeType: String(proof.mimeType || proof.mime_type || "").trim(),
    chatId: String(proof.chatId || proof.chat_id || order.cliente?.chatId || "").trim(),
    recebidoEm: now,
  };
  if (!normalizedProof.texto && !normalizedProof.fileId && !normalizedProof.fileName) {
    throw new Error("Envie uma mensagem, foto ou arquivo do comprovante.");
  }

  order.comprovantesPagamento = Array.isArray(order.comprovantesPagamento)
    ? order.comprovantesPagamento
    : Array.isArray(order.comprovantes_pagamento)
      ? order.comprovantes_pagamento
      : [];
  order.comprovantesPagamento.unshift(normalizedProof);
  order.comprovantes_pagamento = order.comprovantesPagamento;
  order.status = "comprovante_recebido";
  order.status_pagamento = "comprovante_recebido";
  order.pagamento = {
    ...(order.pagamento || {}),
    status: "comprovante_recebido",
    comprovanteRecebidoEm: now,
  };
  order.updatedAt = now;
  appendAudit(next, "comprovante_recebido", { orderId: order.id, origem: normalizedProof.origem });

  return { state: next, order, proof: normalizedProof };
}

export function reviewPaymentProofInState(state, orderId, review = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const order = findOrder(next, orderId);
  const decision = String(review.decision || review.status || "").toLowerCase();
  const now = new Date().toISOString();
  const entry = {
    id: createId("REV"),
    decision,
    reviewedBy: String(review.reviewedBy || review.usuario || "painel"),
    motivo: String(review.motivo || review.reason || "").trim(),
    reviewedAt: now,
  };

  order.revisoesComprovante = Array.isArray(order.revisoesComprovante) ? order.revisoesComprovante : [];
  order.revisoesComprovante.unshift(entry);
  order.pagamento = { ...(order.pagamento || {}) };

  if (decision === "approve" || decision === "approved" || decision === "aprovar" || decision === "aprovado") {
    order.status = "preparando";
    order.status_pagamento = "confirmado";
    order.pagamento.status = "confirmado";
    order.pagamento.confirmadoEm = now;
  } else if (decision === "reject" || decision === "rejected" || decision === "recusar" || decision === "recusado") {
    order.status = "aguardando_comprovante";
    order.status_pagamento = "comprovante_recusado";
    order.pagamento.status = "comprovante_recusado";
    order.pagamento.recusadoEm = now;
  } else {
    throw new Error("Decisao de comprovante invalida.");
  }

  order.updatedAt = now;
  appendAudit(next, "comprovante_revisado", { orderId: order.id, decision });
  return { state: next, order, review: entry };
}

export function upsertCourierInState(state, payload = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const id = String(payload.id || slugify(payload.nome || payload.name || payload.chatId || "entregador")).trim();
  const courier = {
    id,
    nome: String(payload.nome || payload.name || "Entregador").trim(),
    telefone: String(payload.telefone || payload.phone || "").trim(),
    chatId: String(payload.chatId || payload.telegramChatId || "").trim(),
    ativo: toBoolean(payload.ativo ?? payload.active, true),
    disponivel: toBoolean(payload.disponivel ?? payload.available, true),
    pix: String(payload.pix || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  const index = next.entregadores.findIndex((item) => String(item.id) === id || (courier.chatId && String(item.chatId) === courier.chatId));
  if (index >= 0) next.entregadores[index] = { ...next.entregadores[index], ...courier };
  else next.entregadores.unshift({ ...courier, createdAt: courier.updatedAt });
  appendAudit(next, "entregador_salvo", { courierId: id });
  return { state: next, courier: next.entregadores.find((item) => String(item.id) === id) };
}

export function assignDeliveryInState(state, orderId, payload = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const order = findOrder(next, orderId);
  const courier = findCourier(next, payload.courierId, payload.courierChatId);
  const now = new Date().toISOString();
  const delivery = {
    id: payload.id || createId("ENT"),
    codigo: payload.codigo || createCode("ENT"),
    orderId: String(order.id),
    courierId: String(courier.id),
    courierChatId: String(courier.chatId || ""),
    courierName: String(courier.nome || ""),
    status: "oferecida",
    createdBy: String(payload.createdBy || "painel"),
    createdAt: now,
    updatedAt: now,
    historico: [{ status: "oferecida", at: now, by: payload.createdBy || "painel" }],
  };
  next.entregas.unshift(delivery);
  order.entrega = {
    id: delivery.id,
    codigo: delivery.codigo,
    courierId: delivery.courierId,
    courierName: delivery.courierName,
    status: delivery.status,
  };
  order.status_entrega = "oferecida";
  if (["preparando", "pronto"].includes(String(order.status))) {
    order.status = "aguardando_entrega";
  }
  order.updatedAt = now;
  appendAudit(next, "entrega_oferecida", { orderId: order.id, deliveryId: delivery.id, courierId: courier.id });
  return { state: next, delivery, order };
}

export function acceptDeliveryInState(state, idOrCode, payload = {}) {
  return updateDeliveryInState(state, idOrCode, "aceita", payload);
}

export function updateDeliveryStatusInState(state, idOrCode, status, payload = {}) {
  return updateDeliveryInState(state, idOrCode, status, payload);
}

export function upsertSupplierInState(state, payload = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const id = String(payload.id || slugify(payload.nome || payload.name || "fornecedor")).trim();
  const supplier = {
    id,
    nome: String(payload.nome || payload.name || "Fornecedor").trim(),
    telefone: String(payload.telefone || payload.phone || "").trim(),
    chatId: String(payload.chatId || payload.telegramChatId || "").trim(),
    ativo: toBoolean(payload.ativo ?? payload.active, true),
    produtos: Array.isArray(payload.produtos) ? payload.produtos.map(String) : [],
    updatedAt: new Date().toISOString(),
  };
  const index = next.fornecedores.findIndex((item) => String(item.id) === id);
  if (index >= 0) next.fornecedores[index] = { ...next.fornecedores[index], ...supplier };
  else next.fornecedores.unshift({ ...supplier, createdAt: supplier.updatedAt });
  appendAudit(next, "fornecedor_salvo", { supplierId: id });
  return { state: next, supplier: next.fornecedores.find((item) => String(item.id) === id) };
}

export function createPriceUpdateRequestInState(state, payload = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const supplierId = String(payload.supplierId || payload.fornecedorId || "").trim();
  const productId = String(payload.productId || payload.produtoId || "").trim();
  const supplier = next.fornecedores.find((item) => String(item.id) === supplierId);
  if (!supplier) throw new Error("Fornecedor nao encontrado");
  const rawProduct = findRawProduct(next, productId);
  if (!rawProduct) throw new Error("Produto nao encontrado");

  const now = new Date().toISOString();
  const request = {
    id: payload.id || createId("PRECO"),
    supplierId,
    supplierName: supplier.nome,
    productId,
    productName: rawProduct.nome,
    precoAtualCents: priceCentsFromRawProduct(rawProduct),
    novoPrecoCents: Math.max(0, Math.round(Number(payload.novoPrecoCents ?? payload.newPriceCents ?? 0))),
    observacao: String(payload.observacao || payload.note || "").trim(),
    status: "pendente",
    createdAt: now,
    updatedAt: now,
  };
  if (request.novoPrecoCents <= 0) throw new Error("Novo preco invalido");
  next.solicitacoesPrecos.unshift(request);
  appendAudit(next, "preco_solicitado", { requestId: request.id, productId });
  return { state: next, request };
}

export function reviewPriceUpdateRequestInState(state, requestId, review = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const request = next.solicitacoesPrecos.find((item) => String(item.id) === String(requestId));
  if (!request) throw new Error("Solicitacao de preco nao encontrada");

  const decision = String(review.decision || review.status || "").toLowerCase();
  const now = new Date().toISOString();
  request.reviewedBy = String(review.reviewedBy || review.usuario || "painel");
  request.reviewedAt = now;
  request.updatedAt = now;

  if (decision === "approve" || decision === "approved" || decision === "aprovar" || decision === "aprovada") {
    request.status = "aprovada";
    const rawProduct = findRawProduct(next, request.productId);
    if (!rawProduct) throw new Error("Produto nao encontrado");
    rawProduct.preco = request.novoPrecoCents / 100;
    rawProduct.preco_normal = request.novoPrecoCents / 100;
    rawProduct.precoCents = request.novoPrecoCents;
    rawProduct.atualizado_em = now;
  } else if (decision === "reject" || decision === "rejected" || decision === "recusar" || decision === "rejeitada") {
    request.status = "rejeitada";
    request.motivo = String(review.motivo || review.reason || "").trim();
  } else {
    throw new Error("Decisao de preco invalida.");
  }

  appendAudit(next, "preco_revisado", { requestId: request.id, decision });
  return { state: next, request };
}

export function findPendingProofOrderForChat(state, chatId) {
  const normalizedChatId = String(chatId || "").trim();
  if (!normalizedChatId) return undefined;
  return (state.pedidos || []).find((order) => {
    const orderChatId = String(order.cliente?.chatId || order.chatId || "").trim();
    const paymentStatus = String(order.pagamento?.status || order.status_pagamento || order.status || "");
    return orderChatId === normalizedChatId && ["aguardando_comprovante", "comprovante_recusado"].includes(paymentStatus);
  });
}

function updateDeliveryInState(state, idOrCode, status, payload = {}) {
  const next = clone(state);
  ensureOperationalCollections(next);
  const delivery = findDelivery(next, idOrCode);
  if (payload.courierChatId && delivery.courierChatId && String(delivery.courierChatId) !== String(payload.courierChatId)) {
    throw new Error("Entrega pertence a outro entregador");
  }

  const now = new Date().toISOString();
  delivery.status = String(status || "").trim();
  delivery.updatedAt = now;
  delivery.historico = Array.isArray(delivery.historico) ? delivery.historico : [];
  delivery.historico.push({ status: delivery.status, at: now, by: payload.courierChatId || payload.updatedBy || "painel" });

  const order = findOrder(next, delivery.orderId);
  order.entrega = { ...(order.entrega || {}), status: delivery.status, id: delivery.id, codigo: delivery.codigo };
  order.status_entrega = delivery.status;
  if (delivery.status === "aceita") order.status = "em_entrega";
  if (delivery.status === "retirada") order.status = "em_entrega";
  if (delivery.status === "entregue") order.status = "entregue";
  if (delivery.status === "cancelada") order.status = "preparando";
  order.updatedAt = now;

  appendAudit(next, "entrega_atualizada", { orderId: order.id, deliveryId: delivery.id, status: delivery.status });
  return { state: next, delivery, order };
}

function resolvePixConfig(config = {}) {
  const copiaCola = String(config.copiaCola || process.env.PIX_COPIA_COLA || process.env.MERCADINHO_PIX_COPIA_COLA || "").trim();
  return {
    recebedor: String(config.recebedor || process.env.PIX_RECEBEDOR || "Mercadinho M&J").trim(),
    chave: String(config.chave || process.env.PIX_CHAVE || "").trim(),
    cidade: String(config.cidade || process.env.PIX_CIDADE || "").trim(),
    copiaCola: copiaCola || "PIX_ESTATICO_NAO_CONFIGURADO",
  };
}

function buildPixMessage(order, pix) {
  const total = (Number(order.totalCents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return [
    `Pagamento via Pix - Pedido ${order.id}`,
    `Valor: ${total}`,
    `Recebedor: ${pix.recebedor}`,
    pix.chave ? `Chave Pix: ${pix.chave}` : "",
    "Pix copia e cola:",
    pix.copiaCola,
    "",
    "Apos pagar, envie uma foto ou arquivo do comprovante aqui no Telegram.",
  ].filter(Boolean).join("\n");
}

function normalizeCustomer(checkoutPayload = {}, options = {}) {
  const source = options.cliente || checkoutPayload.cliente || checkoutPayload.customer || {};
  return {
    nome: String(source.nome || source.name || options.nome || "").trim(),
    telefone: String(source.telefone || source.phone || options.telefone || "").trim(),
    chatId: String(source.chatId || source.telegramChatId || options.chatId || checkoutPayload.chatId || "").trim(),
  };
}

function findOrder(state, orderId) {
  const order = (state.pedidos || []).find((item) => String(item.id) === String(orderId));
  if (!order) throw new Error("Pedido nao encontrado");
  return order;
}

function findCourier(state, courierId, courierChatId) {
  const courier = (state.entregadores || []).find((item) =>
    (courierId && String(item.id) === String(courierId)) ||
    (courierChatId && String(item.chatId) === String(courierChatId)),
  );
  if (!courier) throw new Error("Entregador nao encontrado");
  if (courier.ativo === false) throw new Error("Entregador inativo");
  return courier;
}

function findDelivery(state, idOrCode) {
  const delivery = (state.entregas || []).find((item) =>
    String(item.id) === String(idOrCode) || String(item.codigo) === String(idOrCode),
  );
  if (!delivery) throw new Error("Entrega nao encontrada");
  return delivery;
}

function findRawProduct(state, productId) {
  for (const items of Object.values(state.produtos || {})) {
    const product = (items || []).find((item) => !isGroupProduct(item) && String(item.id || item.sku) === String(productId));
    if (product) return product;
  }
  return undefined;
}

function priceCentsFromRawProduct(product = {}) {
  if (Number.isFinite(Number(product.precoCents))) return Math.round(Number(product.precoCents));
  return Math.round(Number(product.preco_normal ?? product.preco ?? 0) * 100);
}

function isGroupProduct(product = {}) {
  return product.produto_principal === true || product.tipo === "grupo" || product.tipo === "principal";
}

function ensureOperationalCollections(state) {
  state.config = state.config || {};
  state.config.pix = {
    recebedor: "Mercadinho M&J",
    chave: "",
    cidade: "",
    copiaCola: "",
    ...(state.config.pix || {}),
  };
  state.pedidos = Array.isArray(state.pedidos) ? state.pedidos : [];
  state.entregadores = Array.isArray(state.entregadores) ? state.entregadores : [];
  state.entregas = Array.isArray(state.entregas) ? state.entregas : [];
  state.fornecedores = Array.isArray(state.fornecedores) ? state.fornecedores : [];
  state.solicitacoesPrecos = Array.isArray(state.solicitacoesPrecos) ? state.solicitacoesPrecos : [];
  state.auditoria = Array.isArray(state.auditoria) ? state.auditoria : [];
}

function appendAudit(state, acao, details = {}) {
  state.auditoria = Array.isArray(state.auditoria) ? state.auditoria : [];
  state.auditoria.unshift({
    id: createId("AUD"),
    acao,
    details,
    createdAt: new Date().toISOString(),
  });
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function createCode(prefix) {
  return `${prefix}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function slugify(value) {
  return String(value || "item")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "0", "nao", "off"].includes(String(value).toLowerCase());
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
