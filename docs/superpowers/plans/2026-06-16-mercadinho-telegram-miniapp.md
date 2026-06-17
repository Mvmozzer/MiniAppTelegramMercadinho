# Mercadinho Telegram Mini App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Option A Telegram Mini App prototype with catalog, direct product quantity controls, checkout, Telegram invoice handoff, and a minimal backend invoice endpoint.

**Architecture:** React/Vite owns the Mini App UI and local state. Pure TypeScript modules own catalog/cart/order/payment behavior so they can be tested without a browser. Express exposes a production-shaped Telegram invoice endpoint and webhook while allowing local mock fallback.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Express, Telegram Bot API via Node `fetch`.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `.gitignore`

- [x] Add scripts for `dev`, `server`, `dev:full`, `test`, and `build`.
- [x] Configure React/Vite and Vitest with jsdom.

### Task 2: Domain Tests First

**Files:**
- Create: `src/lib/cart.test.ts`
- Create: `src/lib/order.test.ts`
- Create: `src/lib/telegramInvoice.test.ts`

- [ ] Verify cart totals, delivery fee, quantity updates, and empty-cart behavior fail before implementation.
- [x] Verify checkout payload contains only selected menu items and totals.
- [ ] Verify Telegram invoice wrapper calls `openInvoice` when available and returns a mock success outside Telegram.

### Task 3: Domain Implementation

**Files:**
- Create: `src/data/catalog.ts`
- Create: `src/lib/cart.ts`
- Create: `src/lib/order.ts`
- Create: `src/lib/telegramInvoice.ts`
- Create: `src/types.ts`

- [x] Implement catalog data, cart reducer helpers, order totals, and invoice handoff helpers.
- [x] Run `npm test` until the domain tests pass.

### Task 4: UI Implementation

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/components/Catalog.tsx`
- Create: `src/components/Cart.tsx`
- Create: `src/components/Checkout.tsx`
- Create: `src/components/OrderSuccess.tsx`
- Create: `src/styles.css`

- [x] Implement the approved compact Option A UI.
- [ ] Keep app text Brazilian Portuguese and visible controls code-native.
- [x] Add working category, search, direct quantity, checkout, Telegram handoff, and sent states.

### Task 5: Telegram Backend Shape

**Files:**
- Create: `server/index.js`
- Create: `.env.example`
- Create: `README.md`

- [x] Add `POST /api/telegram/create-invoice` that validates catalog prices server-side and calls `createInvoiceLink` when Telegram credentials exist.
- [x] Add local mock invoice response when credentials are absent.
- [x] Add `POST /api/telegram/webhook` handlers for `shipping_query`, `pre_checkout_query`, and `successful_payment`.
- [ ] Document BotFather payment prerequisites and local run commands.

### Task 6: Verification

**Commands:**
- `npm test`
- `npm run build`
- `npm run dev -- --host 127.0.0.1`

- [x] Verify tests pass.
- [ ] Verify production build passes.
- [ ] Open the local app in Browser/IAB.
- [ ] Compare the rendered UI against `docs/design/mercadinho-option-a-flow.png`.
- [ ] Click through catalog, cart, checkout, mock payment, and confirmation.
