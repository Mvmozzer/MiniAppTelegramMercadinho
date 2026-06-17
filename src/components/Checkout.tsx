import { ChevronLeft, Minus, Plus, Send } from "lucide-react";
import { getCartLines } from "../lib/cart";
import { formatCurrency } from "../lib/format";
import { OrderSummary } from "./OrderSummary";
import type { Cart, CartSummary } from "../types";

interface CheckoutProps {
  cart: Cart;
  summary: CartSummary;
  isPaying: boolean;
  error: string;
  onBack: () => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onPay: () => void;
}

export function Checkout({
  cart,
  summary,
  isPaying,
  error,
  onBack,
  onIncrement,
  onDecrement,
  onPay,
}: CheckoutProps) {
  const lines = getCartLines(cart);

  return (
    <main className="screen">
      <header className="screen-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Voltar ao cardapio">
          <ChevronLeft size={20} />
        </button>
        <div className="screen-title">
          <p className="greeting">Revise o pedido</p>
          <h1>Checkout</h1>
        </div>
      </header>

      <section className="line-list" aria-label="Itens do checkout">
        {lines.map((line) => (
          <article className="cart-line" key={line.product.id}>
            <img src={line.product.image} alt="" loading="eager" decoding="async" />
            <div className="line-main">
              <h2>{line.product.name}</h2>
              <span>{formatCurrency(line.product.priceCents)} / {line.product.unit}</span>
              <div className="stepper" aria-label={`Quantidade de ${line.product.name}`}>
                <button
                  type="button"
                  onClick={() => onDecrement(line.product.id)}
                  aria-label={`Diminuir ${line.product.name}`}
                >
                  <Minus size={14} />
                </button>
                <strong>{line.quantity}</strong>
                <button
                  type="button"
                  onClick={() => onIncrement(line.product.id)}
                  aria-label={`Adicionar ${line.product.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="line-side">
              <strong>{formatCurrency(line.product.priceCents * line.quantity)}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="checkout-section">
        <div className="payment-row">
          <Send size={18} />
          <div>
            <strong>Entrega e pagamento no Telegram</strong>
            <span>O Telegram conclui entrega e pagamento.</span>
          </div>
        </div>

        {error ? <p className="error-message">{error}</p> : null}
      </section>

      <OrderSummary
        summary={summary}
        actionLabel={isPaying ? "Abrindo Telegram..." : "Finalizar no Telegram"}
        onAction={onPay}
        disabled={isPaying || lines.length === 0}
      />
    </main>
  );
}
