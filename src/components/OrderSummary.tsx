import { formatCurrency } from "../lib/format";
import type { CartSummary } from "../types";

export function OrderSummary({
  summary,
  actionLabel,
  onAction,
  disabled,
}: {
  summary: CartSummary;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="summary-panel" aria-label="Resumo do pedido">
      <div>
        <span>Subtotal</span>
        <strong>{formatCurrency(summary.subtotalCents)}</strong>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{formatCurrency(summary.totalCents)}</strong>
      </div>
      <button className="primary-button" type="button" onClick={onAction} disabled={disabled}>
        {actionLabel}
      </button>
    </section>
  );
}
