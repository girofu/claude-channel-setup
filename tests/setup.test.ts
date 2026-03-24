import { describe, it, expect } from "vitest";
import {
  type ChannelType,
  SUPPORTED_CHANNELS,
  getChannelDisplayName,
  getTokenEnvKey,
  getTokenPromptMessage,
  getPrerequisiteSteps,
} from "../src/commands/setup";

describe("Setup flow", () => {
  describe("SUPPORTED_CHANNELS", () => {
    it("supports discord and telegram", () => {
      expect(SUPPORTED_CHANNELS).toContain("discord");
      expect(SUPPORTED_CHANNELS).toContain("telegram");
    });
  });

  describe("getChannelDisplayName", () => {
    it("returns the display name for a channel", () => {
      expect(getChannelDisplayName("discord")).toBe("Discord");
      expect(getChannelDisplayName("telegram")).toBe("Telegram");
    });
  });

  describe("getTokenEnvKey", () => {
    it("returns the env key for a channel", () => {
      expect(getTokenEnvKey("discord")).toBe("DISCORD_BOT_TOKEN");
      expect(getTokenEnvKey("telegram")).toBe("TELEGRAM_BOT_TOKEN");
    });
  });

  describe("getTokenPromptMessage", () => {
    it("includes Developer Portal in discord prompt", () => {
      const msg = getTokenPromptMessage("discord");
      expect(msg).toContain("Developer Portal");
    });

    it("includes BotFather in telegram prompt", () => {
      const msg = getTokenPromptMessage("telegram");
      expect(msg).toContain("BotFather");
    });
  });

  describe("getPrerequisiteSteps", () => {
    it("includes creating a bot and enabling Message Content Intent for discord", () => {
      const steps = getPrerequisiteSteps("discord");
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.some((s) => s.includes("Developer Portal"))).toBe(true);
      expect(steps.some((s) => s.includes("Message Content Intent"))).toBe(true);
    });

    it("includes BotFather for telegram", () => {
      const steps = getPrerequisiteSteps("telegram");
      expect(steps.length).toBeGreaterThanOrEqual(1);
      expect(steps.some((s) => s.includes("BotFather"))).toBe(true);
    });
  });
});
