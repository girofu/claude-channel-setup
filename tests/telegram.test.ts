import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateTelegramToken } from "../src/channels/telegram";

describe("Telegram channel", () => {
  describe("validateTelegramToken", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("token 有效時回傳 bot 資訊", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            id: 123456789,
            is_bot: true,
            first_name: "MyClaude",
            username: "my_claude_bot",
          },
        }),
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

      const result = await validateTelegramToken("123:ABC-DEF");

      expect(result).toEqual({
        valid: true,
        bot: {
          id: 123456789,
          firstName: "MyClaude",
          username: "my_claude_bot",
        },
      });
      expect(fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bot123:ABC-DEF/getMe",
      );
    });

    it("token 無效時回傳錯誤（HTTP 失敗）", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

      const result = await validateTelegramToken("bad-token");

      expect(result).toEqual({
        valid: false,
        error: "Token 無效 (401 Unauthorized)",
      });
    });

    it("Telegram API 回傳 ok: false 時回傳錯誤", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          ok: false,
          description: "Not Found",
        }),
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

      const result = await validateTelegramToken("bad-token");

      expect(result).toEqual({
        valid: false,
        error: "Telegram API 錯誤: Not Found",
      });
    });

    it("網路錯誤時回傳錯誤", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      const result = await validateTelegramToken("any-token");

      expect(result).toEqual({
        valid: false,
        error: "無法連線到 Telegram API: Network error",
      });
    });
  });
});
