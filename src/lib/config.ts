// Claude Code Channel 設定檔管理

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/** 取得 channel 設定目錄路徑 */
export function getChannelConfigDir(
  channel: string,
  baseDir?: string,
): string {
  const base = baseDir ?? path.join(os.homedir(), ".claude");
  return path.join(base, "channels", channel);
}

/** 將 token 儲存到 channel 的 .env 檔案 */
export function saveChannelToken(
  channel: string,
  key: string,
  token: string,
  baseDir?: string,
): void {
  const dir = getChannelConfigDir(channel, baseDir);
  fs.mkdirSync(dir, { recursive: true });
  const envPath = path.join(dir, ".env");
  fs.writeFileSync(envPath, `${key}=${token}\n`, "utf-8");
}

/** 從 channel 的 .env 檔案讀取 token */
export function loadChannelToken(
  channel: string,
  key: string,
  baseDir?: string,
): string | null {
  const dir = getChannelConfigDir(channel, baseDir);
  const envPath = path.join(dir, ".env");

  if (!fs.existsSync(envPath)) {
    return null;
  }

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const eqIndex = line.indexOf("=");
    if (eqIndex !== -1) {
      const k = line.slice(0, eqIndex);
      const v = line.slice(eqIndex + 1);
      if (k === key) return v;
    }
  }

  return null;
}
