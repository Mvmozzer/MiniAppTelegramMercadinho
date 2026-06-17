import { describe, expect, it, vi } from "vitest";
import { openTelegramInvoice, sendTelegramOrder } from "./telegramInvoice";

describe("Telegram invoice handoff", () => {
  it("opens a Telegram invoice when the WebApp bridge is available", async () => {
    const openInvoice = vi.fn((invoiceUrl: string, callback: (status: string) => void) => {
      expect(invoiceUrl).toBe("https://t.me/$invoice/demo");
      callback("paid");
    });

    await expect(
      openTelegramInvoice("https://t.me/$invoice/demo", { openInvoice }),
    ).resolves.toEqual({ handledBy: "telegram", status: "paid" });

    expect(openInvoice).toHaveBeenCalledTimes(1);
  });

  it("returns a local mock success when running outside Telegram", async () => {
    await expect(openTelegramInvoice("mock-invoice://local/order-1")).resolves.toEqual({
      handledBy: "local-mock",
      status: "paid",
    });
  });

  it("sends checkout data to Telegram when invoice backend is unavailable", () => {
    let parsedData: { type?: string; payload?: { orderId?: string } } = {};
    const sendData = vi.fn((data: string) => {
      parsedData = JSON.parse(data);
    });
    const close = vi.fn();

    expect(sendTelegramOrder({ orderId: "MJ-TESTE-5", lines: [] }, { sendData, close })).toEqual({
      handledBy: "telegram-send-data",
      status: "sent",
    });
    expect(parsedData).toMatchObject({
      type: "mercadinho_checkout",
      payload: { orderId: "MJ-TESTE-5" },
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});