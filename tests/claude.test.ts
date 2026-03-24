import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectClaudeCode,
  getPluginInstallCommands,
  getChannelLaunchCommand,
} from "../src/lib/claude";

describe("Claude Code integration", () => {
  describe("detectClaudeCode", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns true when claude command exists", async () => {
      const mockExec = vi.fn().mockResolvedValue({ stdout: "/usr/local/bin/claude\n" });
      const result = await detectClaudeCode(mockExec);
      expect(result).toBe(true);
    });

    it("returns false when claude command does not exist", async () => {
      const mockExec = vi.fn().mockRejectedValue(new Error("not found"));
      const result = await detectClaudeCode(mockExec);
      expect(result).toBe(false);
    });
  });

  describe("getPluginInstallCommands", () => {
    it("generates discord plugin install commands", () => {
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

    it("generates telegram plugin install commands", () => {
      const cmds = getPluginInstallCommands("telegram");
      expect(cmds.install).toBe(
        "/plugin install telegram@claude-plugins-official",
      );
    });
  });

  describe("getChannelLaunchCommand", () => {
    it("generates a launch command for a single channel", () => {
      const cmd = getChannelLaunchCommand(["discord"]);
      expect(cmd).toBe(
        "claude --channels plugin:discord@claude-plugins-official",
      );
    });

    it("generates a launch command for multiple channels", () => {
      const cmd = getChannelLaunchCommand(["discord", "telegram"]);
      expect(cmd).toBe(
        "claude --channels plugin:discord@claude-plugins-official plugin:telegram@claude-plugins-official",
      );
    });

    it("throws an error for an empty array", () => {
      expect(() => getChannelLaunchCommand([])).toThrow(
        "At least one channel is required",
      );
    });
  });
});
