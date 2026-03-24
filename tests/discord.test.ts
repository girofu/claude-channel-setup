import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateDiscordToken,
  generateInviteUrl,
  DISCORD_PERMISSIONS,
} from "../src/channels/discord";

describe("Discord channel", () => {
  describe("DISCORD_PERMISSIONS", () => {
    it("contains all required permissions", () => {
      expect(DISCORD_PERMISSIONS).toEqual({
        VIEW_CHANNELS: 1024n,
        SEND_MESSAGES: 2048n,
        SEND_MESSAGES_IN_THREADS: 274877906944n,
        READ_MESSAGE_HISTORY: 65536n,
        ATTACH_FILES: 32768n,
        ADD_REACTIONS: 64n,
      });
    });

    it("computes the correct permission integer", () => {
      const total = Object.values(DISCORD_PERMISSIONS).reduce(
        (sum, p) => sum + p,
        0n,
      );
      expect(total).toBe(274878008384n);
    });
  });

  describe("validateDiscordToken", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns bot info when token is valid", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: "123456789",
          username: "MyClaude",
          discriminator: "1234",
        }),
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

      const result = await validateDiscordToken("valid-token");

      expect(result).toEqual({
        valid: true,
        bot: { id: "123456789", username: "MyClaude", discriminator: "1234" },
      });
      expect(fetch).toHaveBeenCalledWith(
        "https://discord.com/api/v10/users/@me",
        {
          headers: { Authorization: "Bot valid-token" },
        },
      );
    });

    it("returns an error when token is invalid", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

      const result = await validateDiscordToken("bad-token");

      expect(result).toEqual({
        valid: false,
        error: "Invalid token (401 Unauthorized)",
      });
    });

    it("returns an error on network failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      const result = await validateDiscordToken("any-token");

      expect(result).toEqual({
        valid: false,
        error: "Unable to connect to Discord API: Network error",
      });
    });
  });

  describe("generateInviteUrl", () => {
    it("generates a URL with correct permissions and scope", () => {
      const url = generateInviteUrl("123456789");

      const parsed = new URL(url);
      expect(parsed.origin + parsed.pathname).toBe(
        "https://discord.com/oauth2/authorize",
      );
      expect(parsed.searchParams.get("client_id")).toBe("123456789");
      expect(parsed.searchParams.get("scope")).toBe("bot");
      expect(parsed.searchParams.get("permissions")).toBe("274878008384");
    });

    it("throws an error for empty client_id", () => {
      expect(() => generateInviteUrl("")).toThrow("client_id must not be empty");
    });
  });
});
