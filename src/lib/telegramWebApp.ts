export interface TelegramWebAppBridge {
  sendData?: (data: string) => void;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
}

export interface TelegramOrderHandoffResult {
  handledBy: "telegram-send-data" | "local-mock";
  status: "sent" | "failed";
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppBridge;
    };
  }
}

export function getTelegramWebApp(): TelegramWebAppBridge | undefined {
  return window.Telegram?.WebApp;
}

export function sendTelegramOrder(
  payload: unknown,
  bridge: TelegramWebAppBridge | undefined = getTelegramWebApp(),
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
