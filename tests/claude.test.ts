import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectClaudeCode,
  getPluginInstallCommands,
  getChannelLaunchCommand,
} from "../src/lib/claude";

describe("Claude Code 整合", () => {
  describe("detectClaudeCode", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("claude 指令存在時回傳 true", async () => {
      const mockExec = vi.fn().mockResolvedValue({ stdout: "/usr/local/bin/claude\n" });
      const result = await detectClaudeCode(mockExec);
      expect(result).toBe(true);
    });

    it("claude 指令不存在時回傳 false", async () => {
      const mockExec = vi.fn().mockRejectedValue(new Error("not found"));
      const result = await detectClaudeCode(mockExec);
      expect(result).toBe(false);
    });
  });

  describe("getPluginInstallCommands", () => {
    it("生成 discord plugin 安裝指令", () => {
      const cmds = getPluginInstallCommands("discord");
      expect(cmds).toEqual({
        install: "/plugin install discord@claude-plugins-official",
        marketplaceAdd:
          "/plugin marketplace add anthropics/claude-plugins-official",
        marketplaceUpdate:
          "/plugin marketplace update claude-plugins-official",
        reload: "/reload-plugins",
      });
    });

    it("生成 telegram plugin 安裝指令", () => {
      const cmds = getPluginInstallCommands("telegram");
      expect(cmds.install).toBe(
        "/plugin install telegram@claude-plugins-official",
      );
    });
  });

  describe("getChannelLaunchCommand", () => {
    it("單一 channel 的啟動指令", () => {
      const cmd = getChannelLaunchCommand(["discord"]);
      expect(cmd).toBe(
        "claude --channels plugin:discord@claude-plugins-official",
      );
    });

    it("多個 channel 的啟動指令", () => {
      const cmd = getChannelLaunchCommand(["discord", "telegram"]);
      expect(cmd).toBe(
        "claude --channels plugin:discord@claude-plugins-official plugin:telegram@claude-plugins-official",
      );
    });

    it("空陣列拋出錯誤", () => {
      expect(() => getChannelLaunchCommand([])).toThrow(
        "至少需要一個 channel",
      );
    });
  });
});
