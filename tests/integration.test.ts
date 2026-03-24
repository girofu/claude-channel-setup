import { describe, it, expect } from "vitest";
import { validateDiscordToken, generateInviteUrl } from "../src/channels/discord";
import { validateTelegramToken } from "../src/channels/telegram";
import { saveChannelToken, loadChannelToken } from "../src/lib/config";
import { getChannelLaunchCommand } from "../src/lib/claude";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("Integration test: Discord real API", () => {
  it("returns 401 for invalid token against real Discord API", async () => {
    const result = await validateDiscordToken("invalid-token-12345");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("401");
    }
  }, 10000);

  it("returns an error for empty token against real Discord API", async () => {
    const result = await validateDiscordToken("");
    expect(result.valid).toBe(false);
  }, 10000);

  it("generates a valid and parseable invite URL", () => {
    const url = generateInviteUrl("1234567890");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("discord.com");
    expect(parsed.pathname).toBe("/oauth2/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("1234567890");
    expect(parsed.searchParams.get("scope")).toBe("bot");
    // Verify the permission integer is correct
    const perms = BigInt(parsed.searchParams.get("permissions")!);
    expect(perms).toBe(274878008384n);
  });
});

describe("Integration test: Telegram real API", () => {
  it("returns an error for invalid token against real Telegram API", async () => {
    const result = await validateTelegramToken("000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/401|404|Invalid|error|Unable to connect/i);
    }
  }, 10000);

  it("returns an error for malformed token", async () => {
    const result = await validateTelegramToken("not-a-real-token");
    expect(result.valid).toBe(false);
  }, 10000);
});

describe("Integration test: Config with real filesystem", () => {
  it("completes a full save + load cycle", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "integration-test-"));

    try {
      // Discord token
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "disc-token-abc", tmpDir);
      const discToken = loadChannelToken("discord", "DISCORD_BOT_TOKEN", tmpDir);
      expect(discToken).toBe("disc-token-abc");

      // Telegram token
      saveChannelToken("telegram", "TELEGRAM_BOT_TOKEN", "tg-token-xyz", tmpDir);
      const tgToken = loadChannelToken("telegram", "TELEGRAM_BOT_TOKEN", tmpDir);
      expect(tgToken).toBe("tg-token-xyz");

      // Verify files are readable
      const discEnv = fs.readFileSync(
        path.join(tmpDir, "channels", "discord", ".env"),
        "utf-8",
      );
      expect(discEnv).toContain("DISCORD_BOT_TOKEN=disc-token-abc");

      const tgEnv = fs.readFileSync(
        path.join(tmpDir, "channels", "telegram", ".env"),
        "utf-8",
      );
      expect(tgEnv).toContain("TELEGRAM_BOT_TOKEN=tg-token-xyz");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("Integration test: Multi-channel command generation", () => {
  it("generates a combined Discord + Telegram command", () => {
    const cmd = getChannelLaunchCommand(["discord", "telegram"]);
    expect(cmd).toContain("plugin:discord@claude-plugins-official");
    expect(cmd).toContain("plugin:telegram@claude-plugins-official");
    expect(cmd.startsWith("claude --channels")).toBe(true);
  });
});
