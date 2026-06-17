import { describe, expect, it } from "vitest";
import { buildShippingOptions, buildTelegramInvoiceRequest } from "./telegramPayments.js";

describe("Telegram payment invoice request", () => {
  it("builds Telegram prices from server catalog values", () => {
    const request = buildTelegramInvoiceRequest({
      orderId: "MJ-TESTE-2",
      currency: "BRL",
      itemCount: 2,
      subtotalCents: 1,
      deliveryFeeCents: 0,
      totalCents: 1,
      lines: [
        {
          productId: "banana-prata",
          name: "Banana barata enviada pelo cliente",
          quantity: 2,
          unitPriceCents: 1,
          totalCents: 2,
        },
      ],
    });

    expect(request).toMatchObject({
      title: "Pedido MJ-TESTE-2",
      currency: "BRL",
      payload: "MJ-TESTE-2",
      prices: [{ label: "Banana prata x2", amount: 998 }],
      need_shipping_address: true,
      is_flexible: true,
    });
  });

  it("offers delivery options through Telegram shipping query", () => {
    expect(buildShippingOptions()).toEqual([
      {
        id: "delivery-local",
        title: "Entrega local",
        prices: [{ label: "Entrega", amount: 500 }],
      },
      {
        id: "pickup-counter",
        title: "Retirar no mercadinho",
        prices: [{ label: "Retirada", amount: 0 }],
      },
    ]);
  });

  it("rejects products that are not in the server catalog", () => {
    expect(() =>
      buildTelegramInvoiceRequest({
        orderId: "MJ-TESTE-3",
        currency: "BRL",
        itemCount: 1,
        subtotalCents: 1,
        deliveryFeeCents: 0,
        totalCents: 1,
        lines: [
          {
            productId: "produto-falso",
            name: "Produto falso",
            quantity: 1,
            unitPriceCents: 1,
            totalCents: 1,
          },
        ],
      }),
    ).toThrow("Produto desconhecido");
  });

  it("can validate invoice prices from the migrated panel catalog", () => {
    const request = buildTelegramInvoiceRequest(
      {
        orderId: "MJ-TESTE-4",
        currency: "BRL",
        itemCount: 1,
        subtotalCents: 1,
        deliveryFeeCents: 0,
        totalCents: 1,
        lines: [
          {
            productId: "novo-produto",
            name: "Preco adulterado",
            quantity: 3,
            unitPriceCents: 1,
            totalCents: 3,
          },
        ],
      },
      (productId) =>
        productId === "novo-produto"
          ? { name: "Produto do painel", priceCents: 777 }
          : undefined,
    );

    expect(request.prices).toEqual([{ label: "Produto do painel x3", amount: 2331 }]);
  });

  it("accepts a simple item payload and generates an order id", () => {
    const request = buildTelegramInvoiceRequest({
      items: [
        {
          id: "banana-prata",
          name: "Banana",
          quantity: 1,
          priceCents: 1,
        },
      ],
    });

    expect(request.payload).toMatch(/^MJ-\d{4}-[A-Z0-9]+$/);
    expect(request.prices).toEqual([{ label: "Banana prata x1", amount: 499 }]);
  });
});
