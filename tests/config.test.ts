import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveChannelToken, loadChannelToken, getChannelConfigDir } from "../src/lib/config";

describe("Config management", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("getChannelConfigDir", () => {
    it("returns the ~/.claude/channels/<channel> path", () => {
      const dir = getChannelConfigDir("discord", tmpDir);
      expect(dir).toBe(path.join(tmpDir, "channels", "discord"));
    });
  });

  describe("saveChannelToken", () => {
    it("saves the token to a .env file", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "my-token-123", tmpDir);

      const envPath = path.join(tmpDir, "channels", "discord", ".env");
      expect(fs.existsSync(envPath)).toBe(true);
      expect(fs.readFileSync(envPath, "utf-8")).toBe(
        "DISCORD_BOT_TOKEN=my-token-123\n",
      );
    });

    it("creates the directory automatically if it does not exist", () => {
      const customBase = path.join(tmpDir, "nonexistent", ".claude");
      saveChannelToken("telegram", "TELEGRAM_BOT_TOKEN", "tg-token", customBase);

      const envPath = path.join(customBase, "channels", "telegram", ".env");
      expect(fs.existsSync(envPath)).toBe(true);
    });

    it("overwrites an existing .env file", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "old-token", tmpDir);
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "new-token", tmpDir);

      const envPath = path.join(tmpDir, "channels", "discord", ".env");
      expect(fs.readFileSync(envPath, "utf-8")).toBe(
        "DISCORD_BOT_TOKEN=new-token\n",
      );
    });
  });

  describe("loadChannelToken", () => {
    it("reads the token from a .env file", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "my-token", tmpDir);

      const token = loadChannelToken("discord", "DISCORD_BOT_TOKEN", tmpDir);
      expect(token).toBe("my-token");
    });

    it("returns null when the file does not exist", () => {
      const token = loadChannelToken("discord", "DISCORD_BOT_TOKEN", tmpDir);
      expect(token).toBeNull();
    });

    it("returns null when the key does not exist", () => {
      saveChannelToken("discord", "DISCORD_BOT_TOKEN", "my-token", tmpDir);

      const token = loadChannelToken("discord", "OTHER_KEY", tmpDir);
      expect(token).toBeNull();
    });
  });
});
