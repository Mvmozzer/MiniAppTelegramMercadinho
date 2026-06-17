# Pix, Comprovante e Operacao Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Telegram Mini App create real Pix-static orders, receive payment proofs, and let the panel operate customer, courier, supplier, and employee/admin workflows.

**Architecture:** Keep this React/Vite/Express app as the active surface and port only small operational contracts from `E:\bot-mercearia`. Add pure server operation helpers first, then wire Express endpoints and React panel views to those helpers. Telegram invoice/provider payment is removed from the main checkout path; static Pix plus manual proof review becomes the source of truth.

**Tech Stack:** Express 5, React 19, Vite, TypeScript, Vitest, local JSON state in `data/panel-state.json`.

---

### Task 1: Server Operation Contracts

**Files:**
- Create: `server/operations.js`
- Test: `server/operations.test.js`
- Modify: `server/panelStore.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from "vitest";
import {
  createPixOrderFromCheckout,
  recordPaymentProofInState,
  reviewPaymentProofInState,
} from "./operations.js";
import { createInitialPanelState } from "./panelStore.js";

describe("Pix static order operation", () => {
  it("creates a real Mini App order awaiting proof with server-side price validation", () => {
    const state = createInitialPanelState();
    state.config.pix = {
      recebedor: "Mercadinho M&J",
      chave: "11999999999",
      cidade: "SAO PAULO",
      copiaCola: "000201PIXESTATICOMJ",
    };

    const result = createPixOrderFromCheckout(state, {
      orderId: "MJ-PIX-1",
      currency: "BRL",
      itemCount: 1,
      subtotalCents: 1,
      deliveryFeeCents: 0,
      totalCents: 1,
      lines: [
        {
          productId: "banana-prata",
          name: "Preco adulterado",
          quantity: 2,
          unitPriceCents: 1,
          totalCents: 2,
        },
      ],
    });

    expect(result.order).toMatchObject({
      id: "MJ-PIX-1",
      status: "aguardando_comprovante",
      origem: "telegram-miniapp",
      subtotalCents: 998,
      totalCents: 998,
      pagamento: {
        metodo: "pix_estatico",
        status: "aguardando_comprovante",
        pixCopiaECola: "000201PIXESTATICOMJ",
      },
    });
    expect(result.order.itens[0]).toMatchObject({
      produtoId: "banana-prata",
      nome: "Banana prata",
      qtd: 2,
      precoCents: 499,
      subtotalCents: 998,
    });
  });

  it("stores Telegram photo proof and moves the payment to proof received", () => {
    const created = createPixOrderFromCheckout(createInitialPanelState(), {
      orderId: "MJ-PIX-2",
      currency: "BRL",
      itemCount: 1,
      subtotalCents: 499,
      deliveryFeeCents: 0,
      totalCents: 499,
      lines: [{ productId: "banana-prata", name: "Banana", quantity: 1, unitPriceCents: 499, totalCents: 499 }],
    });

    const result = recordPaymentProofInState(created.state, "MJ-PIX-2", {
      origem: "telegram",
      tipo: "foto",
      fileId: "file_123",
      chatId: "12345",
    });

    expect(result.order.status).toBe("comprovante_recebido");
    expect(result.order.pagamento.status).toBe("comprovante_recebido");
    expect(result.order.comprovantesPagamento[0]).toMatchObject({ fileId: "file_123", origem: "telegram" });
  });

  it("lets the panel approve or reject a received proof", () => {
    const created = createPixOrderFromCheckout(createInitialPanelState(), {
      orderId: "MJ-PIX-3",
      currency: "BRL",
      itemCount: 1,
      subtotalCents: 499,
      deliveryFeeCents: 0,
      totalCents: 499,
      lines: [{ productId: "banana-prata", name: "Banana", quantity: 1, unitPriceCents: 499, totalCents: 499 }],
    });
    const received = recordPaymentProofInState(created.state, "MJ-PIX-3", {
      origem: "miniapp",
      tipo: "texto",
      texto: "comprovante enviado",
    });

    const approved = reviewPaymentProofInState(received.state, "MJ-PIX-3", {
      decision: "approve",
      reviewedBy: "admin",
    });
    const rejected = reviewPaymentProofInState(received.state, "MJ-PIX-3", {
      decision: "reject",
      reviewedBy: "admin",
      motivo: "valor divergente",
    });

    expect(approved.order.status).toBe("preparando");
    expect(approved.order.pagamento.status).toBe("confirmado");
    expect(rejected.order.status).toBe("aguardando_comprovante");
    expect(rejected.order.pagamento.status).toBe("comprovante_recusado");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/operations.test.js`
Expected: FAIL because `server/operations.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `server/operations.js` with pure state functions for Pix order creation, payment proof recording, and proof review. Extend `normalizeState()` in `server/panelStore.js` with `config.pix`, `entregadores`, `entregas`, `fornecedores`, `solicitacoesPrecos`, `usuarios`, and `auditoria`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- server/operations.test.js`
Expected: PASS.

### Task 2: Express Routes and Telegram Webhook

**Files:**
- Modify: `server/index.js`
- Test: `server/http.test.js`

- [ ] **Step 1: Write the failing test**

```js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let app;
let dataFile;

beforeEach(async () => {
  dataFile = path.join(os.tmpdir(), `mercadinho-http-${Date.now()}-${Math.random()}.json`);
  process.env.MERCADINHO_DATA_FILE = dataFile;
  process.env.TELEGRAM_BOT_TOKEN = "";
  ({ app } = await import("./index.js"));
});

afterEach(() => {
  delete process.env.MERCADINHO_DATA_FILE;
  if (dataFile && fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
});

describe("operational HTTP routes", () => {
  it("creates Pix checkout orders for the Mini App", async () => {
    const response = await request(app, "POST", "/api/miniapp/checkout/pix", {
      orderId: "MJ-HTTP-1",
      currency: "BRL",
      itemCount: 1,
      subtotalCents: 1,
      deliveryFeeCents: 0,
      totalCents: 1,
      lines: [{ productId: "banana-prata", name: "Banana", quantity: 1, unitPriceCents: 1, totalCents: 1 }],
    });

    expect(response.status).toBe(200);
    expect(response.body.order.status).toBe("aguardando_comprovante");
    expect(response.body.pix.copiaCola).toBeTruthy();
  });

  it("receives Mini App proof and panel review decisions", async () => {
    await request(app, "POST", "/api/miniapp/checkout/pix", {
      orderId: "MJ-HTTP-2",
      currency: "BRL",
      itemCount: 1,
      subtotalCents: 499,
      deliveryFeeCents: 0,
      totalCents: 499,
      lines: [{ productId: "banana-prata", name: "Banana", quantity: 1, unitPriceCents: 499, totalCents: 499 }],
    });

    const proof = await request(app, "POST", "/api/miniapp/pedidos/MJ-HTTP-2/comprovante", {
      texto: "Pix feito",
    });
    const approved = await request(app, "POST", "/api/admin/orders/MJ-HTTP-2/payment-proof/review", {
      decision: "approve",
    });

    expect(proof.body.order.status).toBe("comprovante_recebido");
    expect(approved.body.order.pagamento.status).toBe("confirmado");
  });
});

function request(app, method, path, body) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", async () => {
      const port = server.address().port;
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await response.json();
      server.close(() => resolve({ status: response.status, body: payload }));
    });
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/http.test.js`
Expected: FAIL because `app` is not exported and the Pix routes do not exist.

- [ ] **Step 3: Write minimal implementation**

Export `app` from `server/index.js`, start listening only outside Vitest, add `POST /api/miniapp/checkout/pix`, `POST /api/miniapp/pedidos/:pedidoId/comprovante`, `POST /api/admin/orders/:id/payment-proof/review`, delivery routes, supplier routes, and Telegram webhook handling for `web_app_data`, photo, and document messages.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- server/http.test.js`
Expected: PASS.

### Task 3: Delivery and Supplier Contracts

**Files:**
- Modify: `server/operations.js`
- Test: `server/operations.test.js`
- Modify: `server/index.js`

- [ ] **Step 1: Write the failing tests**

Add tests that call `upsertCourierInState`, `assignDeliveryInState`, `acceptDeliveryInState`, `updateDeliveryStatusInState`, `upsertSupplierInState`, `createPriceUpdateRequestInState`, and `reviewPriceUpdateRequestInState`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/operations.test.js`
Expected: FAIL because the new functions are not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement courier and supplier pure state functions, then wire matching Express routes: `/api/admin/couriers`, `/api/admin/orders/:id/delivery`, `/api/delivery/accept`, `/api/delivery/status`, `/api/admin/suppliers`, `/api/admin/price-update-requests`, and review endpoints.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- server/operations.test.js`
Expected: PASS.

### Task 4: Mini App Checkout UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/api.ts`
- Modify: `src/components/Checkout.tsx`
- Modify: `src/components/OrderSuccess.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Update the existing customer checkout test so it expects `POST /api/miniapp/checkout/pix`, not `/api/telegram/create-invoice`, and expects success copy that says Pix/comprovante instead of invoice.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because the app still calls the invoice route and displays invoice copy.

- [ ] **Step 3: Write minimal implementation**

Replace `createInvoice()` usage with `createPixCheckout()`. Keep `sendTelegramOrder()` as the Telegram handoff, but send the created `orderId` and Pix metadata. Update checkout/success copy to static Pix and proof.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`
Expected: PASS.

### Task 5: Panel Views

**Files:**
- Modify: `src/components/AdminPanel.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add panel tests that open Pedidos, Entregadores, Fornecedores, and Solicitacoes de preco, then assert the real controls exist instead of `Contrato migrado`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because those areas are currently placeholders or incomplete.

- [ ] **Step 3: Write minimal implementation**

Extend `AdminBootstrap` types, render payment proof actions inside `OrdersView`, add `CouriersView`, `SuppliersView`, and `PriceRequestsView`, and wire them to the new routes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`
Expected: PASS.

### Task 6: Full Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- server/operations.test.js server/http.test.js src/App.test.tsx`
Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Run local server and browser smoke tests**

Run: `node index.js`
Open: `http://127.0.0.1:5173` and `http://127.0.0.1:5173/painel`
Expected: Mini App checkout creates Pix order; panel shows order; Pedidos, Entregadores, Fornecedores, and Solicitacoes de preco render real views.
