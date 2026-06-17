import { describe, expect, it, vi } from "vitest";
import { sendTelegramOrder } from "./telegramWebApp";

describe("Telegram Web App handoff", () => {
  it("sends checkout data to Telegram through WebApp.sendData", () => {
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

  it("keeps local browsing usable outside Telegram", () => {
    expect(sendTelegramOrder({ orderId: "MJ-LOCAL-1" })).toEqual({
      handledBy: "local-mock",
      status: "sent",
    });
  });
});
