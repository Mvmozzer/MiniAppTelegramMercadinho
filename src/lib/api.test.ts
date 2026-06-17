import { afterEach, describe, expect, it, vi } from "vitest";
import { createPixCheckout, fetchPublicCatalog } from "./api";

describe("bot-mercearia API contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads products from the real bot-mercearia /api/miniapp/catalogo payload", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        ok: true,
        catalogo: {
          secoes: [{ id: "mercearia", nome: "Mercearia" }],
          produtos: [
            {
              id: "mercearia_0",
              nome: "Arroz MiniApp API",
              secao: "mercearia",
              secao_nome: "Mercearia",
              unidade: "un",
              preco: 10,
              estoque: 20,
              imagem: "arroz.png",
            },
          ],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPublicCatalog()).resolves.toEqual([
      {
        id: "mercearia_0",
        name: "Arroz MiniApp API",
        category: "Mercearia",
        categoryId: "mercearia",
        unit: "un",
        priceCents: 1000,
        image: "arroz.png",
        description: "",
        stock: 20,
        active: true,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith("/api/miniapp/catalogo");
  });

  it("creates checkout through the real bot-mercearia Mini App endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        ok: true,
        pedido: {
          id: "MJ-REAL-1",
          status: "aguardando_pagamento",
          statusPagamento: "aguardando_comprovante",
          total: 10,
        },
        pix: {
          copiaCola: "000201PIXREAL",
          valor: 10,
          recebedor: "Mercadinho M&J",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createPixCheckout({
        orderId: "MJ-CLIENT-1",
        currency: "BRL",
        itemCount: 2,
        subtotalCents: 2000,
        deliveryFeeCents: 0,
        totalCents: 2000,
        lines: [
          {
            productId: "mercearia_0",
            name: "Arroz MiniApp API",
            quantity: 2,
            unitPriceCents: 1000,
            totalCents: 2000,
          },
        ],
      }),
    ).resolves.toMatchObject({
      ok: true,
      order: {
        id: "MJ-REAL-1",
        status: "aguardando_pagamento",
        totalCents: 1000,
      },
      pix: {
        copiaCola: "000201PIXREAL",
        valorCents: 1000,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/miniapp/checkout/create",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          client_order_id: "MJ-CLIENT-1",
          forma_pagamento: "pix",
          modalidade_entrega: "retirada",
          items: [
            {
              produto_id: "mercearia_0",
              quantidade: 2,
            },
          ],
        }),
      }),
    );
  });
});
