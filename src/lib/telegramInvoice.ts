export type TelegramInvoiceStatus = "paid" | "cancelled" | "failed" | "pending" | string;

export interface TelegramInvoiceBridge {
  openInvoice?: (invoiceUrl: string, callback: (status: TelegramInvoiceStatus) => void) => void;
  sendData?: (data: string) => void;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
}

export interface TelegramInvoiceResult {
  handledBy: "telegram" | "local-mock";
  status: TelegramInvoiceStatus;
}

export interface TelegramOrderHandoffResult {
  handledBy: "telegram-send-data" | "local-mock";
  status: "sent" | "failed";
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramInvoiceBridge;
    };
  }
}

export function getTelegramWebApp(): TelegramInvoiceBridge | undefined {
  return window.Telegram?.WebApp;
}

export function openTelegramInvoice(
  invoiceUrl: string,
  bridge: TelegramInvoiceBridge | undefined = getTelegramWebApp(),
): Promise<TelegramInvoiceResult> {
  if (!bridge?.openInvoice) {
    return Promise.resolve({ handledBy: "local-mock", status: "paid" });
  }

  return new Promise((resolve) => {
    bridge.openInvoice?.(invoiceUrl, (status) => {
      resolve({ handledBy: "telegram", status });
    });
  });
}

export function sendTelegramOrder(
  payload: unknown,
  bridge: TelegramInvoiceBridge | undefined = getTelegramWebApp(),
): TelegramOrderHandoffResult {
  if (!bridge?.sendData) {
    return { handledBy: "local-mock", status: "sent" };
  }

  try {
    const data = JSON.stringify({ type: "mercadinho_checkout", payload });
    if (data.length > 4096) return { handledBy: "telegram-send-data", status: "failed" };

    bridge.sendData(data);
    bridge.close?.();
    return { handledBy: "telegram-send-data", status: "sent" };
  } catch {
    return { handledBy: "telegram-send-data", status: "failed" };
  }
}