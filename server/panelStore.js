import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATA_FILE = path.join(process.cwd(), "data", "panel-state.json");

const DEFAULT_SECTIONS = [
  { id: "hortifruti", nome: "Hortifruti", emoji: "🥬", ativo: true, ordem: 0 },
  { id: "padaria", nome: "Padaria", emoji: "🥐", ativo: true, ordem: 1 },
  { id: "bebidas", nome: "Bebidas", emoji: "🥤", ativo: true, ordem: 2 },
  { id: "mercearia", nome: "Mercearia", emoji: "🛒", ativo: true, ordem: 3 },
  { id: "limpeza", nome: "Limpeza", emoji: "🧼", ativo: true, ordem: 4 },
];

const SEED_GROUPS = [
  { secao: "hortifruti", id: "frutas", nome: "Frutas", emoji: "🍌" },
  { secao: "hortifruti", id: "legumes", nome: "Legumes", emoji: "🍅" },
  { secao: "padaria", id: "paes", nome: "Paes", emoji: "🥖" },
  { secao: "padaria", id: "bolos", nome: "Bolos", emoji: "🍰" },
  { secao: "bebidas", id: "leites", nome: "Leites", emoji: "🥛" },
  { secao: "bebidas", id: "sucos", nome: "Sucos", emoji: "🍊" },
  { secao: "mercearia", id: "arroz", nome: "Arroz", emoji: "🍚" },
  { secao: "mercearia", id: "feijao", nome: "Feijao", emoji: "🫘" },
  { secao: "limpeza", id: "detergentes", nome: "Detergentes", emoji: "🧽" },
  { secao: "limpeza", id: "roupas", nome: "Roupas", emoji: "🧺" },
];

const SEED_PRODUCTS = [
  {
    id: "banana-prata",
    secao: "hortifruti",
    grupo: "frutas",
    nome: "Banana prata",
    unidade: "kg",
    precoCents: 499,
    estoque: 24,
    imagem: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=320&q=80",
    descricao: "Banana fresca selecionada.",
  },
  {
    id: "tomate-italiano",
    secao: "hortifruti",
    grupo: "legumes",
    nome: "Tomate italiano",
    unidade: "kg",
    precoCents: 799,
    estoque: 18,
    imagem: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=320&q=80",
    descricao: "Ideal para saladas e molho.",
  },
  {
    id: "pao-frances",
    secao: "padaria",
    grupo: "paes",
    nome: "Pao frances",
    unidade: "un",
    precoCents: 90,
    estoque: 80,
    imagem: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=320&q=80",
    descricao: "Assado no dia.",
  },
  {
    id: "bolo-cenoura",
    secao: "padaria",
    grupo: "bolos",
    nome: "Bolo de cenoura",
    unidade: "fatia",
    precoCents: 690,
    estoque: 12,
    imagem: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=320&q=80",
    descricao: "Com cobertura de chocolate.",
  },
  {
    id: "leite-integral",
    secao: "bebidas",
    grupo: "leites",
    nome: "Leite integral",
    unidade: "1L",
    precoCents: 599,
    estoque: 30,
    imagem: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=320&q=80",
    descricao: "Caixa longa vida.",
  },
  {
    id: "suco-laranja",
    secao: "bebidas",
    grupo: "sucos",
    nome: "Suco de laranja",
    unidade: "1L",
    precoCents: 1190,
    estoque: 16,
    imagem: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=320&q=80",
    descricao: "Pronto para beber.",
  },
  {
    id: "arroz-tipo-1",
    secao: "mercearia",
    grupo: "arroz",
    nome: "Arroz tipo 1",
    unidade: "5kg",
    precoCents: 2290,
    estoque: 20,
    imagem: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=320&q=80",
    descricao: "Pacote familiar.",
  },
  {
    id: "feijao-carioca",
    secao: "mercearia",
    grupo: "feijao",
    nome: "Feijao carioca",
    unidade: "1kg",
    precoCents: 899,
    estoque: 22,
    imagem: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=320&q=80",
    descricao: "Graos selecionados.",
  },
  {
    id: "detergente-neutro",
    secao: "limpeza",
    grupo: "detergentes",
    nome: "Detergente neutro",
    unidade: "500ml",
    precoCents: 299,
    estoque: 48,
    imagem: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=320&q=80",
    descricao: "Para loucas e superficies.",
  },
  {
    id: "sabao-po",
    secao: "limpeza",
    grupo: "roupas",
    nome: "Sabao em po",
    unidade: "800g",
    precoCents: 1290,
    estoque: 14,
    imagem: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=320&q=80",
    descricao: "Rende ate 10 lavagens.",
  },
];

export function createInitialPanelState() {
  const produtos = {};

  for (const section of DEFAULT_SECTIONS) {
    produtos[section.id] = [];
  }

  for (const group of SEED_GROUPS) {
    produtos[group.secao].push(createGroupProduct(group, produtos[group.secao].length));
  }

  for (const product of SEED_PRODUCTS) {
    produtos[product.secao].push(createSkuProduct(product, produtos[product.secao].length));
  }

  return {
    schemaVersion: 1,
    atualizadoEm: new Date().toISOString(),
    config: {
      loja: {
        nome: "Mercadinho M&J",
        status: "aberta",
        mensagemStatus: "",
        moeda: "R$",
      },
      secoes: DEFAULT_SECTIONS.map((section) => ({ ...section })),
      checkout: {
        bloquear_compra_acima_estoque: true,
        exibir_estoque_antes_finalizar: true,
      },
      telegramLoja: {
        mostrar_fotos_produtos: true,
        mostrar_estoque_disponivel: true,
        mostrar_preco_promocional: true,
        mostrar_produtos_sem_estoque: false,
      },
      miniappUi: {
        titulo: "Mercadinho",
        saudacao: "Ola, cliente",
      },
      pix: {
        recebedor: "Mercadinho M&J",
        chave: "",
        cidade: "",
        copiaCola: "",
      },
    },
    produtos,
    pedidos: [],
    arquivados: [],
    clientes: [],
    carrinhos: {},
    entradasEstoque: [],
    movimentacoesEstoque: [],
    entregadores: [],
    entregas: [],
    fornecedores: [],
    solicitacoesPrecos: [],
    usuarios: [],
    auditoria: [],
  };
}

export function getPanelDataFile() {
  return process.env.MERCADINHO_DATA_FILE
    ? path.resolve(process.env.MERCADINHO_DATA_FILE)
    : DEFAULT_DATA_FILE;
}

export function readPanelState(filePath = getPanelDataFile()) {
  if (!fs.existsSync(filePath)) {
    const initialState = createInitialPanelState();
    writePanelState(initialState, filePath);
    return initialState;
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const state = normalizeState(parsed);
  writePanelState(state, filePath);
  return state;
}

export function writePanelState(state, filePath = getPanelDataFile()) {
  const normalized = normalizeState(state);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

export function updatePanelState(mutator, filePath = getPanelDataFile()) {
  const state = readPanelState(filePath);
  const nextState = mutator(clone(state)) || state;
  nextState.atualizadoEm = new Date().toISOString();
  return writePanelState(nextState, filePath);
}

export function normalizeState(input = {}) {
  const fallback = createInitialPanelState();
  const config = {
    ...fallback.config,
    ...(input.config || {}),
    loja: { ...fallback.config.loja, ...(input.config?.loja || {}) },
    checkout: { ...fallback.config.checkout, ...(input.config?.checkout || {}) },
    telegramLoja: { ...fallback.config.telegramLoja, ...(input.config?.telegramLoja || {}) },
    miniappUi: { ...fallback.config.miniappUi, ...(input.config?.miniappUi || {}) },
    pix: { ...fallback.config.pix, ...(input.config?.pix || {}) },
  };

  config.secoes = Array.isArray(input.config?.secoes) && input.config.secoes.length
    ? input.config.secoes.map(normalizeSection)
    : fallback.config.secoes;

  const produtos = input.produtos && typeof input.produtos === "object" ? input.produtos : fallback.produtos;
  for (const section of config.secoes) {
    produtos[section.id] = Array.isArray(produtos[section.id]) ? produtos[section.id] : [];
  }

  return {
    ...fallback,
    ...input,
    schemaVersion: 1,
    config,
    produtos,
    pedidos: Array.isArray(input.pedidos) ? input.pedidos : [],
    arquivados: Array.isArray(input.arquivados) ? input.arquivados : [],
    clientes: Array.isArray(input.clientes) ? input.clientes : [],
    carrinhos: input.carrinhos && typeof input.carrinhos === "object" ? input.carrinhos : {},
    entradasEstoque: Array.isArray(input.entradasEstoque) ? input.entradasEstoque : [],
    movimentacoesEstoque: Array.isArray(input.movimentacoesEstoque) ? input.movimentacoesEstoque : [],
    entregadores: Array.isArray(input.entregadores) ? input.entregadores : [],
    entregas: Array.isArray(input.entregas) ? input.entregas : [],
    fornecedores: Array.isArray(input.fornecedores) ? input.fornecedores : [],
    solicitacoesPrecos: Array.isArray(input.solicitacoesPrecos) ? input.solicitacoesPrecos : [],
    usuarios: Array.isArray(input.usuarios) ? input.usuarios : [],
    auditoria: Array.isArray(input.auditoria) ? input.auditoria : [],
  };
}

export function panelBootstrap(state = readPanelState()) {
  return {
    ok: true,
    config: state.config,
    secoes: listSections(state),
    grupos: listGroupsFromState(state),
    produtos: listPanelProducts(state),
    catalogo: catalogProductsFromState(state),
    pedidos: state.pedidos || [],
    arquivados: state.arquivados || [],
    clientes: state.clientes || [],
    carrinhos: state.carrinhos || {},
    entregadores: state.entregadores || [],
    entregas: state.entregas || [],
    fornecedores: state.fornecedores || [],
    solicitacoesPrecos: state.solicitacoesPrecos || [],
    usuarios: state.usuarios || [],
    auditoria: state.auditoria || [],
    estoque: {
      entradas: state.entradasEstoque || [],
      movimentacoes: state.movimentacoesEstoque || [],
    },
    stats: createPanelStats(state),
  };
}

export function listSections(state) {
  return [...(state.config?.secoes || [])].map(normalizeSection).sort(sortByOrderAndName);
}

export function listGroupsFromState(state) {
  const sections = new Map(listSections(state).map((section) => [section.id, section]));
  return Object.entries(state.produtos || {}).flatMap(([secaoId, items]) =>
    (items || [])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => isGroupProduct(item))
      .map(({ item, index }) => ({
        id: String(item.grupo_id || item.id || slugify(item.nome)),
        secao_id: secaoId,
        secao_nome: sections.get(secaoId)?.nome || secaoId,
        nome: String(item.nome || item.grupo_nome || "Grupo"),
        emoji: String(item.emoji || ""),
        ativo: item.ativo !== false,
        ordem: Number(item.ordem ?? index),
        produto_principal_index: index,
        produtos_vinculados: countProductsInGroup(state, secaoId, String(item.grupo_id || item.id || "")),
      })),
  ).sort((a, b) =>
    String(a.secao_nome).localeCompare(String(b.secao_nome)) ||
    Number(a.ordem || 0) - Number(b.ordem || 0) ||
    String(a.nome).localeCompare(String(b.nome)),
  );
}

export function listPanelProducts(state) {
  const sections = new Map(listSections(state).map((section) => [section.id, section]));
  const groups = new Map(listGroupsFromState(state).map((group) => [`${group.secao_id}:${group.id}`, group]));

  return Object.entries(state.produtos || {}).flatMap(([secaoId, items]) =>
    (items || [])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !isGroupProduct(item))
      .map(({ item, index }) => {
        const id = String(item.id || item.sku || `${secaoId}_${index}`);
        const groupId = String(item.grupo_id || item.produto_pai_id || "");
        const group = groups.get(`${secaoId}:${groupId}`);
        return {
          ...item,
          id,
          produto_id: id,
          secao_id: secaoId,
          secao_nome: sections.get(secaoId)?.nome || secaoId,
          grupo_id: groupId,
          grupo_nome: group?.nome || item.grupo_nome || item.produto_pai_nome || "",
          nome: String(item.nome || ""),
          precoCents: priceCentsFromProduct(item),
          estoque: Number(item.estoque_pronta_entrega ?? item.estoque ?? 0),
          unidade: String(item.unidadeVenda || item.unidadeMedida || item.unit || "un"),
          ativo: item.ativo !== false,
          index,
        };
      }),
  ).sort((a, b) =>
    String(a.secao_nome).localeCompare(String(b.secao_nome)) ||
    String(a.grupo_nome).localeCompare(String(b.grupo_nome)) ||
    String(a.nome).localeCompare(String(b.nome)),
  );
}

export function catalogProductsFromState(state) {
  const activeSections = new Map(
    listSections(state)
      .filter((section) => section.ativo !== false)
      .map((section) => [section.id, section]),
  );

  return listPanelProducts(state)
    .filter((product) => product.ativo !== false)
    .filter((product) => activeSections.has(product.secao_id))
    .filter((product) => product.precoCents > 0)
    .map((product) => {
      const section = activeSections.get(product.secao_id);
      return {
        id: product.id,
        name: product.nome,
        category: section?.nome || product.secao_nome || product.secao_id,
        categoryId: product.secao_id,
        unit: product.unidade,
        priceCents: product.precoCents,
        image: product.imagem_url || product.imagem || "",
        description: product.descricao || product.observacaoProduto || "",
        stock: Number(product.estoque || 0),
        active: true,
      };
    });
}

export function createPanelStats(state) {
  const products = listPanelProducts(state);
  const activeProducts = products.filter((product) => product.ativo !== false);
  const orders = [...(state.pedidos || []), ...(state.arquivados || [])];
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter((order) => String(order.createdAt || order.criadoEm || "").slice(0, 10) === todayKey);
  const openStatuses = new Set([
    "aguardando_pagamento",
    "aguardando_comprovante",
    "comprovante_recebido",
    "pago",
    "preparando",
    "pronto",
    "aguardando_entrega",
    "em_entrega",
  ]);

  return {
    pedidosHoje: todaysOrders.length,
    aguardandoAcao: orders.filter((order) => openStatuses.has(String(order.status || "aguardando_pagamento"))).length,
    produtosAtivos: activeProducts.length,
    estoqueBaixo: activeProducts.filter((product) => Number(product.estoque || 0) <= 3).length,
    faturamentoCents: orders
      .filter((order) => ["pago", "preparando", "pronto", "entregue"].includes(String(order.status || "")))
      .reduce((sum, order) => sum + Number(order.totalCents ?? Math.round(Number(order.total || 0) * 100)), 0),
    clientes: Array.isArray(state.clientes) ? state.clientes.length : 0,
    comprovantesPendentes: orders.filter((order) => String(order.pagamento?.status || order.status_pagamento || order.status || "") === "comprovante_recebido").length,
    entregasAtivas: (state.entregas || []).filter((delivery) => !["entregue", "cancelada"].includes(String(delivery.status || ""))).length,
    solicitacoesPreco: (state.solicitacoesPrecos || []).filter((request) => String(request.status || "") === "pendente").length,
  };
}

export function upsertSectionInState(state, payload) {
  const next = clone(state);
  const section = normalizeSection({
    id: payload.id || slugify(payload.nome || payload.name),
    nome: payload.nome || payload.name,
    emoji: payload.emoji,
    ativo: payload.ativo,
    ordem: payload.ordem,
  });
  const sections = next.config.secoes || [];
  const index = sections.findIndex((item) => item.id === section.id);
  if (index >= 0) sections[index] = { ...sections[index], ...section, atualizado_em: new Date().toISOString() };
  else sections.push({ ...section, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() });
  next.config.secoes = sections.sort(sortByOrderAndName);
  next.produtos[section.id] = Array.isArray(next.produtos[section.id]) ? next.produtos[section.id] : [];
  return next;
}

export function deleteSectionInState(state, sectionId) {
  const next = clone(state);
  const linkedProducts = listPanelProducts(next).filter((product) => product.secao_id === sectionId);
  if (linkedProducts.length > 0) {
    return { ok: false, state, erro: "secao possui produtos vinculados" };
  }
  next.config.secoes = (next.config.secoes || []).filter((section) => section.id !== sectionId);
  delete next.produtos[sectionId];
  return { ok: true, state: next };
}

export function upsertGroupInState(state, payload) {
  const next = clone(state);
  const secaoId = String(payload.secao_id || payload.secao || "").trim();
  if (!secaoId) throw new Error("grupo precisa de secao");
  const id = String(payload.id || slugify(payload.nome || payload.name)).trim();
  const items = next.produtos[secaoId] || [];
  const index = items.findIndex((item) => isGroupProduct(item) && String(item.grupo_id || item.id) === id);
  const groupProduct = createGroupProduct({
    secao: secaoId,
    id,
    nome: payload.nome || payload.name,
    emoji: payload.emoji || "",
    ativo: payload.ativo,
    ordem: payload.ordem,
  }, index >= 0 ? index : items.length);
  if (index >= 0) items[index] = { ...items[index], ...groupProduct, atualizado_em: new Date().toISOString() };
  else items.push(groupProduct);
  next.produtos[secaoId] = items;
  return next;
}

export function deleteGroupInState(state, groupId, secaoId = "") {
  const next = clone(state);
  const group = listGroupsFromState(next).find((item) => item.id === groupId && (!secaoId || item.secao_id === secaoId));
  if (!group) return { ok: false, state, erro: "grupo nao encontrado" };
  if (group.produtos_vinculados > 0) return { ok: false, state, erro: "grupo possui produtos vinculados" };
  next.produtos[group.secao_id].splice(group.produto_principal_index, 1);
  return { ok: true, state: next };
}

export function upsertProductInState(state, payload) {
  const next = clone(state);
  const secaoId = String(payload.secao_id || payload.secao || payload.categoryId || "").trim();
  const nome = String(payload.nome || payload.name || "").trim();
  if (!secaoId || !nome) throw new Error("produto precisa de secao e nome");

  const groupId = String(payload.grupo_id || payload.groupId || "").trim() || ensureDefaultGroup(next, secaoId);
  const group = listGroupsFromState(next).find((item) => item.id === groupId && item.secao_id === secaoId);
  const productId = String(payload.id || payload.produto_id || slugify(`${secaoId}-${groupId}-${nome}`)).trim();
  const items = next.produtos[secaoId] || [];
  const index = items.findIndex((item) => !isGroupProduct(item) && String(item.id || item.sku) === productId);
  const priceCents = centsFromPayload(payload);
  const product = {
    ...(index >= 0 ? items[index] : {}),
    id: productId,
    sku: String(payload.sku || productId).trim(),
    tipo: "sku",
    produto_principal: false,
    nome,
    descricao: String(payload.descricao || payload.description || "").trim(),
    secao_id: secaoId,
    grupo_id: groupId,
    grupo_nome: group?.nome || payload.grupo_nome || "",
    produto_pai_id: groupId,
    produto_pai_nome: group?.nome || payload.grupo_nome || "",
    nome_principal: group?.nome || payload.grupo_nome || "",
    preco: priceCents / 100,
    preco_normal: priceCents / 100,
    precoCents: priceCents,
    estoque: Number(payload.estoque_pronta_entrega ?? payload.estoque ?? payload.stock ?? 0),
    estoque_pronta_entrega: Number(payload.estoque_pronta_entrega ?? payload.estoque ?? payload.stock ?? 0),
    unidadeVenda: String(payload.unidadeVenda || payload.unidade || payload.unit || "un").trim(),
    unidadeMedida: String(payload.unidadeMedida || payload.unidade || payload.unit || "un").trim(),
    imagem: String(payload.imagem || payload.image || "").trim(),
    imagem_url: String(payload.imagem_url || payload.imagem || payload.image || "").trim(),
    ativo: toBoolean(payload.ativo ?? payload.active, true),
    atualizado_em: new Date().toISOString(),
    criado_em: index >= 0 ? items[index].criado_em : new Date().toISOString(),
  };

  if (index >= 0) items[index] = product;
  else items.push(product);
  next.produtos[secaoId] = items;
  return next;
}

export function deleteProductInState(state, productId) {
  const next = clone(state);
  for (const [secaoId, items] of Object.entries(next.produtos || {})) {
    const index = (items || []).findIndex((item) => !isGroupProduct(item) && String(item.id || item.sku) === String(productId));
    if (index >= 0) {
      next.produtos[secaoId].splice(index, 1);
      return { ok: true, state: next };
    }
  }
  return { ok: false, state, erro: "produto nao encontrado" };
}

function createGroupProduct(group, index) {
  const id = String(group.id || slugify(group.nome)).trim();
  return {
    id,
    sku: id,
    tipo: "grupo",
    produto_principal: true,
    nome: String(group.nome || "Grupo").trim(),
    secao_id: group.secao,
    grupo_id: id,
    grupo_nome: String(group.nome || "Grupo").trim(),
    produto_pai_id: id,
    produto_pai_nome: String(group.nome || "Grupo").trim(),
    nome_principal: String(group.nome || "Grupo").trim(),
    emoji: String(group.emoji || "").trim(),
    ativo: toBoolean(group.ativo, true),
    ordem: Number(group.ordem ?? index),
    criado_em: new Date().toISOString(),
  };
}

function createSkuProduct(product, index) {
  const group = SEED_GROUPS.find((item) => item.secao === product.secao && item.id === product.grupo);
  return {
    id: product.id,
    sku: product.id,
    tipo: "sku",
    produto_principal: false,
    nome: product.nome,
    descricao: product.descricao,
    secao_id: product.secao,
    grupo_id: product.grupo,
    grupo_nome: group?.nome || product.grupo,
    produto_pai_id: product.grupo,
    produto_pai_nome: group?.nome || product.grupo,
    nome_principal: group?.nome || product.grupo,
    preco: product.precoCents / 100,
    preco_normal: product.precoCents / 100,
    precoCents: product.precoCents,
    estoque: product.estoque,
    estoque_pronta_entrega: product.estoque,
    unidadeVenda: product.unidade,
    unidadeMedida: product.unidade,
    imagem: product.imagem,
    imagem_url: product.imagem,
    ativo: true,
    ordem: index,
    criado_em: new Date().toISOString(),
  };
}

function normalizeSection(section = {}) {
  const nome = String(section.nome || section.name || section.id || "Secao").trim();
  return {
    id: String(section.id || slugify(nome)).trim(),
    nome,
    emoji: String(section.emoji || "").trim(),
    ativo: toBoolean(section.ativo ?? section.active, true),
    ordem: Number(section.ordem ?? 0),
    iconImage: section.iconImage || "",
  };
}

function countProductsInGroup(state, secaoId, groupId) {
  return (state.produtos?.[secaoId] || []).filter((item) => !isGroupProduct(item) && String(item.grupo_id || "") === groupId).length;
}

function ensureDefaultGroup(state, secaoId) {
  const existingGroup = listGroupsFromState(state).find((group) => group.secao_id === secaoId);
  if (existingGroup) return existingGroup.id;
  const next = upsertGroupInState(state, { secao_id: secaoId, id: `${secaoId}-geral`, nome: "Geral" });
  state.produtos = next.produtos;
  return `${secaoId}-geral`;
}

function isGroupProduct(product = {}) {
  return product.produto_principal === true || product.tipo === "grupo" || product.tipo === "principal";
}

function priceCentsFromProduct(product = {}) {
  if (Number.isFinite(Number(product.precoCents))) return Math.round(Number(product.precoCents));
  if (Number.isFinite(Number(product.priceCents))) return Math.round(Number(product.priceCents));
  return Math.round(Number(product.preco_normal ?? product.preco ?? 0) * 100);
}

function centsFromPayload(payload = {}) {
  const cents = payload.precoCents ?? payload.priceCents;
  if (Number.isFinite(Number(cents))) return Math.max(0, Math.round(Number(cents)));
  return Math.max(0, Math.round(Number(payload.preco ?? payload.price ?? payload.preco_normal ?? 0) * 100));
}

function sortByOrderAndName(a, b) {
  return Number(a.ordem || 0) - Number(b.ordem || 0) || String(a.nome || "").localeCompare(String(b.nome || ""));
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "0", "nao", "não", "off"].includes(String(value).toLowerCase());
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
