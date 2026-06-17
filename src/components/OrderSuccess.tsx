import { CheckCircle2, ReceiptText } from "lucide-react";
import { formatCurrency } from "../lib/format";
import type { CheckoutPayload } from "../types";

interface OrderSuccessProps {
  order: CheckoutPayload;
  onNewOrder: () => void;
}

export function OrderSuccess({ order, onNewOrder }: OrderSuccessProps) {
  return (
    <main className="screen success-screen">
      <section className="success-card">
        <span className="success-icon">
          <CheckCircle2 size={44} />
        </span>
        <p className="greeting">Continue no Telegram</p>
        <h1>Pedido enviado ao Telegram</h1>
        <strong className="order-id">{order.orderId}</strong>
        <p>
          Total de {formatCurrency(order.totalCents)} enviado para a invoice. O Telegram conclui entrega e pagamento.
        </p>
      </section>

      <section className="receipt">
        <h2><ReceiptText size={18} /> Resumo</h2>
        {order.lines.map((line) => (
          <div key={line.productId}>
            <span>{line.quantity}x {line.name}</span>
            <strong>{formatCurrency(line.totalCents)}</strong>
          </div>
        ))}
      </section>

      <button className="primary-button" type="button" onClick={onNewOrder}>
        Acompanhar pedido
      </button>
    </main>
  );
}
