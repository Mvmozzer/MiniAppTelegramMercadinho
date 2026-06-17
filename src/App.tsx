import { useEffect, useMemo, useState } from "react";
import { Catalog } from "./components/Catalog";
import { Checkout } from "./components/Checkout";
import { OrderSuccess } from "./components/OrderSuccess";
import { catalog } from "./data/catalog";
import { createPixCheckout, fetchPublicCatalog } from "./lib/api";
import {
  addItemToCart,
  createEmptyCart,
  decrementItem,
  incrementItem,
  selectCartSummary,
} from "./lib/cart";
import { createCheckoutPayload } from "./lib/order";
import { sendTelegramOrder } from "./lib/telegramWebApp";
import type { Cart, Category, CheckoutPayload, PixCheckoutResponse, Product } from "./types";
import "./styles.css";

type Screen = "catalog" | "checkout" | "success";
type ConfirmedOrder = CheckoutPayload & { pix?: PixCheckoutResponse["pix"]; status?: string };
const officialPanelUrl = import.meta.env.VITE_PANEL_URL || "http://127.0.0.1:8787/admin";

export default function App() {
  if (window.location.pathname.startsWith("/painel")) {
    return <OfficialPanelRedirect />;
  }

  return <CustomerMiniApp />;
}

function OfficialPanelRedirect() {
  useEffect(() => {
    if (import.meta.env.MODE !== "test") {
      window.location.replace(officialPanelUrl);
    }
  }, []);

  return (
    <main className="screen official-panel-screen">
      <section className="success-card">
        <p className="greeting">Mercadinho M&J</p>
        <h1>Painel oficial</h1>
        <p>O painel de controle fica no sistema oficial do bot-mercearia, com todas as funcoes administrativas.</p>
        <a className="primary-button" href={officialPanelUrl}>
          Abrir painel oficial
        </a>
      </section>
    </main>
  );
}

function CustomerMiniApp() {
  const [screen, setScreen] = useState<Screen>("catalog");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(catalog);
  const [cart, setCart] = useState<Cart>(() => createEmptyCart());
  const [selectedCategory, setSelectedCategory] = useState<Category | "Todos">("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  const cartSummary = useMemo(
    () => selectCartSummary(cart, { deliveryFeeCents: 0 }),
    [cart],
  );

  useEffect(() => {
    let mounted = true;

    fetchPublicCatalog()
      .then((products) => {
        if (mounted && products.length > 0) {
          setCatalogProducts(products);
        }
      })
      .catch(() => {
        if (mounted) {
          setCatalogProducts(catalog);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return catalogProducts.filter((product) => {
      const categoryMatch = selectedCategory === "Todos" || product.category === selectedCategory;
      const searchMatch = !term || product.name.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });
  }, [catalogProducts, searchTerm, selectedCategory]);

  function handleAddProduct(product: Product) {
    setCart((current) => addItemToCart(current, product));
  }

  async function handlePay() {
    setIsPaying(true);
    setPaymentError("");

    const payload = createCheckoutPayload(cart);

    try {
      const checkout = await createPixCheckout(payload);
      const orderId = checkout.order?.id || payload.orderId;
      const pixOrder = {
        ...payload,
        orderId,
        status: checkout.order?.status,
        pix: checkout.pix,
      };
      const result = sendTelegramOrder({
        ...pixOrder,
        paymentMethod: "pix_estatico",
      });

      if (result.status !== "sent") {
        setPaymentError("Nao foi possivel enviar o pedido para o Telegram.");
        return;
      }

      setConfirmedOrder(pixOrder);
      setScreen("success");
    } catch {
      setPaymentError("Nao foi possivel criar o pedido Pix. Tente novamente.");
    } finally {
      setIsPaying(false);
    }
  }

  if (screen === "checkout") {
    return (
      <Checkout
        cart={cart}
        summary={cartSummary}
        isPaying={isPaying}
        error={paymentError}
        onBack={() => setScreen("catalog")}
        onIncrement={(productId) => setCart((current) => incrementItem(current, productId))}
        onDecrement={(productId) => setCart((current) => decrementItem(current, productId))}
        onPay={handlePay}
      />
    );
  }

  if (screen === "success" && confirmedOrder) {
    return (
      <OrderSuccess
        order={confirmedOrder}
        onNewOrder={() => {
          setConfirmedOrder(null);
          setCart(createEmptyCart());
          setScreen("catalog");
        }}
      />
    );
  }

  return (
    <Catalog
      products={filteredProducts}
      allProducts={catalogProducts}
      selectedCategory={selectedCategory}
      searchTerm={searchTerm}
      cartSummary={cartSummary}
      quantities={Object.fromEntries(
        Object.entries(cart.items).map(([productId, line]) => [productId, line.quantity]),
      )}
      onCategoryChange={setSelectedCategory}
      onSearchChange={setSearchTerm}
      onAddProduct={handleAddProduct}
      onDecrementProduct={(productId) => setCart((current) => decrementItem(current, productId))}
      onOpenCheckout={() => setScreen("checkout")}
    />
  );
}
