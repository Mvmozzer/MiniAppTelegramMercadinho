import {
  Activity,
  Archive,
  BadgeDollarSign,
  Barcode,
  Bot,
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  Database,
  FileClock,
  Headphones,
  HeartHandshake,
  LayoutDashboard,
  LayoutList,
  PackageSearch,
  Plug,
  RefreshCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  Truck,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../lib/format";

type PanelMode = "simple" | "advanced";

interface PanelView {
  id: string;
  label: string;
  group: string;
  mode: PanelMode;
  Icon: LucideIcon;
  description: string;
}

const panelViews: PanelView[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    group: "Visao geral",
    mode: "simple",
    Icon: LayoutDashboard,
    description: "Resumo do dia, tarefas pendentes, alertas e atalhos operacionais.",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    group: "Operacao",
    mode: "simple",
    Icon: ClipboardList,
    description: "Lista pedidos ativos, filtros, status, Pix, separacao e entrega.",
  },
  {
    id: "vendas",
    label: "Vendas",
    group: "Operacao",
    mode: "simple",
    Icon: ShoppingCart,
    description: "Venda manual no PDV, caixa, carrinho, pagamento e recibo.",
  },
  {
    id: "arquivados",
    label: "Arquivados",
    group: "Operacao",
    mode: "advanced",
    Icon: Archive,
    description: "Historico de pedidos arquivados e restauracao quando necessario.",
  },
  {
    id: "cadastros",
    label: "Cadastros",
    group: "Cadastros",
    mode: "advanced",
    Icon: LayoutList,
    description: "Atalhos para clientes, secoes, produtos, entregadores e fornecedores.",
  },
  {
    id: "secoesAdmin",
    label: "Secoes",
    group: "Cadastros",
    mode: "advanced",
    Icon: LayoutList,
    description: "Organiza as secoes que aparecem no catalogo do Telegram.",
  },
  {
    id: "produtos",
    label: "Grupos de Produtos",
    group: "Cadastros",
    mode: "simple",
    Icon: PackageSearch,
    description: "Agrupadores como arroz, feijao, bebidas, limpeza e padaria.",
  },
  {
    id: "variacoesSkus",
    label: "Produtos/Opcoes",
    group: "Cadastros",
    mode: "simple",
    Icon: Boxes,
    description: "Itens vendaveis com preco, imagem, promocao, estoque e codigo.",
  },
  {
    id: "clientes",
    label: "Clientes",
    group: "Cadastros",
    mode: "simple",
    Icon: Users,
    description: "Cadastro, endereco, telefone, Chat ID Telegram e preferencias.",
  },
  {
    id: "programaIndicacao",
    label: "Fidelidade",
    group: "Relacionamento",
    mode: "simple",
    Icon: HeartHandshake,
    description: "Pontos, desafios, recompensas, indicacoes e beneficios.",
  },
  {
    id: "atendimento",
    label: "Atendimento",
    group: "Relacionamento",
    mode: "simple",
    Icon: Headphones,
    description: "Conversas humanas com clientes que pediram suporte no Telegram.",
  },
  {
    id: "promocoes",
    label: "Promocoes",
    group: "Relacionamento",
    mode: "simple",
    Icon: Tags,
    description: "Envio de ofertas para clientes e sugestoes de promocao.",
  },
  {
    id: "avaliacoes",
    label: "Avaliacoes",
    group: "Relacionamento",
    mode: "advanced",
    Icon: FileClock,
    description: "Historico de avaliacoes registradas pelos clientes.",
  },
  {
    id: "sugestoes",
    label: "Sugestoes",
    group: "Relacionamento",
    mode: "advanced",
    Icon: FileClock,
    description: "Produtos e melhorias sugeridos pelos clientes.",
  },
  {
    id: "problemas",
    label: "Problemas",
    group: "Relacionamento",
    mode: "advanced",
    Icon: FileClock,
    description: "Problemas reportados nos pedidos e andamento da resolucao.",
  },
  {
    id: "relatorios",
    label: "Relatorios",
    group: "Gestao",
    mode: "simple",
    Icon: ChartNoAxesCombined,
    description: "Vendas, entregadores, produtos, margem e indicadores da loja.",
  },
  {
    id: "estoque",
    label: "Estoque",
    group: "Gestao",
    mode: "simple",
    Icon: Boxes,
    description: "Entrada, movimentacao, lotes, baixo estoque e lista de compras.",
  },
  {
    id: "checkoutConfig",
    label: "Carrinho/Checkout",
    group: "Gestao",
    mode: "advanced",
    Icon: SlidersHorizontal,
    description: "Regras de carrinho, bloqueio por estoque e comportamento do checkout.",
  },
  {
    id: "precificacao",
    label: "Precificacao",
    group: "Gestao",
    mode: "advanced",
    Icon: BadgeDollarSign,
    description: "Sugestao de preco, margem, markup e alerta de venda abaixo do custo.",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    group: "Gestao",
    mode: "advanced",
    Icon: BadgeDollarSign,
    description: "Contas a pagar, pagamentos, despesas e resumo financeiro.",
  },
  {
    id: "motoboys",
    label: "Entregadores",
    group: "Gestao",
    mode: "simple",
    Icon: Truck,
    description: "Cadastro, areas atendidas, disponibilidade, Pix e entregas.",
  },
  {
    id: "fornecedores",
    label: "Fornecedores",
    group: "Gestao",
    mode: "simple",
    Icon: Store,
    description: "Cadastro de fornecedores, vinculo com produtos e lista de compras.",
  },
  {
    id: "solicitacoesPrecos",
    label: "Solicitacoes de preco",
    group: "Gestao",
    mode: "advanced",
    Icon: BadgeDollarSign,
    description: "Aprova, rejeita ou reaplica alteracoes de preco enviadas por fornecedor.",
  },
  {
    id: "freteConfig",
    label: "Frete",
    group: "Administracao",
    mode: "advanced",
    Icon: Truck,
    description: "Taxas, disponibilidade e configuracoes de entrega.",
  },
  {
    id: "telegramConfig",
    label: "Configuracoes do Telegram",
    group: "Administracao",
    mode: "advanced",
    Icon: Bot,
    description: "Textos, botoes, fotos, estoque e comportamento do bot.",
  },
  {
    id: "botClientesComandos",
    label: "Comandos do Bot de Clientes",
    group: "Administracao",
    mode: "advanced",
    Icon: Bot,
    description: "Menu oficial de comandos exibido no Telegram.",
  },
  {
    id: "configGeral",
    label: "Configuracoes Gerais",
    group: "Administracao",
    mode: "simple",
    Icon: Settings,
    description: "Dados da loja, mensagens, Mini App, banners e opcoes principais.",
  },
  {
    id: "alertas",
    label: "Alertas",
    group: "Administracao",
    mode: "advanced",
    Icon: Activity,
    description: "Alertas de operacao, estoque, margem e qualidade do sistema.",
  },
  {
    id: "modulos",
    label: "Modulos",
    group: "Administracao",
    mode: "advanced",
    Icon: SlidersHorizontal,
    description: "Ativa e desativa funcionalidades internas do painel.",
  },
  {
    id: "usuariosPermissoes",
    label: "Usuarios e permissoes",
    group: "Administracao",
    mode: "advanced",
    Icon: ShieldCheck,
    description: "Usuarios administrativos, perfis e permissoes.",
  },
  {
    id: "auditoria",
    label: "Auditoria",
    group: "Administracao",
    mode: "advanced",
    Icon: FileClock,
    description: "Historico de acoes feitas no painel.",
  },
  {
    id: "metricasSistema",
    label: "Metricas",
    group: "Administracao",
    mode: "advanced",
    Icon: Activity,
    description: "Indicadores tecnicos e saude do backend.",
  },
  {
    id: "logsSistema",
    label: "Logs",
    group: "Administracao",
    mode: "advanced",
    Icon: FileClock,
    description: "Logs operacionais e erros recentes.",
  },
  {
    id: "manutencaoBanco",
    label: "Manutencao do Banco",
    group: "Administracao",
    mode: "advanced",
    Icon: Database,
    description: "Plano de manutencao e limpeza controlada de dados.",
  },
  {
    id: "fluxoSistema",
    label: "Fluxo do Sistema",
    group: "Administracao",
    mode: "advanced",
    Icon: Activity,
    description: "Mapa de funcionamento entre bot, painel, Mini App e backend.",
  },
  {
    id: "inteligenciaSistema",
    label: "Inteligencia do Sistema",
    group: "Administracao",
    mode: "advanced",
    Icon: Bot,
    description: "Relatorios gerados e diagnostico inteligente local.",
  },
  {
    id: "viniAtendente",
    label: "Vini - Atendente Virtual",
    group: "Administracao",
    mode: "advanced",
    Icon: Bot,
    description: "Perfil e restricoes do atendente virtual.",
  },
  {
    id: "codigoBarras",
    label: "Codigo de Barras",
    group: "Administracao",
    mode: "advanced",
    Icon: Barcode,
    description: "Consulta e preenchimento por codigo de barras.",
  },
  {
    id: "clientesInteligentes",
    label: "Clientes Inteligentes",
    group: "Administracao",
    mode: "advanced",
    Icon: Users,
    description: "Perfil, preferencias e restricoes por cliente.",
  },
  {
    id: "listaFornecedorInteligente",
    label: "Lista Inteligente para Fornecedor",
    group: "Administracao",
    mode: "advanced",
    Icon: PackageSearch,
    description: "Lista sugerida de reposicao e compras.",
  },
  {
    id: "painelPrecosCompra",
    label: "Painel de Precos de Compra",
    group: "Administracao",
    mode: "advanced",
    Icon: BadgeDollarSign,
    description: "Historico e acompanhamento de custos de compra.",
  },
  {
    id: "pagamentosPainel",
    label: "Pagamentos",
    group: "Administracao",
    mode: "advanced",
    Icon: BadgeDollarSign,
    description: "Visao administrativa de pagamentos.",
  },
  {
    id: "despesasPainel",
    label: "Despesas",
    group: "Administracao",
    mode: "advanced",
    Icon: BadgeDollarSign,
    description: "Controle de despesas recorrentes e avulsas.",
  },
  {
    id: "fiscalPainel",
    label: "Fiscal",
    group: "Administracao",
    mode: "advanced",
    Icon: FileClock,
    description: "Area fiscal preparada para evolucao futura.",
  },
  {
    id: "integracoesPainel",
    label: "Integracoes",
    group: "Administracao",
    mode: "advanced",
    Icon: Plug,
    description: "Status de integracoes externas.",
  },
  {
    id: "importExportPainel",
    label: "Importacao / Exportacao",
    group: "Administracao",
    mode: "advanced",
    Icon: UploadCloud,
    description: "Importacao, exportacao, backup e planilhas.",
  },
  {
    id: "apisExternasPainel",
    label: "APIs externas / Pesquisa de precos",
    group: "Administracao",
    mode: "advanced",
    Icon: Plug,
    description: "Pesquisa externa e conectores de precos.",
  },
];

const quickViews = ["dashboard", "pedidos", "vendas", "clientes", "estoque", "configGeral"];

interface AdminSection {
  id: string;
  nome: string;
  emoji?: string;
  ativo?: boolean;
  ordem?: number;
}

interface AdminGroup {
  id: string;
  secao_id: string;
  secao_nome?: string;
  nome: string;
  emoji?: string;
  ativo?: boolean;
  produtos_vinculados?: number;
}

interface AdminProduct {
  id: string;
  nome: string;
  secao_id: string;
  secao_nome?: string;
  grupo_id: string;
  grupo_nome?: string;
  precoCents: number;
  estoque: number;
  unidade?: string;
  imagem?: string;
  imagem_url?: string;
  descricao?: string;
  ativo?: boolean;
}

interface AdminOrder {
  id: string;
  status: string;
  totalCents?: number;
  itemCount?: number;
  createdAt?: string;
  cliente?: { nome?: string; telefone?: string };
  itens?: Array<{ nome?: string; qtd?: number; subtotalCents?: number }>;
}

interface AdminCustomer {
  id: string;
  nome?: string;
  telefone?: string;
  chatId?: string;
  endereco?: string;
  totalPedidos?: number;
}

interface AdminStats {
  pedidosHoje: number;
  aguardandoAcao: number;
  produtosAtivos: number;
  faturamentoCents: number;
  estoqueBaixo?: number;
  clientes?: number;
}

interface AdminConfig {
  loja: {
    nome: string;
    status: string;
    moeda?: string;
    mensagemStatus?: string;
  };
  secoes: AdminSection[];
  checkout: Record<string, boolean | number | string>;
  telegramLoja: Record<string, boolean | number | string>;
  miniappUi: Record<string, boolean | number | string>;
}

interface AdminBootstrap {
  ok: boolean;
  config: AdminConfig;
  secoes: AdminSection[];
  grupos: AdminGroup[];
  produtos: AdminProduct[];
  catalogo: unknown[];
  pedidos: AdminOrder[];
  arquivados: AdminOrder[];
  clientes: AdminCustomer[];
  stats: AdminStats;
}

interface AdminViewProps {
  data: AdminBootstrap;
  onOpenView: (viewId: string) => void;
  onRequest: (path: string, options?: RequestInit) => Promise<void>;
  onLocalUpdate: (updater: (current: AdminBootstrap) => AdminBootstrap) => void;
  message: string;
}

const fallbackBootstrap: AdminBootstrap = {
  ok: true,
  config: {
    loja: { nome: "Mercadinho M&J", status: "aberta", moeda: "R$" },
    secoes: [
      { id: "hortifruti", nome: "Hortifruti", emoji: "🥬", ativo: true, ordem: 0 },
      { id: "padaria", nome: "Padaria", emoji: "🥐", ativo: true, ordem: 1 },
      { id: "bebidas", nome: "Bebidas", emoji: "🥤", ativo: true, ordem: 2 },
      { id: "mercearia", nome: "Mercearia", emoji: "🛒", ativo: true, ordem: 3 },
      { id: "limpeza", nome: "Limpeza", emoji: "🧼", ativo: true, ordem: 4 },
    ],
    checkout: { bloquear_compra_acima_estoque: true },
    telegramLoja: { mostrar_fotos_produtos: true, mostrar_estoque_disponivel: true },
    miniappUi: {},
  },
  secoes: [],
  grupos: [
    { id: "mercearia-geral", secao_id: "mercearia", secao_nome: "Mercearia", nome: "Geral", ativo: true },
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
fallbackBootstrap.secoes = fallbackBootstrap.config.secoes;

export function AdminPanel() {
  const [panelMode, setPanelMode] = useState<PanelMode>("simple");
  const [activeViewId, setActiveViewId] = useState("dashboard");
  const [data, setData] = useState<AdminBootstrap>(fallbackBootstrap);
  const [message, setMessage] = useState("Carregando dados do painel...");
  const [isLoading, setIsLoading] = useState(true);

  const availableViews = useMemo(
    () => panelViews.filter((view) => panelMode === "advanced" || view.mode === "simple"),
    [panelMode],
  );
  const activeView =
    availableViews.find((view) => view.id === activeViewId) ??
    availableViews.find((view) => view.id === "dashboard") ??
    availableViews[0];
  const groupedViews = groupViews(availableViews);

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function loadAdminData() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/bootstrap");
      if (!response.ok) throw new Error("Falha ao carregar painel");
      const payload = normalizeBootstrap(await response.json());
      setData(payload);
      setMessage("Painel sincronizado com o backend local.");
    } catch {
      setData(fallbackBootstrap);
      setMessage("Backend local indisponivel. O painel esta em modo visual ate o servidor responder.");
    } finally {
      setIsLoading(false);
    }
  }

  async function requestAdmin(path: string, options: RequestInit = {}) {
    try {
      const response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.erro || payload.error || "Operacao nao concluida");
      }
      if (payload.bootstrap) {
        setData(normalizeBootstrap(payload.bootstrap));
      } else {
        await loadAdminData();
      }
      setMessage("Alteracao salva no painel local.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar alteracao.");
      throw error;
    }
  }

  function handlePanelModeChange(mode: PanelMode) {
    setPanelMode(mode);
    if (mode === "simple" && panelViews.find((view) => view.id === activeViewId)?.mode === "advanced") {
      setActiveViewId("dashboard");
    }
  }

  function handleLocalUpdate(updater: (current: AdminBootstrap) => AdminBootstrap) {
    setData((current) => normalizeBootstrap(updater(current)));
  }

  const viewProps: AdminViewProps = {
    data,
    onOpenView: setActiveViewId,
    onRequest: requestAdmin,
    onLocalUpdate: handleLocalUpdate,
    message,
  };

  return (
    <main className="admin-panel-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <strong>{data.config.loja.nome || "Mercadinho M&J"}</strong>
          <span>{isLoading ? "Sincronizando painel" : message}</span>
        </div>

        <div className="admin-top-actions">
          <div className="admin-mode-switch" role="group" aria-label="Modo do painel">
            <button
              className={panelMode === "simple" ? "active" : ""}
              type="button"
              onClick={() => handlePanelModeChange("simple")}
            >
              Simples
            </button>
            <button
              className={panelMode === "advanced" ? "active" : ""}
              type="button"
              onClick={() => handlePanelModeChange("advanced")}
            >
              Avancado
            </button>
          </div>
          <button className="admin-ghost-button" type="button" onClick={loadAdminData}>
            <RefreshCcw size={16} />
            Atualizar
          </button>
          <button className="admin-ghost-button" type="button" onClick={() => setActiveViewId("configGeral")}>
            <Settings size={16} />
            Configuracoes
          </button>
        </div>
      </header>

      <select
        className="admin-mobile-select"
        aria-label="Abrir area do painel"
        value={activeView.id}
        onChange={(event) => setActiveViewId(event.target.value)}
      >
        {availableViews.map((view) => (
          <option key={view.id} value={view.id}>
            {view.label}
          </option>
        ))}
      </select>

      <div className="admin-mobile-quick-nav" aria-label="Atalhos principais do painel">
        {quickViews
          .map((viewId) => availableViews.find((view) => view.id === viewId))
          .filter((view): view is PanelView => Boolean(view))
          .map((view) => (
            <button
              key={view.id}
              className={view.id === activeView.id ? "active" : ""}
              type="button"
              onClick={() => setActiveViewId(view.id)}
            >
              {view.id === "dashboard" ? "Hoje" : view.label}
            </button>
          ))}
      </div>

      <div className="admin-layout">
        <nav className="admin-tabs" aria-label="Navegacao do painel">
          {groupedViews.map((group) => (
            <div className="admin-nav-group" key={group.name}>
              <span>{group.name}</span>
              {group.items.map((view) => (
                <button
                  key={view.id}
                  className={view.id === activeView.id ? "active" : ""}
                  type="button"
                  onClick={() => setActiveViewId(view.id)}
                >
                  <view.Icon size={16} />
                  {view.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <section className="admin-view" aria-label={`Area ${activeView.label}`}>
          {renderAdminView(activeView, viewProps)}
        </section>
      </div>
    </main>
  );
}

function renderAdminView(view: PanelView, props: AdminViewProps) {
  if (view.id === "dashboard") return <DashboardLayout {...props} />;
  if (view.id === "secoesAdmin") return <SectionsView {...props} />;
  if (view.id === "produtos") return <GroupsView {...props} />;
  if (view.id === "variacoesSkus") return <ProductsView {...props} />;
  if (view.id === "pedidos" || view.id === "arquivados") return <OrdersView {...props} archived={view.id === "arquivados"} />;
  if (view.id === "clientes" || view.id === "clientesInteligentes") return <CustomersView {...props} />;
  if (view.id === "estoque") return <StockView {...props} />;
  if (view.id === "configGeral" || view.id === "checkoutConfig" || view.id === "telegramConfig") return <ConfigView {...props} />;
  if (view.id === "vendas") return <ManualSalesView {...props} />;
  return <CompatibilityView view={view} {...props} />;
}

function DashboardLayout({ data, onOpenView }: AdminViewProps) {
  const stats = data.stats;
  return (
    <>
      <div className="admin-section-title">
        <div>
          <h1>Dashboard</h1>
          <p>Resumo operacional usando os mesmos dados de pedidos, produtos e estoque do painel antigo.</p>
        </div>
        <button className="admin-ghost-button" type="button" onClick={() => onOpenView("pedidos")}>
          Abrir pedidos
        </button>
      </div>

      <div className="admin-stats-grid">
        <MetricCard label="Pedidos hoje" value={String(stats.pedidosHoje)} tone="strong" />
        <MetricCard label="Aguardando acao" value={String(stats.aguardandoAcao)} />
        <MetricCard label="Produtos ativos" value={String(stats.produtosAtivos)} />
        <MetricCard label="Faturamento" value={formatCurrency(stats.faturamentoCents)} />
      </div>

      <div className="admin-dashboard-grid">
        <PanelBlock
          title="Operacao"
          actionLabel="Ver pedidos"
          onAction={() => onOpenView("pedidos")}
          items={[
            `${data.pedidos.length} pedido(s) ativos`,
            `${data.arquivados.length} pedido(s) arquivados`,
            `${stats.clientes || data.clientes.length} cliente(s) cadastrados`,
          ]}
        />
        <PanelBlock
          title="Catalogo"
          actionLabel="Produtos"
          onAction={() => onOpenView("variacoesSkus")}
          items={[
            `${data.secoes.length} secoes`,
            `${data.grupos.length} grupos de produtos`,
            `${data.produtos.length} produto(s) vendaveis`,
          ]}
        />
        <PanelBlock
          title="Estoque"
          actionLabel="Ver estoque"
          onAction={() => onOpenView("estoque")}
          items={[
            `${stats.estoqueBaixo || 0} item(ns) com estoque baixo`,
            "Bloqueio por estoque configuravel",
            "Catalogo e invoice usam o mesmo preco",
          ]}
        />
      </div>
    </>
  );
}

function SectionsView({ data, onRequest }: AdminViewProps) {
  const [form, setForm] = useState({ id: "", nome: "", emoji: "", ordem: "0", ativo: true });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onRequest("/api/admin/sections", {
      method: "POST",
      body: JSON.stringify({ ...form, ordem: Number(form.ordem || 0) }),
    });
    setForm({ id: "", nome: "", emoji: "", ordem: String(data.secoes.length + 1), ativo: true });
  }

  return (
    <>
      <SectionTitle title="Secoes" description="Controla as secoes que aparecem no cardapio do Mini App." />
      <div className="admin-work-grid">
        <form className="admin-panel-card admin-form" onSubmit={handleSubmit}>
          <h2>Salvar secao</h2>
          <label>Id<input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="mercearia" /></label>
          <label>Nome<input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></label>
          <label>Emoji<input value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} /></label>
          <label>Ordem<input value={form.ordem} onChange={(event) => setForm({ ...form, ordem: event.target.value })} type="number" /></label>
          <label className="admin-check-row"><input checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} type="checkbox" /> Ativa</label>
          <button type="submit">Salvar secao</button>
        </form>
        <div className="admin-panel-card admin-table-card">
          <h2>Secoes cadastradas</h2>
          <div className="admin-table-list">
            {data.secoes.map((section) => (
              <div className="admin-table-row" key={section.id}>
                <div><strong>{section.emoji} {section.nome}</strong><span>{section.id}</span></div>
                <span>{section.ativo === false ? "Inativa" : "Ativa"}</span>
                <button type="button" onClick={() => setForm({ id: section.id, nome: section.nome, emoji: section.emoji || "", ordem: String(section.ordem || 0), ativo: section.ativo !== false })}>Editar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function GroupsView({ data, onRequest }: AdminViewProps) {
  const firstSection = data.secoes[0]?.id || "";
  const [form, setForm] = useState({ id: "", secao_id: firstSection, nome: "", emoji: "", ativo: true });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onRequest("/api/admin/groups", { method: "POST", body: JSON.stringify(form) });
    setForm({ id: "", secao_id: form.secao_id, nome: "", emoji: "", ativo: true });
  }

  return (
    <>
      <SectionTitle title="Grupos de Produtos" description="Agrupadores do painel antigo, como Arroz, Bebidas ou Padaria." />
      <div className="admin-work-grid">
        <form className="admin-panel-card admin-form" onSubmit={handleSubmit}>
          <h2>Salvar grupo</h2>
          <label>Secao<SelectSection value={form.secao_id} sections={data.secoes} onChange={(secao_id) => setForm({ ...form, secao_id })} /></label>
          <label>Id<input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="arroz" /></label>
          <label>Nome<input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></label>
          <label>Emoji<input value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} /></label>
          <label className="admin-check-row"><input checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} type="checkbox" /> Ativo</label>
          <button type="submit">Salvar grupo</button>
        </form>
        <div className="admin-panel-card admin-table-card">
          <h2>Grupos cadastrados</h2>
          <div className="admin-table-list">
            {data.grupos.map((group) => (
              <div className="admin-table-row" key={`${group.secao_id}:${group.id}`}>
                <div><strong>{group.emoji} {group.nome}</strong><span>{group.secao_nome || group.secao_id}</span></div>
                <span>{group.produtos_vinculados || 0} produto(s)</span>
                <button type="button" onClick={() => setForm({ id: group.id, secao_id: group.secao_id, nome: group.nome, emoji: group.emoji || "", ativo: group.ativo !== false })}>Editar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ProductsView({ data, onRequest }: AdminViewProps) {
  const firstSection = data.secoes[0]?.id || "";
  const firstGroup = data.grupos.find((group) => group.secao_id === firstSection)?.id || data.grupos[0]?.id || "";
  const [form, setForm] = useState({
    id: "",
    secao_id: firstSection,
    grupo_id: firstGroup,
    nome: "",
    preco: "0",
    estoque: "0",
    unidade: "un",
    imagem: "",
    descricao: "",
    ativo: true,
  });
  const groupsForSection = data.grupos.filter((group) => group.secao_id === form.secao_id);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const groupId = form.grupo_id || groupsForSection[0]?.id || data.grupos[0]?.id || "";
    await onRequest("/api/admin/products", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        grupo_id: groupId,
        preco: Number(form.preco || 0),
        estoque: Number(form.estoque || 0),
      }),
    });
    setForm({ ...form, id: "", nome: "", preco: "0", estoque: "0", unidade: "un", imagem: "", descricao: "", grupo_id: groupId });
  }

  function editProduct(product: AdminProduct) {
    setForm({
      id: product.id,
      secao_id: product.secao_id,
      grupo_id: product.grupo_id,
      nome: product.nome,
      preco: String((product.precoCents || 0) / 100),
      estoque: String(product.estoque || 0),
      unidade: product.unidade || "un",
      imagem: product.imagem_url || product.imagem || "",
      descricao: product.descricao || "",
      ativo: product.ativo !== false,
    });
  }

  return (
    <>
      <SectionTitle title="Produtos/Opcoes" description="Itens vendaveis usados pelo cardapio, checkout e invoice do Telegram." />
      <div className="admin-work-grid">
        <form className="admin-panel-card admin-form" onSubmit={handleSubmit}>
          <h2>Salvar produto</h2>
          <label>Secao<SelectSection value={form.secao_id} sections={data.secoes} onChange={(secao_id) => setForm({ ...form, secao_id, grupo_id: data.grupos.find((group) => group.secao_id === secao_id)?.id || "" })} /></label>
          <label>Grupo<select value={form.grupo_id} onChange={(event) => setForm({ ...form, grupo_id: event.target.value })}>{groupsForSection.map((group) => <option key={group.id} value={group.id}>{group.nome}</option>)}</select></label>
          <label>Nome do produto<input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></label>
          <label>Preco<input value={form.preco} onChange={(event) => setForm({ ...form, preco: event.target.value })} inputMode="decimal" /></label>
          <label>Estoque<input value={form.estoque} onChange={(event) => setForm({ ...form, estoque: event.target.value })} type="number" min="0" /></label>
          <label>Unidade<input value={form.unidade} onChange={(event) => setForm({ ...form, unidade: event.target.value })} /></label>
          <label className="full">Imagem<input value={form.imagem} onChange={(event) => setForm({ ...form, imagem: event.target.value })} placeholder="https://..." /></label>
          <label className="full">Descricao<input value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /></label>
          <label className="admin-check-row"><input checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} type="checkbox" /> Ativo no cardapio</label>
          <button type="submit">Salvar produto</button>
        </form>
        <div className="admin-panel-card admin-table-card">
          <h2>Produtos cadastrados</h2>
          <div className="admin-table-list">
            {data.produtos.map((product) => (
              <div className="admin-table-row" key={product.id}>
                <div>
                  <strong>{product.nome}</strong>
                  <span>{product.secao_nome || product.secao_id} / {product.grupo_nome || product.grupo_id}</span>
                </div>
                <span>{formatCurrency(product.precoCents)} · estoque {product.estoque}</span>
                <button type="button" onClick={() => editProduct(product)}>Editar</button>
              </div>
            ))}
            {data.produtos.length === 0 ? <p className="admin-muted">Nenhum produto cadastrado.</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}

function OrdersView({ data, onRequest, archived = false }: AdminViewProps & { archived?: boolean }) {
  const orders = archived ? data.arquivados : data.pedidos;
  async function setStatus(order: AdminOrder, status: string) {
    await onRequest("/pedidos/editar", { method: "POST", body: JSON.stringify({ id: order.id, status }) });
  }
  return (
    <>
      <SectionTitle title={archived ? "Arquivados" : "Pedidos"} description="Pedidos criados pelo checkout do Telegram Mini App." />
      <div className="admin-panel-card admin-table-card">
        <h2>{archived ? "Historico arquivado" : "Pedidos ativos"}</h2>
        <div className="admin-table-list">
          {orders.map((order) => (
            <div className="admin-table-row" key={order.id}>
              <div><strong>{order.id}</strong><span>{order.cliente?.nome || "Cliente Telegram"} · {order.itemCount || order.itens?.length || 0} item(ns)</span></div>
              <span>{order.status} · {formatCurrency(order.totalCents || 0)}</span>
              <div className="admin-row-actions">
                <button type="button" onClick={() => setStatus(order, "pago")}>Pago</button>
                <button type="button" onClick={() => setStatus(order, "preparando")}>Preparar</button>
                <button type="button" onClick={() => onRequest("/arquivar", { method: "POST", body: JSON.stringify({ id: order.id }) })}>Arquivar</button>
              </div>
            </div>
          ))}
          {orders.length === 0 ? <p className="admin-muted">Nenhum pedido nesta lista.</p> : null}
        </div>
      </div>
    </>
  );
}

function CustomersView({ data, onRequest }: AdminViewProps) {
  const [form, setForm] = useState({ id: "", nome: "", telefone: "", chatId: "", endereco: "" });
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onRequest("/clientes/editar", { method: "POST", body: JSON.stringify(form) });
    setForm({ id: "", nome: "", telefone: "", chatId: "", endereco: "" });
  }
  return (
    <>
      <SectionTitle title="Clientes" description="Cadastro simples compativel com o painel antigo e Chat ID Telegram." />
      <div className="admin-work-grid">
        <form className="admin-panel-card admin-form" onSubmit={handleSubmit}>
          <h2>Salvar cliente</h2>
          <label>Nome<input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></label>
          <label>Telefone<input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></label>
          <label>Chat ID Telegram<input value={form.chatId} onChange={(event) => setForm({ ...form, chatId: event.target.value })} /></label>
          <label className="full">Endereco<input value={form.endereco} onChange={(event) => setForm({ ...form, endereco: event.target.value })} /></label>
          <button type="submit">Salvar cliente</button>
        </form>
        <div className="admin-panel-card admin-table-card">
          <h2>Clientes cadastrados</h2>
          <div className="admin-table-list">
            {data.clientes.map((customer) => (
              <div className="admin-table-row" key={customer.id || customer.chatId}>
                <div><strong>{customer.nome || "Cliente"}</strong><span>{customer.telefone || "-"} · {customer.chatId || "sem Chat ID"}</span></div>
                <span>{customer.totalPedidos || 0} pedido(s)</span>
                <button type="button" onClick={() => setForm({ id: customer.id, nome: customer.nome || "", telefone: customer.telefone || "", chatId: customer.chatId || "", endereco: customer.endereco || "" })}>Editar</button>
              </div>
            ))}
            {data.clientes.length === 0 ? <p className="admin-muted">Nenhum cliente cadastrado.</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}

function StockView({ data, onRequest }: AdminViewProps) {
  return (
    <>
      <SectionTitle title="Estoque" description="Ajuste rapido do estoque usado para bloqueio de venda e alerta operacional." />
      <div className="admin-panel-card admin-table-card">
        <h2>Estoque pronta entrega</h2>
        <div className="admin-table-list">
          {data.produtos.map((product) => (
            <div className="admin-table-row" key={product.id}>
              <div><strong>{product.nome}</strong><span>{product.secao_nome || product.secao_id}</span></div>
              <span className={product.estoque <= 3 ? "admin-danger-text" : ""}>{product.estoque} {product.unidade || "un"}</span>
              <div className="admin-row-actions">
                <button type="button" onClick={() => onRequest(`/api/admin/products/${product.id}`, { method: "PUT", body: JSON.stringify({ ...product, estoque: Math.max(0, product.estoque - 1) }) })}>-1</button>
                <button type="button" onClick={() => onRequest(`/api/admin/products/${product.id}`, { method: "PUT", body: JSON.stringify({ ...product, estoque: product.estoque + 1 }) })}>+1</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ConfigView({ data, onRequest }: AdminViewProps) {
  const [form, setForm] = useState(data.config);
  useEffect(() => setForm(data.config), [data.config]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onRequest("/config", { method: "POST", body: JSON.stringify(form) });
  }

  return (
    <>
      <SectionTitle title="Configuracoes Gerais" description="Dados da loja, comportamento do checkout e exibicao do Telegram." />
      <form className="admin-panel-card admin-form wide" onSubmit={handleSubmit}>
        <h2>Loja</h2>
        <label>Nome da loja<input value={form.loja.nome} onChange={(event) => setForm({ ...form, loja: { ...form.loja, nome: event.target.value } })} /></label>
        <label>Status<select value={form.loja.status} onChange={(event) => setForm({ ...form, loja: { ...form.loja, status: event.target.value } })}><option value="aberta">Aberta</option><option value="fechada">Fechada</option><option value="pausada">Pausada</option></select></label>
        <label>Moeda<input value={form.loja.moeda || "R$"} onChange={(event) => setForm({ ...form, loja: { ...form.loja, moeda: event.target.value } })} /></label>
        <label className="admin-check-row"><input checked={Boolean(form.checkout.bloquear_compra_acima_estoque)} onChange={(event) => setForm({ ...form, checkout: { ...form.checkout, bloquear_compra_acima_estoque: event.target.checked } })} type="checkbox" /> Bloquear compra acima do estoque</label>
        <label className="admin-check-row"><input checked={Boolean(form.telegramLoja.mostrar_fotos_produtos)} onChange={(event) => setForm({ ...form, telegramLoja: { ...form.telegramLoja, mostrar_fotos_produtos: event.target.checked } })} type="checkbox" /> Mostrar fotos dos produtos</label>
        <button type="submit">Salvar configuracoes</button>
      </form>
    </>
  );
}

function ManualSalesView({ data, onOpenView }: AdminViewProps) {
  return (
    <>
      <SectionTitle title="Vendas" description="Atalho para acompanhar pedidos e conferir produtos antes de ativar PDV completo." />
      <div className="admin-dashboard-grid">
        <PanelBlock title="Pedidos" actionLabel="Abrir" onAction={() => onOpenView("pedidos")} items={[`${data.pedidos.length} pedido(s) ativos`, "Status editavel no painel", "Arquivamento disponivel"]} />
        <PanelBlock title="Catalogo" actionLabel="Produtos" onAction={() => onOpenView("variacoesSkus")} items={[`${data.produtos.length} produto(s)`, "Precos validados no servidor", "Estoque integrado"]} />
      </div>
    </>
  );
}

function CompatibilityView({ view, data }: AdminViewProps & { view: PanelView }) {
  return (
    <>
      <SectionTitle title={view.label} description={view.description} />
      <div className="admin-panel-card">
        <div className="admin-empty-state">
          <view.Icon size={30} />
          <h2>Contrato migrado</h2>
          <p>
            Esta area foi mantida no menu do painel novo. Os dados principais ja estao disponiveis
            nas rotas locais e a tela especifica pode evoluir sem depender da pasta bot-mercearia.
          </p>
          <span>{data.secoes.length} secoes · {data.produtos.length} produtos · {data.pedidos.length} pedidos</span>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="admin-section-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

function SelectSection({ value, sections, onChange }: { value: string; sections: AdminSection[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {sections.map((section) => (
        <option key={section.id} value={section.id}>
          {section.nome}
        </option>
      ))}
    </select>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: string }) {
  return (
    <article className="admin-metric-card" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function PanelBlock({
  title,
  actionLabel,
  items,
  onAction,
}: {
  title: string;
  actionLabel: string;
  items: string[];
  onAction: () => void;
}) {
  return (
    <article className="admin-panel-card">
      <div className="admin-card-title">
        <h2>{title}</h2>
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      </div>
      <div className="admin-shortcut-list">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </article>
  );
}

function normalizeBootstrap(payload: Partial<AdminBootstrap> | null | undefined): AdminBootstrap {
  const next = {
    ...fallbackBootstrap,
    ...(payload || {}),
    config: {
      ...fallbackBootstrap.config,
      ...(payload?.config || {}),
      loja: { ...fallbackBootstrap.config.loja, ...(payload?.config?.loja || {}) },
      checkout: { ...fallbackBootstrap.config.checkout, ...(payload?.config?.checkout || {}) },
      telegramLoja: { ...fallbackBootstrap.config.telegramLoja, ...(payload?.config?.telegramLoja || {}) },
      miniappUi: { ...fallbackBootstrap.config.miniappUi, ...(payload?.config?.miniappUi || {}) },
    },
  };
  next.secoes = payload?.secoes?.length ? payload.secoes : next.config.secoes;
  next.config.secoes = next.secoes;
  next.grupos = payload?.grupos || [];
  next.produtos = payload?.produtos || [];
  next.pedidos = payload?.pedidos || [];
  next.arquivados = payload?.arquivados || [];
  next.clientes = payload?.clientes || [];
  next.catalogo = payload?.catalogo || [];
  next.stats = { ...fallbackBootstrap.stats, ...(payload?.stats || {}) };
  return next;
}

function groupViews(views: PanelView[]) {
  return views.reduce<Array<{ name: string; items: PanelView[] }>>((groups, view) => {
    const group = groups.find((item) => item.name === view.group);
    if (group) {
      group.items.push(view);
    } else {
      groups.push({ name: view.group, items: [view] });
    }
    return groups;
  }, []);
}
