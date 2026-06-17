import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let app;
let serverModule;
let dataFile;

beforeEach(async () => {
  vi.resetModules();
  dataFile = path.join(os.tmpdir(), `mercadinho-http-${Date.now()}-${Math.random()}.json`);
  process.env.MERCADINHO_DATA_FILE = dataFile;
  process.env.NODE_ENV = "test";
  process.env.TELEGRAM_BOT_TOKEN = "";
  serverModule = await import("./index.js");
  app = serverModule.app;
});

afterEach(() => {
  serverModule?.server?.close?.();
  delete process.env.MERCADINHO_DATA_FILE;
  delete process.env.NODE_ENV;
  if (dataFile && fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
});

function checkoutPayload(orderId) {
  return {
    orderId,
    currency: "BRL",
    itemCount: 1,
    subtotalCents: 1,
    deliveryFeeCents: 0,
    totalCents: 1,
    lines: [{ productId: "banana-prata", name: "Banana adulterada", quantity: 1, unitPriceCents: 1, totalCents: 1 }],
  };
}

describe("operational HTTP routes", () => {
  it("creates Pix checkout orders for the Mini App", async () => {
    const response = await request(app, "POST", "/api/miniapp/checkout/pix", checkoutPayload("MJ-HTTP-1"));

    expect(response.status).toBe(200);
    expect(response.body.order).toMatchObject({
      id: "MJ-HTTP-1",
      status: "aguardando_comprovante",
      subtotalCents: 499,
      totalCents: 499,
    });
    expect(response.body.pix.copiaCola).toBeTruthy();
  });

  it("receives Mini App proof and panel review decisions", async () => {
    await request(app, "POST", "/api/miniapp/checkout/pix", checkoutPayload("MJ-HTTP-2"));

    const proof = await request(app, "POST", "/api/miniapp/pedidos/MJ-HTTP-2/comprovante", {
      texto: "Pix feito",
    });
    const approved = await request(app, "POST", "/api/admin/orders/MJ-HTTP-2/payment-proof/review", {
      decision: "approve",
    });

    expect(proof.status).toBe(200);
    expect(proof.body.order.status).toBe("comprovante_recebido");
    expect(approved.body.order.status).toBe("preparando");
    expect(approved.body.order.pagamento.status).toBe("confirmado");
  });

  it("supports courier assignment and delivery status updates", async () => {
    await request(app, "POST", "/api/miniapp/checkout/pix", checkoutPayload("MJ-HTTP-3"));
    await request(app, "POST", "/api/admin/couriers", {
      id: "entregador-1",
      nome: "Joao Entregador",
      chatId: "777",
    });

    const assigned = await request(app, "POST", "/api/admin/orders/MJ-HTTP-3/delivery", {
      courierId: "entregador-1",
    });
    const accepted = await request(app, "POST", "/api/delivery/accept", {
      deliveryId: assigned.body.delivery.id,
      courierChatId: "777",
    });
    const delivered = await request(app, "POST", "/api/delivery/status", {
      deliveryId: assigned.body.delivery.id,
      courierChatId: "777",
      status: "entregue",
    });

    expect(assigned.body.delivery.status).toBe("oferecida");
    expect(accepted.body.delivery.status).toBe("aceita");
    expect(delivered.body.order.status).toBe("entregue");
  });

  it("lets the delivery Telegram bot accept and update an assigned delivery", async () => {
    await request(app, "POST", "/api/miniapp/checkout/pix", checkoutPayload("MJ-HTTP-4"));
    await request(app, "POST", "/api/admin/couriers", {
      id: "entregador-2",
      nome: "Maria Entregadora",
      chatId: "888",
    });
    const assigned = await request(app, "POST", "/api/admin/orders/MJ-HTTP-4/delivery", {
      courierId: "entregador-2",
    });

    const accepted = await request(app, "POST", "/api/telegram/delivery-webhook", {
      message: {
        chat: { id: 888 },
        text: `/aceitar ${assigned.body.delivery.codigo}`,
      },
    });
    const delivered = await request(app, "POST", "/api/telegram/delivery-webhook", {
      message: {
        chat: { id: 888 },
        text: `/status ${assigned.body.delivery.codigo} entregue`,
      },
    });

    expect(accepted.body.delivery.status).toBe("aceita");
    expect(delivered.body.order.status).toBe("entregue");
  });

  it("supports supplier price update approval", async () => {
    await request(app, "POST", "/api/admin/suppliers", {
      id: "fornecedor-1",
      nome: "Fornecedor Local",
      produtos: ["banana-prata"],
    });
    const requested = await request(app, "POST", "/api/admin/price-update-requests", {
      supplierId: "fornecedor-1",
      productId: "banana-prata",
      novoPrecoCents: 699,
    });
    const approved = await request(app, "POST", `/api/admin/price-update-requests/${requested.body.request.id}/review`, {
      decision: "approve",
    });
    const products = await request(app, "GET", "/api/admin/products");
    const banana = products.body.products.find((product) => product.id === "banana-prata");

    expect(requested.body.request.status).toBe("pendente");
    expect(approved.body.request.status).toBe("aprovada");
    expect(banana.precoCents).toBe(699);
  });
});

function request(expressApp, method, route, body) {
  return new Promise((resolve, reject) => {
    const server = expressApp.listen(0, "127.0.0.1", async () => {
      try {
        const port = server.address().port;
        const response = await fetch(`http://127.0.0.1:${port}${route}`, {
          method,
          headers: body === undefined ? undefined : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const text = await response.text();
        const payload = text ? JSON.parse(text) : null;
        server.close(() => resolve({ status: response.status, body: payload }));
      } catch (error) {
        server.close(() => reject(error));
      }
    });
  });
}
