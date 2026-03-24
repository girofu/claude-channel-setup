import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  getProfileDir,
  listProfiles,
  saveProfileConfig,
  loadProfileConfig,
  getProfileLaunchEnv,
  type ProfileConfig,
} from "../src/lib/profile";

describe("Profile management (multi-bot support)", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-profile-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("getProfileDir", () => {
    it("returns the default channel path when no profile is set", () => {
      const dir = getProfileDir("discord", undefined, tmpDir);
      expect(dir).toBe(path.join(tmpDir, "channels", "discord"));
    });

    it("returns a discord-<profile> path when profile is set", () => {
      const dir = getProfileDir("discord", "backend", tmpDir);
      expect(dir).toBe(path.join(tmpDir, "channels", "discord-backend"));
    });

    it("returns the correct path for a telegram profile", () => {
      const dir = getProfileDir("telegram", "ops", tmpDir);
      expect(dir).toBe(path.join(tmpDir, "channels", "telegram-ops"));
    });
  });

  describe("saveProfileConfig", () => {
    it("saves token and STATE_DIR to .env", () => {
      const profileDir = getProfileDir("discord", "backend", tmpDir);
      saveProfileConfig("discord", "backend", "my-token-123", tmpDir);

      const envPath = path.join(profileDir, ".env");
      const content = fs.readFileSync(envPath, "utf-8");
      expect(content).toContain("DISCORD_BOT_TOKEN=my-token-123");
      expect(content).toContain(`DISCORD_STATE_DIR=${profileDir}`);
    });

    it("does not write STATE_DIR when no profile is set", () => {
      saveProfileConfig("discord", undefined, "my-token-123", tmpDir);

      const envPath = path.join(tmpDir, "channels", "discord", ".env");
      const content = fs.readFileSync(envPath, "utf-8");
      expect(content).toContain("DISCORD_BOT_TOKEN=my-token-123");
      expect(content).not.toContain("DISCORD_STATE_DIR");
    });

    it("uses TELEGRAM_ prefix for telegram profiles", () => {
      const profileDir = getProfileDir("telegram", "group1", tmpDir);
      saveProfileConfig("telegram", "group1", "tg-token", tmpDir);

      const envPath = path.join(profileDir, ".env");
      const content = fs.readFileSync(envPath, "utf-8");
      expect(content).toContain("TELEGRAM_BOT_TOKEN=tg-token");
      expect(content).toContain(`TELEGRAM_STATE_DIR=${profileDir}`);
    });

    it("creates the directory automatically if it does not exist", () => {
      const profileDir = getProfileDir("discord", "new-project", tmpDir);
      saveProfileConfig("discord", "new-project", "token", tmpDir);
      expect(fs.existsSync(profileDir)).toBe(true);
    });
  });

  describe("loadProfileConfig", () => {
    it("reads a saved profile config", () => {
      saveProfileConfig("discord", "backend", "my-token", tmpDir);
      const config = loadProfileConfig("discord", "backend", tmpDir);

      expect(config).not.toBeNull();
      expect(config!.token).toBe("my-token");
      expect(config!.stateDir).toContain("discord-backend");
    });

    it("returns null for a non-existent profile", () => {
      const config = loadProfileConfig("discord", "nonexistent", tmpDir);
      expect(config).toBeNull();
    });

    it("reads the default config when no profile is set", () => {
      saveProfileConfig("discord", undefined, "default-token", tmpDir);
      const config = loadProfileConfig("discord", undefined, tmpDir);

      expect(config).not.toBeNull();
      expect(config!.token).toBe("default-token");
      expect(config!.stateDir).toBeUndefined();
    });
  });

  describe("listProfiles", () => {
    it("returns an empty array when no profiles exist", () => {
      const profiles = listProfiles("discord", tmpDir);
      expect(profiles).toEqual([]);
    });

    it("lists all discord profiles", () => {
      saveProfileConfig("discord", undefined, "token-default", tmpDir);
      saveProfileConfig("discord", "backend", "token-backend", tmpDir);
      saveProfileConfig("discord", "frontend", "token-frontend", tmpDir);

      const profiles = listProfiles("discord", tmpDir);
      expect(profiles).toContain("default");
      expect(profiles).toContain("backend");
      expect(profiles).toContain("frontend");
      expect(profiles).toHaveLength(3);
    });

    it("does not include telegram profiles", () => {
      saveProfileConfig("discord", "backend", "token-1", tmpDir);
      saveProfileConfig("telegram", "group1", "token-2", tmpDir);

      const discordProfiles = listProfiles("discord", tmpDir);
      expect(discordProfiles).not.toContain("group1");
    });
  });

  describe("getProfileLaunchEnv", () => {
    it("returns empty string when no profile is set", () => {
      const env = getProfileLaunchEnv("discord", undefined, tmpDir);
      expect(env).toBe("");
    });

    it("returns the STATE_DIR environment variable when profile is set", () => {
      const profileDir = getProfileDir("discord", "backend", tmpDir);
      const env = getProfileLaunchEnv("discord", "backend", tmpDir);
      expect(env).toBe(`DISCORD_STATE_DIR=${profileDir}`);
    });

    it("uses TELEGRAM_STATE_DIR for telegram profiles", () => {
      const profileDir = getProfileDir("telegram", "ops", tmpDir);
      const env = getProfileLaunchEnv("telegram", "ops", tmpDir);
      expect(env).toBe(`TELEGRAM_STATE_DIR=${profileDir}`);
    });
  });
});
