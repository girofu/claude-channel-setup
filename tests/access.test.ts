import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  loadAccessConfig,
  saveAccessConfig,
  addGroup,
  removeGroup,
  listGroups,
  setDmPolicy,
  addAllowedUser,
  type AccessConfig,
} from "../src/lib/access.js";

describe("Access config management", () => {
  let tmpDir: string;
  let channelDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-access-test-"));
    channelDir = path.join(tmpDir, "channels", "discord");
    fs.mkdirSync(channelDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("loadAccessConfig", () => {
    it("returns default config when file does not exist", () => {
      const config = loadAccessConfig("discord", tmpDir);
      expect(config).toEqual({
        dmPolicy: "pairing",
        allowFrom: [],
        groups: {},
        pending: {},
      });
    });

    it("reads an existing access.json", () => {
      const existing: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["123"],
        groups: { "456": { requireMention: true } },
        pending: {},
      };
      fs.writeFileSync(
        path.join(channelDir, "access.json"),
        JSON.stringify(existing),
      );

      const config = loadAccessConfig("discord", tmpDir);
      expect(config.dmPolicy).toBe("allowlist");
      expect(config.allowFrom).toEqual(["123"]);
      expect(config.groups["456"]).toEqual({ requireMention: true });
    });
  });

  describe("saveAccessConfig", () => {
    it("writes access.json", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["user1"],
        groups: {},
        pending: {},
      };
      saveAccessConfig("discord", config, tmpDir);

      const raw = fs.readFileSync(
        path.join(channelDir, "access.json"),
        "utf-8",
      );
      expect(JSON.parse(raw)).toEqual(config);
    });

    it("creates the directory automatically if it does not exist", () => {
      const newBase = path.join(tmpDir, "new-base");
      const config: AccessConfig = {
        dmPolicy: "pairing",
        allowFrom: [],
        groups: {},
        pending: {},
      };
      saveAccessConfig("discord", config, newBase);

      const filePath = path.join(newBase, "channels", "discord", "access.json");
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe("addGroup", () => {
    it("adds a group to the access config", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: {},
        pending: {},
      };

      const updated = addGroup(config, "channel-123", {
        requireMention: true,
      });

      expect(updated.groups["channel-123"]).toEqual({
        requireMention: true,
      });
    });

    it("adds a group with allowFrom", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: {},
        pending: {},
      };

      const updated = addGroup(config, "channel-456", {
        requireMention: false,
        allowFrom: ["user-a", "user-b"],
      });

      expect(updated.groups["channel-456"]).toEqual({
        requireMention: false,
        allowFrom: ["user-a", "user-b"],
      });
    });

    it("overwrites an existing group config", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: { "ch-1": { requireMention: true } },
        pending: {},
      };

      const updated = addGroup(config, "ch-1", {
        requireMention: false,
      });

      expect(updated.groups["ch-1"].requireMention).toBe(false);
    });

    it("does not affect other groups", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: { "ch-1": { requireMention: true } },
        pending: {},
      };

      const updated = addGroup(config, "ch-2", {
        requireMention: false,
      });

      expect(updated.groups["ch-1"]).toEqual({ requireMention: true });
      expect(updated.groups["ch-2"]).toEqual({ requireMention: false });
    });
  });

  describe("removeGroup", () => {
    it("removes the specified group", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: {
          "ch-1": { requireMention: true },
          "ch-2": { requireMention: false },
        },
        pending: {},
      };

      const updated = removeGroup(config, "ch-1");

      expect(updated.groups["ch-1"]).toBeUndefined();
      expect(updated.groups["ch-2"]).toEqual({ requireMention: false });
    });

    it("does not throw when removing a non-existent group", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: {},
        pending: {},
      };

      expect(() => removeGroup(config, "nonexistent")).not.toThrow();
    });
  });

  describe("listGroups", () => {
    it("lists all groups", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: {
          "ch-1": { requireMention: true },
          "ch-2": { requireMention: false, allowFrom: ["u1"] },
        },
        pending: {},
      };

      const groups = listGroups(config);
      expect(groups).toEqual([
        { channelId: "ch-1", requireMention: true },
        { channelId: "ch-2", requireMention: false, allowFrom: ["u1"] },
      ]);
    });

    it("returns an empty array when there are no groups", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: [],
        groups: {},
        pending: {},
      };

      expect(listGroups(config)).toEqual([]);
    });
  });

  describe("setDmPolicy", () => {
    it("sets the dmPolicy", () => {
      const config: AccessConfig = {
        dmPolicy: "pairing",
        allowFrom: [],
        groups: {},
        pending: {},
      };

      const updated = setDmPolicy(config, "allowlist");
      expect(updated.dmPolicy).toBe("allowlist");
    });
  });

  describe("addAllowedUser", () => {
    it("adds a user to allowFrom", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["user1"],
        groups: {},
        pending: {},
      };

      const updated = addAllowedUser(config, "user2");
      expect(updated.allowFrom).toEqual(["user1", "user2"]);
    });

    it("does not add duplicate users", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["user1"],
        groups: {},
        pending: {},
      };

      const updated = addAllowedUser(config, "user1");
      expect(updated.allowFrom).toEqual(["user1"]);
    });
  });

  describe("Integration: load -> modify -> save", () => {
    it("completes a full flow: load -> add group -> save -> reload", () => {
      // Initial write
      const initial: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["my-user-id"],
        groups: {},
        pending: {},
      };
      saveAccessConfig("discord", initial, tmpDir);

      // Load -> modify -> save
      let config = loadAccessConfig("discord", tmpDir);
      config = addGroup(config, "channel-789", {
        requireMention: true,
        allowFrom: ["my-user-id"],
      });
      saveAccessConfig("discord", config, tmpDir);

      // Reload and verify
      const reloaded = loadAccessConfig("discord", tmpDir);
      expect(reloaded.groups["channel-789"]).toEqual({
        requireMention: true,
        allowFrom: ["my-user-id"],
      });
      expect(reloaded.allowFrom).toEqual(["my-user-id"]);
    });
  });
});
