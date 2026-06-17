import "dotenv/config";
import cors from "cors";
import express from "express";
import { buildShippingOptions, buildTelegramInvoiceRequest, normalizeCheckoutPayload } from "./telegramPayments.js";
import {
  buildInvoiceCatalogLookup,
  catalogProductsFromState,
  createPanelStats,
  deleteGroupInState,
  deleteProductInState,
  deleteSectionInState,
  listGroupsFromState,
  listPanelProducts,
  listSections,
  markOrderPaidInState,
  panelBootstrap,
  readPanelState,
  recordOrderFromCheckout,
  updatePanelState,
  upsertGroupInState,
  upsertProductInState,
  upsertSectionInState,
  writePanelState,
} from "./panelStore.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const providerToken = process.env.TELEGRAM_PROVIDER_TOKEN || "";
const paidOrders = new Map();

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

app.post("/api/telegram/create-invoice", async (request, response) => {
  let invoiceRequest;
  let checkoutPayload;
  let panelState;

  try {
    panelState = readPanelState();
    checkoutPayload = normalizeCheckoutPayload(request.body);
    invoiceRequest = buildTelegramInvoiceRequest(checkoutPayload, buildInvoiceCatalogLookup(panelState));
  } catch (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  updatePanelState((state) => recordOrderFromCheckout(state, checkoutPayload, { status: "aguardando_pagamento" }));

  if (!botToken || !providerToken) {
    response.json({
      invoiceUrl: `mock-invoice://local/${invoiceRequest.payload}`,
      orderId: invoiceRequest.payload,
      mocked: true,
    });
    return;
  }

  try {
    const telegramResponse = await callTelegramApi("createInvoiceLink", {
      ...invoiceRequest,
      provider_token: providerToken,
    });

    response.json({
      invoiceUrl: telegramResponse.result,
      orderId: invoiceRequest.payload,
    });
  } catch (error) {
    response.status(502).json({ error: error.message });
  }
});

app.post("/api/telegram/webhook", async (request, response) => {
  const update = request.body;

  if (update?.pre_checkout_query) {
    await callTelegramApi("answerPreCheckoutQuery", {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true,
    });
  }

  if (update?.shipping_query) {
    await callTelegramApi("answerShippingQuery", {
      shipping_query_id: update.shipping_query.id,
      ok: true,
      shipping_options: buildShippingOptions(),
    });
  }

  const payment = update?.message?.successful_payment;
  if (payment) {
    paidOrders.set(payment.invoice_payload, {
      payload: payment.invoice_payload,
      currency: payment.currency,
      totalAmount: payment.total_amount,
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
      providerPaymentChargeId: payment.provider_payment_charge_id,
      paidAt: new Date().toISOString(),
    });
    updatePanelState((state) =>
      markOrderPaidInState(state, payment.invoice_payload, {
        currency: payment.currency,
        totalAmount: payment.total_amount,
        telegramPaymentChargeId: payment.telegram_payment_charge_id,
        providerPaymentChargeId: payment.provider_payment_charge_id,
      }),
    );
  }

  response.json({ ok: true });
});

app.get("/api/orders/:orderId", (request, response) => {
  const order = paidOrders.get(request.params.orderId);
  if (!order) {
    response.status(404).json({ error: "Pedido nao encontrado" });
    return;
  }

  response.json(order);
});

export const server = app.listen(port, () => {
  console.log(`Mercadinho API running on http://127.0.0.1:${port}`);
});
server.ref();

async function callTelegramApi(method, body) {
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN nao configurado");
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
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
