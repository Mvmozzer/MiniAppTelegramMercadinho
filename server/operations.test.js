import { describe, expect, it } from "vitest";
import {
  acceptDeliveryInState,
  assignDeliveryInState,
  createPixOrderFromCheckout,
  createPriceUpdateRequestInState,
  recordPaymentProofInState,
  reviewPaymentProofInState,
  reviewPriceUpdateRequestInState,
  updateDeliveryStatusInState,
  upsertCourierInState,
  upsertSupplierInState,
} from "./operations.js";
import { createInitialPanelState, listPanelProducts } from "./panelStore.js";

function checkoutPayload(orderId = "MJ-PIX-1", quantity = 2) {
  return {
    orderId,
    currency: "BRL",
    itemCount: quantity,
    subtotalCents: 1,
    deliveryFeeCents: 0,
    totalCents: 1,
    lines: [
      {
        productId: "banana-prata",
        name: "Preco adulterado",
        quantity,
        unitPriceCents: 1,
        totalCents: quantity,
      },
    ],
  };
}

describe("Pix static order operation", () => {
  it("creates a real Mini App order awaiting proof with server-side price validation", () => {
    const state = createInitialPanelState();
    state.config.pix = {
      recebedor: "Mercadinho M&J",
      chave: "11999999999",
      cidade: "SAO PAULO",
      copiaCola: "000201PIXESTATICOMJ",
    };

    const result = createPixOrderFromCheckout(state, checkoutPayload());

    expect(result.order).toMatchObject({
      id: "MJ-PIX-1",
      status: "aguardando_comprovante",
      origem: "telegram-miniapp",
      subtotalCents: 998,
      totalCents: 998,
      pagamento: {
        metodo: "pix_estatico",
        status: "aguardando_comprovante",
        pixCopiaECola: "000201PIXESTATICOMJ",
      },
    });
    expect(result.order.itens[0]).toMatchObject({
      produtoId: "banana-prata",
      nome: "Banana prata",
      qtd: 2,
      precoCents: 499,
      subtotalCents: 998,
    });
    expect(result.pixMessage).toContain("Pedido MJ-PIX-1");
    expect(result.pixMessage).toContain("000201PIXESTATICOMJ");
  });

  it("stores Telegram photo proof and moves the payment to proof received", () => {
    const created = createPixOrderFromCheckout(createInitialPanelState(), checkoutPayload("MJ-PIX-2", 1));

    const result = recordPaymentProofInState(created.state, "MJ-PIX-2", {
      origem: "telegram",
      tipo: "foto",
      fileId: "file_123",
      chatId: "12345",
    });

    expect(result.order.status).toBe("comprovante_recebido");
    expect(result.order.pagamento.status).toBe("comprovante_recebido");
    expect(result.order.comprovantesPagamento[0]).toMatchObject({ fileId: "file_123", origem: "telegram" });
  });

  it("lets the panel approve or reject a received proof", () => {
    const created = createPixOrderFromCheckout(createInitialPanelState(), checkoutPayload("MJ-PIX-3", 1));
    const received = recordPaymentProofInState(created.state, "MJ-PIX-3", {
      origem: "miniapp",
      tipo: "texto",
      texto: "comprovante enviado",
    });

    const approved = reviewPaymentProofInState(received.state, "MJ-PIX-3", {
      decision: "approve",
      reviewedBy: "admin",
    });
    const rejected = reviewPaymentProofInState(received.state, "MJ-PIX-3", {
      decision: "reject",
      reviewedBy: "admin",
      motivo: "valor divergente",
    });

    expect(approved.order.status).toBe("preparando");
    expect(approved.order.pagamento.status).toBe("confirmado");
    expect(rejected.order.status).toBe("aguardando_comprovante");
    expect(rejected.order.pagamento.status).toBe("comprovante_recusado");
  });
});

describe("delivery operation", () => {
  it("registers a courier, assigns an order, accepts delivery, and advances status", () => {
    const created = createPixOrderFromCheckout(createInitialPanelState(), checkoutPayload("MJ-DEL-1", 1));
    const courierState = upsertCourierInState(created.state, {
      id: "entregador-1",
      nome: "Joao Entregador",
      chatId: "777",
      ativo: true,
    }).state;

    const assigned = assignDeliveryInState(courierState, "MJ-DEL-1", {
      courierId: "entregador-1",
      createdBy: "painel",
    });
    const accepted = acceptDeliveryInState(assigned.state, assigned.delivery.id, { courierChatId: "777" });
    const updated = updateDeliveryStatusInState(accepted.state, accepted.delivery.id, "entregue", {
      courierChatId: "777",
    });

    expect(assigned.delivery).toMatchObject({
      orderId: "MJ-DEL-1",
      courierId: "entregador-1",
      status: "oferecida",
    });
    expect(accepted.delivery.status).toBe("aceita");
    expect(updated.delivery.status).toBe("entregue");
    expect(updated.order.status).toBe("entregue");
  });
});

describe("supplier price operation", () => {
  it("registers a supplier and applies an approved price update request", () => {
    const state = createInitialPanelState();
    const withSupplier = upsertSupplierInState(state, {
      id: "fornecedor-1",
      nome: "Fornecedor Local",
      telefone: "11999999999",
      produtos: ["banana-prata"],
    }).state;
    const requested = createPriceUpdateRequestInState(withSupplier, {
      supplierId: "fornecedor-1",
      productId: "banana-prata",
      novoPrecoCents: 699,
      observacao: "novo custo da semana",
    });

    const approved = reviewPriceUpdateRequestInState(requested.state, requested.request.id, {
      decision: "approve",
      reviewedBy: "gerente",
    });
    const product = listPanelProducts(approved.state).find((item) => item.id === "banana-prata");

    expect(requested.request).toMatchObject({
      supplierId: "fornecedor-1",
      productId: "banana-prata",
      novoPrecoCents: 699,
      status: "pendente",
    });
    expect(approved.request.status).toBe("aprovada");
    expect(product?.precoCents).toBe(699);
  });
});
