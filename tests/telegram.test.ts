import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateTelegramToken } from "../src/channels/telegram";

describe("Telegram channel", () => {
  describe("validateTelegramToken", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns bot info when token is valid", async () => {
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

    it("returns an error when token is invalid (HTTP failure)", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

      const result = await validateTelegramToken("bad-token");

      expect(result).toEqual({
        valid: false,
        error: "Invalid token (401 Unauthorized)",
      });
    });

    it("returns an error when Telegram API responds with ok: false", async () => {
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
        error: "Telegram API error: Not Found",
      });
    });

    it("returns an error on network failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      const result = await validateTelegramToken("any-token");

      expect(result).toEqual({
        valid: false,
        error: "Unable to connect to Telegram API: Network error",
      });
    });
  });
});
