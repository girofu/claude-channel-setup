import { describe, it, expect } from "vitest";
import { validateDiscordToken, generateInviteUrl } from "../src/channels/discord";
import { validateTelegramToken } from "../src/channels/telegram";
import { saveChannelToken, loadChannelToken } from "../src/lib/config";
import { getChannelLaunchCommand } from "../src/lib/claude";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("整合測試：Discord 真實 API", () => {
  it("無效 token 打真實 Discord API 回傳 401", async () => {
    const result = await validateDiscordToken("invalid-token-12345");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("401");
    }
  }, 10000);

  it("空 token 打真實 Discord API 回傳錯誤", async () => {
    const result = await validateDiscordToken("");
    expect(result.valid).toBe(false);
  }, 10000);

  it("生成的邀請 URL 格式正確且可解析", () => {
    const url = generateInviteUrl("1234567890");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("discord.com");
    expect(parsed.pathname).toBe("/oauth2/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("1234567890");
    expect(parsed.searchParams.get("scope")).toBe("bot");
    // 確認權限 integer 是數字且為正確值
    const perms = BigInt(parsed.searchParams.get("permissions")!);
    expect(perms).toBe(274878008384n);
  });
});

describe("整合測試：Telegram 真實 API", () => {
  it("無效 token 打真實 Telegram API 回傳錯誤", async () => {
    const result = await validateTelegramToken("000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/401|404|無效|錯誤|無法連線/);
    }
  }, 10000);

  it("格式錯誤的 token 回傳錯誤", async () => {
    const result = await validateTelegramToken("not-a-real-token");
    expect(result.valid).toBe(false);
  }, 10000);
});

describe("整合測試：Config 真實檔案系統", () => {
  it("完整的儲存 + 讀取迴圈", () => {
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

      // 確認檔案權限可讀
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

describe("整合測試：多 channel 指令生成", () => {
  it("Discord + Telegram 組合指令", () => {
    const cmd = getChannelLaunchCommand(["discord", "telegram"]);
    expect(cmd).toContain("plugin:discord@claude-plugins-official");
    expect(cmd).toContain("plugin:telegram@claude-plugins-official");
    expect(cmd.startsWith("claude --channels")).toBe(true);
  });
});
