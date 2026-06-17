import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  acceptDeliveryInState,
  assignDeliveryInState,
  createPixOrderFromCheckout,
  createPriceUpdateRequestInState,
  findPendingProofOrderForChat,
  recordPaymentProofInState,
  reviewPaymentProofInState,
  reviewPriceUpdateRequestInState,
  updateDeliveryStatusInState,
  upsertCourierInState,
  upsertSupplierInState,
} from "./operations.js";
import {
  catalogProductsFromState,
  createPanelStats,
  deleteGroupInState,
  deleteProductInState,
  deleteSectionInState,
  listGroupsFromState,
  listPanelProducts,
  listSections,
  panelBootstrap,
  readPanelState,
  updatePanelState,
  upsertGroupInState,
  upsertProductInState,
  upsertSectionInState,
  writePanelState,
} from "./panelStore.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const deliveryBotToken = process.env.TELEGRAM_DELIVERY_BOT_TOKEN || "";

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/admin/bootstrap", (_request, response) => {
  response.json(panelBootstrap(readPanelState()));
});

app.get(["/api/admin/catalog", "/api/miniapp/catalog", "/api/miniapp/catalogo"], (_request, response) => {
  response.json({ ok: true, products: catalogProductsFromState(readPanelState()) });
});

app.get("/api/categories", (_request, response) => {
  const sections = listSections(readPanelState()).filter((section) => section.ativo !== false);
  response.json({
    ok: true,
    categories: sections.map((section) => ({
      id: section.id,
      name: section.nome,
      emoji: section.emoji,
    })),
  });
});

app.get("/api/products", (_request, response) => {
  response.json({ ok: true, products: catalogProductsFromState(readPanelState()) });
});

app.get("/config", (_request, response) => {
  response.json(readPanelState().config);
});

app.post("/config", (request, response) => {
  const nextState = updatePanelState((state) => {
    state.config = {
      ...state.config,
      ...(request.body || {}),
      loja: { ...state.config.loja, ...(request.body?.loja || {}) },
      checkout: { ...state.config.checkout, ...(request.body?.checkout || {}) },
      telegramLoja: { ...state.config.telegramLoja, ...(request.body?.telegramLoja || {}) },
      miniappUi: { ...state.config.miniappUi, ...(request.body?.miniappUi || {}) },
      pix: { ...state.config.pix, ...(request.body?.pix || {}) },
      secoes: Array.isArray(request.body?.secoes) ? request.body.secoes : state.config.secoes,
    };
    return state;
  });
  response.json({ ok: true, config: nextState.config });
});

app.get(["/secoes", "/api/admin/sections"], (_request, response) => {
  response.json(listSections(readPanelState()));
});

app.post(["/secoes", "/api/admin/sections"], (request, response) => {
  try {
    const state = updatePanelState((current) => upsertSectionInState(current, request.body || {}));
    response.json({ ok: true, secoes: listSections(state), bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/secoes/editar", (request, response) => {
  try {
    const state = updatePanelState((current) => upsertSectionInState(current, request.body || {}));
    response.json({ ok: true, secoes: listSections(state), bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.delete("/api/admin/sections/:id", (request, response) => {
  const result = deleteSectionInState(readPanelState(), request.params.id);
  if (!result.ok) {
    response.status(400).json({ ok: false, erro: result.erro });
    return;
  }
  const state = writePanelState(result.state);
  response.json({ ok: true, bootstrap: panelBootstrap(state) });
});

app.post("/secoes/excluir", (request, response) => {
  const sectionId = String(request.body?.id || request.body?.secao || "").trim();
  const result = deleteSectionInState(readPanelState(), sectionId);
  if (!result.ok) {
    response.status(400).json({ ok: false, erro: result.erro });
    return;
  }
  const state = writePanelState(result.state);
  response.json({ ok: true, bootstrap: panelBootstrap(state) });
});

app.get(["/api/admin/groups", "/api/grupos-produtos"], (_request, response) => {
  response.json({ ok: true, grupos: listGroupsFromState(readPanelState()) });
});

app.post(["/api/admin/groups", "/api/grupos-produtos"], (request, response) => {
  try {
    const state = updatePanelState((current) => upsertGroupInState(current, request.body || {}));
    response.json({ ok: true, grupos: listGroupsFromState(state), bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.put("/api/admin/groups/:id", (request, response) => {
  try {
    const state = updatePanelState((current) =>
      upsertGroupInState(current, { ...(request.body || {}), id: request.params.id }),
    );
    response.json({ ok: true, grupos: listGroupsFromState(state), bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.delete("/api/admin/groups/:id", (request, response) => {
  const result = deleteGroupInState(readPanelState(), request.params.id, String(request.query.secao || ""));
  if (!result.ok) {
    response.status(400).json({ ok: false, erro: result.erro });
    return;
  }
  const state = writePanelState(result.state);
  response.json({ ok: true, bootstrap: panelBootstrap(state) });
});

app.get(["/produtos", "/api/admin/products", "/api/produtos"], (request, response) => {
  const state = readPanelState();
  if (request.path === "/produtos") {
    response.json(state.produtos);
    return;
  }
  response.json({ ok: true, produtos: listPanelProducts(state), products: listPanelProducts(state) });
});

app.post(["/produtos", "/api/admin/products", "/api/produtos"], (request, response) => {
  try {
    const state = updatePanelState((current) => upsertProductInState(current, request.body || {}));
    response.json({ ok: true, produtos: listPanelProducts(state), product: listPanelProducts(state).at(-1), bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.put("/api/admin/products/:id", (request, response) => {
  try {
    const state = updatePanelState((current) => upsertProductInState(current, { ...(request.body || {}), id: request.params.id }));
    response.json({ ok: true, produtos: listPanelProducts(state), bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/produtos/editar", (request, response) => {
  try {
    const body = { ...(request.body || {}) };
    if (!body.id && body.secao !== undefined && body.index !== undefined) {
      const product = readPanelState().produtos?.[body.secao]?.[Number(body.index)];
      body.id = product?.id || product?.sku;
      body.secao_id = body.secao;
    }
    const state = updatePanelState((current) => upsertProductInState(current, body));
    response.json({ ok: true, produtos: listPanelProducts(state), bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.delete("/api/admin/products/:id", (request, response) => {
  const result = deleteProductInState(readPanelState(), request.params.id);
  if (!result.ok) {
    response.status(404).json({ ok: false, erro: result.erro });
    return;
  }
  const state = writePanelState(result.state);
  response.json({ ok: true, bootstrap: panelBootstrap(state) });
});

app.post("/produtos/excluir", (request, response) => {
  const state = readPanelState();
  let productId = String(request.body?.id || request.body?.produto_id || "").trim();
  if (!productId && request.body?.secao !== undefined && request.body?.index !== undefined) {
    const product = state.produtos?.[request.body.secao]?.[Number(request.body.index)];
    productId = String(product?.id || product?.sku || "").trim();
  }
  const result = deleteProductInState(state, productId);
  if (!result.ok) {
    response.status(404).json({ ok: false, erro: result.erro });
    return;
  }
  const nextState = writePanelState(result.state);
  response.json({ ok: true, bootstrap: panelBootstrap(nextState) });
});

app.get(["/pedidos", "/api/admin/orders"], (_request, response) => {
  response.json(readPanelState().pedidos || []);
});

app.get("/pedidos/arquivados", (_request, response) => {
  response.json(readPanelState().arquivados || []);
});

app.post(["/pedidos/editar", "/api/admin/orders/:id"], (request, response) => {
  const orderId = String(request.params.id || request.body?.id || "").trim();
  const state = updatePanelState((current) => {
    const order = current.pedidos.find((item) => String(item.id) === orderId);
    if (!order) return current;
    Object.assign(order, request.body || {}, { updatedAt: new Date().toISOString() });
    return current;
  });
  response.json({ ok: true, pedidos: state.pedidos, bootstrap: panelBootstrap(state) });
});

app.post("/pedidos/cancelar", (request, response) => {
  const orderId = String(request.body?.id || "").trim();
  const state = updatePanelState((current) => {
    const order = current.pedidos.find((item) => String(item.id) === orderId);
    if (order) order.status = "cancelado";
    return current;
  });
  response.json({ ok: true, pedidos: state.pedidos, bootstrap: panelBootstrap(state) });
});

app.post("/pedidos/excluir", (request, response) => {
  const orderId = String(request.body?.id || "").trim();
  const state = updatePanelState((current) => {
    current.pedidos = current.pedidos.filter((item) => String(item.id) !== orderId);
    current.arquivados = current.arquivados.filter((item) => String(item.id) !== orderId);
    return current;
  });
  response.json({ ok: true, bootstrap: panelBootstrap(state) });
});

app.post("/arquivar", (request, response) => {
  const orderId = String(request.body?.id || "").trim();
  const state = updatePanelState((current) => {
    const index = current.pedidos.findIndex((item) => String(item.id) === orderId);
    if (index >= 0) {
      const [order] = current.pedidos.splice(index, 1);
      current.arquivados.unshift({ ...order, arquivado: true, arquivadoEm: new Date().toISOString() });
    }
    return current;
  });
  response.json({ ok: true, bootstrap: panelBootstrap(state) });
});

app.post("/arquivados/restaurar", (request, response) => {
  const orderId = String(request.body?.id || "").trim();
  const state = updatePanelState((current) => {
    const index = current.arquivados.findIndex((item) => String(item.id) === orderId);
    if (index >= 0) {
      const [order] = current.arquivados.splice(index, 1);
      current.pedidos.unshift({ ...order, arquivado: false, restauradoEm: new Date().toISOString() });
    }
    return current;
  });
  response.json({ ok: true, bootstrap: panelBootstrap(state) });
});

app.get(["/clientes", "/api/admin/customers"], (_request, response) => {
  response.json(readPanelState().clientes || []);
});

app.post("/clientes/editar", (request, response) => {
  const state = updatePanelState((current) => {
    const id = String(request.body?.id || request.body?.chatId || Date.now()).trim();
    const index = current.clientes.findIndex((cliente) => String(cliente.id || cliente.chatId) === id);
    const cliente = { ...(index >= 0 ? current.clientes[index] : {}), ...(request.body || {}), id, atualizadoEm: new Date().toISOString() };
    if (index >= 0) current.clientes[index] = cliente;
    else current.clientes.unshift({ ...cliente, criadoEm: new Date().toISOString() });
    return current;
  });
  response.json({ ok: true, clientes: state.clientes, bootstrap: panelBootstrap(state) });
});

app.post("/clientes/excluir", (request, response) => {
  const id = String(request.body?.id || request.body?.chatId || "").trim();
  const state = updatePanelState((current) => {
    current.clientes = current.clientes.filter((cliente) => String(cliente.id || cliente.chatId) !== id);
    return current;
  });
  response.json({ ok: true, clientes: state.clientes, bootstrap: panelBootstrap(state) });
});

app.get("/stats", (_request, response) => {
  response.json(createPanelStats(readPanelState()));
});

app.get("/dashboard/controle", (_request, response) => {
  const state = readPanelState();
  response.json({ ok: true, stats: createPanelStats(state), alertas: [], tarefas: [] });
});

app.get("/estoque/entradas", (_request, response) => {
  response.json({ ok: true, entradas: readPanelState().entradasEstoque || [] });
});

app.get("/estoque/movimentacoes", (_request, response) => {
  response.json({ ok: true, movimentacoes: readPanelState().movimentacoesEstoque || [] });
});

app.get("/carrinhos", (_request, response) => {
  response.json({ ok: true, carrinhos: readPanelState().carrinhos || {} });
});

app.post("/api/miniapp/checkout/pix", (request, response) => {
  try {
    let operation;
    const state = updatePanelState((current) => {
      operation = createPixOrderFromCheckout(current, request.body || {}, {
        chatId: request.body?.chatId,
        cliente: request.body?.cliente || request.body?.customer,
      });
      return operation.state;
    });
    const order = state.pedidos.find((item) => String(item.id) === String(operation.order.id));
    response.json({
      ok: true,
      order,
      pix: operation.pix,
      pixMessage: operation.pixMessage,
      bootstrap: panelBootstrap(state),
    });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post(["/api/miniapp/pedidos/:pedidoId/comprovante", "/api/orders/:id/comprovante"], (request, response) => {
  try {
    const orderId = request.params.pedidoId || request.params.id;
    let operation;
    const state = updatePanelState((current) => {
      operation = recordPaymentProofInState(current, orderId, {
        ...(request.body || {}),
        origem: request.body?.origem || "miniapp",
      });
      return operation.state;
    });
    const order = state.pedidos.find((item) => String(item.id) === String(operation.order.id));
    response.json({ ok: true, order, comprovante: operation.proof, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/api/admin/orders/:id/payment-proof/review", (request, response) => {
  try {
    let operation;
    const state = updatePanelState((current) => {
      operation = reviewPaymentProofInState(current, request.params.id, request.body || {});
      return operation.state;
    });
    const order = state.pedidos.find((item) => String(item.id) === String(operation.order.id));
    response.json({ ok: true, order, review: operation.review, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.get("/api/admin/couriers", (_request, response) => {
  response.json({ ok: true, couriers: readPanelState().entregadores || [], entregadores: readPanelState().entregadores || [] });
});

app.post("/api/admin/couriers", (request, response) => {
  try {
    let operation;
    const state = updatePanelState((current) => {
      operation = upsertCourierInState(current, request.body || {});
      return operation.state;
    });
    response.json({ ok: true, courier: operation.courier, couriers: state.entregadores, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/api/admin/orders/:id/delivery", (request, response) => {
  try {
    let operation;
    const state = updatePanelState((current) => {
      operation = assignDeliveryInState(current, request.params.id, request.body || {});
      return operation.state;
    });
    response.json({ ok: true, delivery: operation.delivery, order: operation.order, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/api/delivery/accept", (request, response) => {
  try {
    const deliveryId = request.body?.deliveryId || request.body?.id || request.body?.codigo;
    let operation;
    const state = updatePanelState((current) => {
      operation = acceptDeliveryInState(current, deliveryId, request.body || {});
      return operation.state;
    });
    response.json({ ok: true, delivery: operation.delivery, order: operation.order, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/api/delivery/status", (request, response) => {
  try {
    const deliveryId = request.body?.deliveryId || request.body?.id || request.body?.codigo;
    let operation;
    const state = updatePanelState((current) => {
      operation = updateDeliveryStatusInState(current, deliveryId, request.body?.status, request.body || {});
      return operation.state;
    });
    response.json({ ok: true, delivery: operation.delivery, order: operation.order, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/api/telegram/delivery-webhook", async (request, response) => {
  try {
    const result = await handleDeliveryTelegramUpdate(request.body || {});
    response.json({ ok: true, ...(result || {}) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.get(["/api/admin/suppliers", "/admin/suppliers"], (_request, response) => {
  const suppliers = readPanelState().fornecedores || [];
  response.json({ ok: true, suppliers, fornecedores: suppliers });
});

app.post(["/api/admin/suppliers", "/admin/suppliers"], (request, response) => {
  try {
    let operation;
    const state = updatePanelState((current) => {
      operation = upsertSupplierInState(current, request.body || {});
      return operation.state;
    });
    response.json({ ok: true, supplier: operation.supplier, suppliers: state.fornecedores, fornecedores: state.fornecedores, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.get(["/api/admin/price-update-requests", "/admin/price-update-requests"], (_request, response) => {
  const requests = readPanelState().solicitacoesPrecos || [];
  response.json({ ok: true, requests, solicitacoes: requests });
});

app.post(["/api/admin/price-update-requests", "/admin/price-update-requests"], (request, response) => {
  try {
    let operation;
    const state = updatePanelState((current) => {
      operation = createPriceUpdateRequestInState(current, request.body || {});
      return operation.state;
    });
    response.json({ ok: true, request: operation.request, requests: state.solicitacoesPrecos, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post([
  "/api/admin/price-update-requests/:id/review",
  "/admin/price-update-requests/:id/review",
  "/api/admin/price-update-requests/:id/approve",
  "/api/admin/price-update-requests/:id/reject",
], (request, response) => {
  try {
    let decision = request.body?.decision;
    if (!decision && request.path.endsWith("/approve")) decision = "approve";
    if (!decision && request.path.endsWith("/reject")) decision = "reject";
    let operation;
    const state = updatePanelState((current) => {
      operation = reviewPriceUpdateRequestInState(current, request.params.id, { ...(request.body || {}), decision });
      return operation.state;
    });
    response.json({ ok: true, request: operation.request, requests: state.solicitacoesPrecos, bootstrap: panelBootstrap(state) });
  } catch (error) {
    response.status(400).json({ ok: false, erro: error.message });
  }
});

app.post("/api/telegram/webhook", async (request, response) => {
  const update = request.body;

  if (update?.message?.web_app_data?.data) {
    await handleTelegramWebAppData(update.message);
  }

  if (update?.message?.photo || update?.message?.document) {
    await handleTelegramPaymentProof(update.message);
  }

  response.json({ ok: true });
});

app.get("/api/orders/:orderId", (request, response) => {
  const panelOrder = readPanelState().pedidos.find((order) => String(order.id) === String(request.params.orderId));
  if (panelOrder) {
    response.json(panelOrder);
    return;
  }

  response.status(404).json({ error: "Pedido nao encontrado" });
});

export { app };

export const server = process.env.NODE_ENV === "test"
  ? undefined
  : app.listen(port, () => {
      console.log(`Mercadinho API running on http://127.0.0.1:${port}`);
    });
server?.ref();

async function callTelegramApi(method, body, token = botToken) {
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN nao configurado");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || `Telegram API falhou em ${method}`);
  }

  return data;
}

async function handleDeliveryTelegramUpdate(update = {}) {
  const message = update.message || update.edited_message || {};
  const chatId = String(message.chat?.id || message.from?.id || "").trim();
  const text = String(message.text || "").trim();
  if (!chatId || !text) return { handled: false };

  if (text.startsWith("/entregas")) {
    const deliveries = (readPanelState().entregas || []).filter((delivery) =>
      String(delivery.courierChatId || "") === chatId &&
      !["entregue", "cancelada"].includes(String(delivery.status || "")),
    );
    const lines = deliveries.length
      ? deliveries.map((delivery) => `${delivery.codigo} - pedido ${delivery.orderId} - ${delivery.status}`)
      : ["Nenhuma entrega ativa para voce agora."];
    await sendTelegramMessage(chatId, lines.join("\n"), {}, deliveryBotToken);
    return { handled: true, deliveries };
  }

  const acceptMatch = /^\/aceitar\s+(\S+)/i.exec(text);
  if (acceptMatch) {
    let operation;
    const state = updatePanelState((current) => {
      operation = acceptDeliveryInState(current, acceptMatch[1], { courierChatId: chatId });
      return operation.state;
    });
    await sendTelegramMessage(chatId, `Entrega ${operation.delivery.codigo} aceita.`, {}, deliveryBotToken);
    return {
      handled: true,
      delivery: operation.delivery,
      order: state.pedidos.find((order) => String(order.id) === String(operation.order.id)),
      bootstrap: panelBootstrap(state),
    };
  }

  const statusMatch = /^\/status\s+(\S+)\s+(\S+)/i.exec(text);
  if (statusMatch) {
    let operation;
    const state = updatePanelState((current) => {
      operation = updateDeliveryStatusInState(current, statusMatch[1], statusMatch[2], { courierChatId: chatId });
      return operation.state;
    });
    await sendTelegramMessage(chatId, `Entrega ${operation.delivery.codigo}: ${operation.delivery.status}.`, {}, deliveryBotToken);
    return {
      handled: true,
      delivery: operation.delivery,
      order: state.pedidos.find((order) => String(order.id) === String(operation.order.id)),
      bootstrap: panelBootstrap(state),
    };
  }

  await sendTelegramMessage(chatId, "Use /entregas, /aceitar CODIGO ou /status CODIGO entregue.", {}, deliveryBotToken);
  return { handled: false };
}

async function handleTelegramWebAppData(message = {}) {
  const chatId = String(message.chat?.id || "").trim();
  let data;
  try {
    data = JSON.parse(String(message.web_app_data?.data || "{}"));
  } catch {
    return;
  }

  const payload = data.payload || data.order || data;
  const type = String(data.type || data.action || "").toLowerCase();
  if (!type.includes("mercadinho") && !payload?.lines && !payload?.items) return;

  let operation;
  updatePanelState((current) => {
    operation = createPixOrderFromCheckout(current, payload, {
      chatId,
      cliente: {
        nome: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" "),
        chatId,
      },
    });
    return operation.state;
  });

  await sendTelegramMessage(chatId, operation.pixMessage, {
    reply_markup: {
      inline_keyboard: [[{ text: "Enviar comprovante", callback_data: `pay:paid:${operation.order.id}` }]],
    },
  });
}

async function handleTelegramPaymentProof(message = {}) {
  const chatId = String(message.chat?.id || "").trim();
  const pendingOrder = findPendingProofOrderForChat(readPanelState(), chatId);
  if (!pendingOrder) return;

  const largestPhoto = Array.isArray(message.photo) ? [...message.photo].sort((a, b) => Number(b.file_size || 0) - Number(a.file_size || 0))[0] : undefined;
  const document = message.document;
  const proof = {
    origem: "telegram",
    tipo: largestPhoto ? "foto" : "documento",
    fileId: largestPhoto?.file_id || document?.file_id || "",
    fileName: document?.file_name || "",
    mimeType: document?.mime_type || "",
    texto: message.caption || "",
    chatId,
  };

  let operation;
  updatePanelState((current) => {
    operation = recordPaymentProofInState(current, pendingOrder.id, proof);
    return operation.state;
  });

  await sendTelegramMessage(chatId, `Comprovante recebido para o pedido ${operation.order.id}. A loja vai conferir e atualizar o status.`);
}

async function sendTelegramMessage(chatId, text, extra = {}, token = botToken) {
  if (!token || !chatId || !text) return undefined;
  try {
    return await callTelegramApi("sendMessage", {
      chat_id: chatId,
      text,
      ...extra,
    }, token);
  } catch {
    return undefined;
  }
}
