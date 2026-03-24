// Claude Code Channel access.json 管理模組

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface GroupPolicy {
  requireMention: boolean;
  allowFrom?: string[];
}

export interface AccessConfig {
  dmPolicy: "pairing" | "allowlist" | "disabled";
  allowFrom: string[];
  groups: Record<string, GroupPolicy>;
  pending: Record<string, unknown>;
}

export interface GroupListEntry {
  channelId: string;
  requireMention: boolean;
  allowFrom?: string[];
}

function getAccessFilePath(channel: string, baseDir?: string): string {
  const base = baseDir ?? path.join(os.homedir(), ".claude");
  return path.join(base, "channels", channel, "access.json");
}

/** 讀取 access.json，檔案不存在時回傳預設設定 */
export function loadAccessConfig(
  channel: string,
  baseDir?: string,
): AccessConfig {
  const filePath = getAccessFilePath(channel, baseDir);

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as AccessConfig;
  } catch {
    return {
      dmPolicy: "pairing",
      allowFrom: [],
      groups: {},
      pending: {},
    };
  }
}

/** 儲存 access.json */
export function saveAccessConfig(
  channel: string,
  config: AccessConfig,
  baseDir?: string,
): void {
  const filePath = getAccessFilePath(channel, baseDir);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}

/** 新增或更新 group（Discord channel） */
export function addGroup(
  config: AccessConfig,
  channelId: string,
  policy: GroupPolicy,
): AccessConfig {
  return {
    ...config,
    groups: {
      ...config.groups,
      [channelId]: policy,
    },
  };
}

/** 移除 group */
export function removeGroup(
  config: AccessConfig,
  channelId: string,
): AccessConfig {
  const { [channelId]: _, ...rest } = config.groups;
  return {
    ...config,
    groups: rest,
  };
}

/** 列出所有 group */
export function listGroups(config: AccessConfig): GroupListEntry[] {
  return Object.entries(config.groups).map(([channelId, policy]) => ({
    channelId,
    requireMention: policy.requireMention,
    ...(policy.allowFrom ? { allowFrom: policy.allowFrom } : {}),
  }));
}

/** 設定 DM 政策 */
export function setDmPolicy(
  config: AccessConfig,
  policy: "pairing" | "allowlist" | "disabled",
): AccessConfig {
  return { ...config, dmPolicy: policy };
}

/** 新增 user 到 DM allowlist */
export function addAllowedUser(
  config: AccessConfig,
  userId: string,
): AccessConfig {
  if (config.allowFrom.includes(userId)) {
    return config;
  }
  return {
    ...config,
    allowFrom: [...config.allowFrom, userId],
  };
}
