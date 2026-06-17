import { describe, expect, it } from "vitest";
import {
  catalogProductsFromState,
  createInitialPanelState,
  createPanelStats,
  upsertProductInState,
} from "./panelStore.js";

describe("panel store contracts", () => {
  it("turns the panel product model into the Mini App catalog", () => {
    const state = createInitialPanelState();
    const catalog = catalogProductsFromState(state);

    expect(catalog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "banana-prata",
          name: "Banana prata",
          category: "Hortifruti",
          priceCents: 499,
          unit: "kg",
        }),
      ]),
    );
    expect(catalog.some((product) => product.id.includes("grupo"))).toBe(false);
  });

  it("keeps inactive products out of the public Mini App catalog", () => {
    const state = createInitialPanelState();
    const nextState = upsertProductInState(state, {
      id: "teste-inativo",
      secao_id: "mercearia",
      grupo_id: "mercearia-geral",
      nome: "Produto inativo",
      precoCents: 999,
      estoque: 4,
      ativo: false,
    });

    expect(catalogProductsFromState(nextState).some((product) => product.id === "teste-inativo")).toBe(false);
  });

  it("calculates operational stats from products and orders", () => {
    const state = createInitialPanelState();
    state.pedidos.push({
      id: "MJ-TESTE-1",
      status: "pago",
      totalCents: 1499,
      itemCount: 2,
      createdAt: new Date().toISOString(),
    });

    expect(createPanelStats(state)).toMatchObject({
      pedidosHoje: 1,
      aguardandoAcao: 1,
      faturamentoCents: 1499,
    });
    expect(createPanelStats(state).produtosAtivos).toBeGreaterThan(0);
  });
});
