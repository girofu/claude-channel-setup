import { describe, it, expect } from "vitest";
import {
  type ChannelType,
  SUPPORTED_CHANNELS,
  getChannelDisplayName,
  getTokenEnvKey,
  getTokenPromptMessage,
  getPrerequisiteSteps,
} from "../src/commands/setup";

describe("Setup 流程", () => {
  describe("SUPPORTED_CHANNELS", () => {
    it("支援 discord 和 telegram", () => {
      expect(SUPPORTED_CHANNELS).toContain("discord");
      expect(SUPPORTED_CHANNELS).toContain("telegram");
    });
  });

  describe("getChannelDisplayName", () => {
    it("回傳 channel 的顯示名稱", () => {
      expect(getChannelDisplayName("discord")).toBe("Discord");
      expect(getChannelDisplayName("telegram")).toBe("Telegram");
    });
  });

  describe("getTokenEnvKey", () => {
    it("回傳 channel 對應的 env key", () => {
      expect(getTokenEnvKey("discord")).toBe("DISCORD_BOT_TOKEN");
      expect(getTokenEnvKey("telegram")).toBe("TELEGRAM_BOT_TOKEN");
    });
  });

  describe("getTokenPromptMessage", () => {
    it("discord 提示訊息包含 Developer Portal", () => {
      const msg = getTokenPromptMessage("discord");
      expect(msg).toContain("Developer Portal");
    });

    it("telegram 提示訊息包含 BotFather", () => {
      const msg = getTokenPromptMessage("telegram");
      expect(msg).toContain("BotFather");
    });
  });

  describe("getPrerequisiteSteps", () => {
    it("discord 先決條件包含建立 bot 和啟用 Message Content Intent", () => {
      const steps = getPrerequisiteSteps("discord");
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.some((s) => s.includes("Developer Portal"))).toBe(true);
      expect(steps.some((s) => s.includes("Message Content Intent"))).toBe(true);
    });

    it("telegram 先決條件包含 BotFather", () => {
      const steps = getPrerequisiteSteps("telegram");
      expect(steps.length).toBeGreaterThanOrEqual(1);
      expect(steps.some((s) => s.includes("BotFather"))).toBe(true);
    });
  });
});
