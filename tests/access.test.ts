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

describe("Access Config 管理", () => {
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
    it("檔案不存在時回傳預設設定", () => {
      const config = loadAccessConfig("discord", tmpDir);
      expect(config).toEqual({
        dmPolicy: "pairing",
        allowFrom: [],
        groups: {},
        pending: {},
      });
    });

    it("讀取已存在的 access.json", () => {
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
    it("寫入 access.json", () => {
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

    it("目錄不存在時自動建立", () => {
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
    it("新增 group 到 access config", () => {
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

    it("新增 group 帶 allowFrom", () => {
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

    it("覆蓋已存在的 group 設定", () => {
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

    it("不影響其他 group", () => {
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
    it("移除指定 group", () => {
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

    it("移除不存在的 group 不拋錯", () => {
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
    it("列出所有 group", () => {
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

    it("沒有 group 時回傳空陣列", () => {
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
    it("設定 dmPolicy", () => {
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
    it("新增 user 到 allowFrom", () => {
      const config: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["user1"],
        groups: {},
        pending: {},
      };

      const updated = addAllowedUser(config, "user2");
      expect(updated.allowFrom).toEqual(["user1", "user2"]);
    });

    it("不重複新增相同 user", () => {
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

  describe("整合：load → modify → save", () => {
    it("完整流程：讀取 → 新增 group → 儲存 → 再讀取", () => {
      // 初始寫入
      const initial: AccessConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["my-user-id"],
        groups: {},
        pending: {},
      };
      saveAccessConfig("discord", initial, tmpDir);

      // 讀取 → 修改 → 儲存
      let config = loadAccessConfig("discord", tmpDir);
      config = addGroup(config, "channel-789", {
        requireMention: true,
        allowFrom: ["my-user-id"],
      });
      saveAccessConfig("discord", config, tmpDir);

      // 再讀取驗證
      const reloaded = loadAccessConfig("discord", tmpDir);
      expect(reloaded.groups["channel-789"]).toEqual({
        requireMention: true,
        allowFrom: ["my-user-id"],
      });
      expect(reloaded.allowFrom).toEqual(["my-user-id"]);
    });
  });
});
