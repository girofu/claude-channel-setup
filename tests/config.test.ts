import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveChannelToken, loadChannelToken, getChannelConfigDir } from "../src/lib/config";

describe("Config 管理", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("getChannelConfigDir", () => {
    it("回傳 ~/.claude/channels/<channel> 路徑", () => {
      const dir = getChannelConfigDir("discord", tmpDir);
      expect(dir).toBe(path.join(tmpDir, "channels", "discord"));
    });
  });

  describe("saveChannelToken", () => {
    it("將 token 存入 .env 檔案", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "my-token-123", tmpDir);

      const envPath = path.join(tmpDir, "channels", "discord", ".env");
      expect(fs.existsSync(envPath)).toBe(true);
      expect(fs.readFileSync(envPath, "utf-8")).toBe(
        "DISCORD_BOT_TOKEN=my-token-123\n",
      );
    });

    it("目錄不存在時自動建立", () => {
      const customBase = path.join(tmpDir, "nonexistent", ".claude");
      saveChannelToken("telegram", "TELEGRAM_BOT_TOKEN", "tg-token", customBase);

      const envPath = path.join(customBase, "channels", "telegram", ".env");
      expect(fs.existsSync(envPath)).toBe(true);
    });

    it("已存在的 .env 會被覆蓋", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "old-token", tmpDir);
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "new-token", tmpDir);

      const envPath = path.join(tmpDir, "channels", "discord", ".env");
      expect(fs.readFileSync(envPath, "utf-8")).toBe(
        "DISCORD_BOT_TOKEN=new-token\n",
      );
    });
  });

  describe("loadChannelToken", () => {
    it("從 .env 檔案讀取 token", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "my-token", tmpDir);

      const token = loadChannelToken("discord", "DISCORD_BOT_TOKEN", tmpDir);
      expect(token).toBe("my-token");
    });

    it("檔案不存在時回傳 null", () => {
      const token = loadChannelToken("discord", "DISCORD_BOT_TOKEN", tmpDir);
      expect(token).toBeNull();
    });

    it("key 不存在時回傳 null", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "my-token", tmpDir);

      const token = loadChannelToken("discord", "OTHER_KEY", tmpDir);
      expect(token).toBeNull();
    });
  });
});
