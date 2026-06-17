import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Mercadinho Mini App flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("shows the local control panel layout on the panel route", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/painel");

    render(<App />);

    expect(screen.getByText("Mercadinho M&J")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /modo do painel/i })).toBeInTheDocument();
    const panelNavigation = within(screen.getByRole("navigation", { name: /navegacao do painel/i }));

    expect(panelNavigation.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
    expect(panelNavigation.getByRole("button", { name: /pedidos/i })).toBeInTheDocument();
    expect(panelNavigation.getByRole("button", { name: /grupos de produtos/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/abrir area do painel/i)).toBeInTheDocument();
    expect(panelNavigation.queryByRole("button", { name: /arquivados/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /avancado/i }));

    const advancedNavigation = within(screen.getByRole("navigation", { name: /navegacao do painel/i }));

    expect(advancedNavigation.getByRole("button", { name: /arquivados/i })).toBeInTheDocument();
    expect(
      advancedNavigation.getByRole("button", { name: /manutencao do banco/i }),
    ).toBeInTheDocument();
  });

  it("lets the migrated control panel create a product option", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/painel");

    const bootstrap = {
      ok: true,
      config: {
        loja: { nome: "Mercadinho M&J", status: "aberta", moeda: "R$" },
        secoes: [{ id: "mercearia", nome: "Mercearia", emoji: "🛒", ativo: true, ordem: 1 }],
        checkout: {},
        telegramLoja: {},
        miniappUi: {},
      },
      secoes: [{ id: "mercearia", nome: "Mercearia", emoji: "🛒", ativo: true, ordem: 1 }],
      grupos: [
        {
          id: "cremes",
          secao_id: "mercearia",
          secao_nome: "Mercearia",
          nome: "Cremes",
          ativo: true,
          produtos_vinculados: 0,
        },
      ],
      produtos: [],
      catalogo: [],
      pedidos: [],
      arquivados: [],
      clientes: [],
      stats: {
        pedidosHoje: 0,
        aguardandoAcao: 0,
        produtosAtivos: 0,
        faturamentoCents: 0,
        estoqueBaixo: 0,
        clientes: 0,
      },
    };
    const productBootstrap = {
      ...bootstrap,
      produtos: [
        {
          id: "nutella-650g",
          nome: "Nutella Creme de Avela",
          secao_id: "mercearia",
          secao_nome: "Mercearia",
          grupo_id: "cremes",
          grupo_nome: "Cremes",
          precoCents: 6599,
          estoque: 7,
          unidade: "650g",
          ativo: true,
        },
      ],
      stats: { ...bootstrap.stats, produtosAtivos: 1 },
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/admin/bootstrap")) {
        return Response.json(bootstrap);
      }
      if (url.includes("/api/admin/products") && init?.method === "POST") {
        return Response.json({ ok: true, bootstrap: productBootstrap });
      }
      return Response.json({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await user.click(await screen.findByRole("button", { name: /produtos\/opcoes/i }));
    await user.type(screen.getByLabelText(/nome do produto/i), "Nutella Creme de Avela");
    await user.clear(screen.getByLabelText(/preco/i));
    await user.type(screen.getByLabelText(/preco/i), "65.99");
    await user.clear(screen.getByLabelText(/estoque/i));
    await user.type(screen.getByLabelText(/estoque/i), "7");
    await user.type(screen.getByLabelText(/unidade/i), "650g");
    await user.click(screen.getByRole("button", { name: /salvar produto/i }));

    expect(await screen.findByText("Nutella Creme de Avela")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/products",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows real operations for Pix proof, couriers, suppliers, and price requests", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/painel");

    const bootstrap = {
      ok: true,
      config: {
        loja: { nome: "Mercadinho M&J", status: "aberta", moeda: "R$" },
        secoes: [{ id: "mercearia", nome: "Mercearia", emoji: "M", ativo: true, ordem: 1 }],
        checkout: {},
        telegramLoja: {},
        miniappUi: {},
        pix: { recebedor: "Mercadinho M&J", chave: "11999999999", copiaCola: "000201PIX" },
      },
      secoes: [{ id: "mercearia", nome: "Mercearia", emoji: "M", ativo: true, ordem: 1 }],
      grupos: [{ id: "geral", secao_id: "mercearia", secao_nome: "Mercearia", nome: "Geral", ativo: true }],
      produtos: [
        {
          id: "banana-prata",
          nome: "Banana prata",
          secao_id: "mercearia",
          secao_nome: "Mercearia",
          grupo_id: "geral",
          grupo_nome: "Geral",
          precoCents: 499,
          estoque: 7,
          unidade: "kg",
          ativo: true,
        },
      ],
      catalogo: [],
      pedidos: [
        {
          id: "MJ-PIX-PAINEL",
          status: "comprovante_recebido",
          totalCents: 499,
          itemCount: 1,
          cliente: { nome: "Cliente Telegram", chatId: "123" },
          pagamento: { metodo: "pix_estatico", status: "comprovante_recebido", pixCopiaECola: "000201PIX" },
          comprovantesPagamento: [{ id: "comp-1", origem: "telegram", tipo: "foto", fileId: "file_1" }],
          itens: [{ nome: "Banana prata", qtd: 1, subtotalCents: 499 }],
        },
      ],
      arquivados: [],
      clientes: [],
      entregadores: [{ id: "entregador-1", nome: "Joao Entregador", chatId: "777", ativo: true }],
      entregas: [],
      fornecedores: [{ id: "fornecedor-1", nome: "Fornecedor Local", produtos: ["banana-prata"], ativo: true }],
      solicitacoesPrecos: [
        {
          id: "PRECO-1",
          supplierId: "fornecedor-1",
          supplierName: "Fornecedor Local",
          productId: "banana-prata",
          productName: "Banana prata",
          novoPrecoCents: 699,
          status: "pendente",
        },
      ],
      stats: {
        pedidosHoje: 1,
        aguardandoAcao: 1,
        produtosAtivos: 1,
        faturamentoCents: 0,
        estoqueBaixo: 0,
        clientes: 0,
      },
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/admin/bootstrap")) return Response.json(bootstrap);
      return Response.json({ ok: true, bootstrap });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const panelNavigation = within(screen.getByRole("navigation", { name: /navegacao do painel/i }));

    await user.click(await panelNavigation.findByRole("button", { name: /^pedidos$/i }));
    expect(screen.getByRole("button", { name: /aprovar pix/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /recusar pix/i })).toBeInTheDocument();

    await user.click(panelNavigation.getByRole("button", { name: /^entregadores$/i }));
    expect(screen.queryByText(/contrato migrado/i)).not.toBeInTheDocument();
    expect(screen.getByText("Joao Entregador")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar entregador/i })).toBeInTheDocument();

    await user.click(panelNavigation.getByRole("button", { name: /^fornecedores$/i }));
    expect(screen.queryByText(/contrato migrado/i)).not.toBeInTheDocument();
    expect(screen.getByText("Fornecedor Local")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar fornecedor/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /avancado/i }));
    await user.click(panelNavigation.getByRole("button", { name: /solicitacoes de preco/i }));
    expect(screen.queryByText(/contrato migrado/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Banana prata").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /aprovar solicitacao/i })).toBeInTheDocument();
  });

  it("lets the customer switch sections from the right side menu", async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(screen.queryByRole("region", { name: /carrossel de secoes/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir menu de secoes/i }));
    expect(screen.getByRole("dialog", { name: /menu de secoes/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /abrir secao padaria/i }));

    expect(screen.getByText("Pao frances")).toBeInTheDocument();
    expect(screen.queryByText("Banana prata")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /menu de secoes/i })).not.toBeInTheDocument();
  });

  it("loads the customer catalog generated by the control panel", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/miniapp/catalog")) {
        return Response.json({
          ok: true,
          products: [
            {
              id: "nutella-650g",
              name: "Nutella Creme de Avela",
              category: "Mercearia",
              categoryId: "mercearia",
              unit: "650g",
              priceCents: 6599,
              image: "nutella.png",
              stock: 7,
            },
          ],
        });
      }
      return Response.json({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByText("Nutella Creme de Avela")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/miniapp/catalog");
  });

  it("shows product carousels for each section on the homepage", () => {
    render(<App />);

    expect(screen.getByRole("region", { name: /produtos de hortifruti/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /produtos de padaria/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /produtos de bebidas/i })).toBeInTheDocument();
    expect(screen.getAllByText("Banana prata").length).toBeGreaterThan(0);
    expect(screen.getByText("Pao frances")).toBeInTheDocument();
    expect(screen.getByText("Leite integral")).toBeInTheDocument();
  });

  it("keeps the add button inside the product image area", () => {
    render(<App />);

    const addButton = screen.getByRole("button", { name: /adicionar banana prata/i });

    expect(addButton.closest(".product-media")).not.toBeNull();
  });

  it("keeps the Mini App to menu and checkout, then creates Pix order and sends handoff to Telegram", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/miniapp/checkout/pix")) {
        return Response.json({
          ok: true,
          order: {
            id: "MJ-TESTE-1",
            status: "aguardando_comprovante",
            totalCents: 499,
          },
          pix: {
            copiaCola: "000201PIXTESTE",
            recebedor: "Mercadinho M&J",
            valorCents: 499,
          },
        });
      }
      return Response.json({
        ok: true,
        products: [],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await user.click(screen.getByRole("button", { name: /adicionar banana prata/i }));
    expect(screen.getByRole("button", { name: /diminuir banana prata/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /diminuir banana prata/i }));
    expect(screen.getByRole("button", { name: /abrir checkout/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /adicionar banana prata/i }));
    await user.click(screen.getByRole("button", { name: /abrir checkout/i }));
    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getByText("Banana prata")).toBeInTheDocument();
    expect(screen.queryByText("Entrega")).not.toBeInTheDocument();
    expect(screen.queryByText("Retirada")).not.toBeInTheDocument();
    expect(screen.queryByText("Endereco")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /gerar pix no telegram/i }));

    await waitFor(() => {
      expect(screen.getByText("Pedido Pix criado")).toBeInTheDocument();
    });
    expect(screen.getByText("MJ-TESTE-1")).toBeInTheDocument();
    expect(screen.getByText(/envie o comprovante/i)).toBeInTheDocument();

    const [, requestInit] = fetchMock.mock.calls.find(([input]) =>
      String(input).includes("/api/miniapp/checkout/pix"),
    ) || [];
    const body = JSON.parse(String(requestInit?.body));
    expect(body).not.toHaveProperty("fulfillment");
    expect(body).not.toHaveProperty("address");
    expect(body).not.toHaveProperty("note");
  });

});
