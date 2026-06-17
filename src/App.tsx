import { useEffect, useMemo, useState } from "react";
import { Catalog } from "./components/Catalog";
import { Checkout } from "./components/Checkout";
import { OrderSuccess } from "./components/OrderSuccess";
import { AdminPanel } from "./components/AdminPanel";
import { catalog } from "./data/catalog";
import { createInvoice, fetchPublicCatalog } from "./lib/api";
import {
  addItemToCart,
  createEmptyCart,
  decrementItem,
  incrementItem,
  selectCartSummary,
} from "./lib/cart";
import { createCheckoutPayload } from "./lib/order";
import { openTelegramInvoice, sendTelegramOrder } from "./lib/telegramInvoice";
import type { Cart, Category, CheckoutPayload, Product } from "./types";
import "./styles.css";

type Screen = "catalog" | "checkout" | "success";

export default function App() {
  if (window.location.pathname.startsWith("/painel")) {
    return <AdminPanel />;
  }

  return <CustomerMiniApp />;
}

function CustomerMiniApp() {
  const [screen, setScreen] = useState<Screen>("catalog");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(catalog);
  const [cart, setCart] = useState<Cart>(() => createEmptyCart());
  const [selectedCategory, setSelectedCategory] = useState<Category | "Todos">("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<CheckoutPayload | null>(null);

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
      const invoice = await createInvoice(payload);
      const result = await openTelegramInvoice(invoice.invoiceUrl);

      if (result.status !== "paid") {
        setPaymentError("Pagamento nao concluido. Tente novamente.");
        return;
      }

      const paidOrder = { ...payload, orderId: invoice.orderId || payload.orderId };
      setConfirmedOrder(paidOrder);
      setScreen("success");
    } catch {
      const result = sendTelegramOrder(payload);
      if (result.status === "sent") {
        setConfirmedOrder(payload);
        setScreen("success");
      } else {
        setPaymentError("Nao foi possivel enviar o pedido para o Telegram.");
      }
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
