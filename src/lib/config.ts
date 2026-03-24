// Claude Code channel configuration management

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/** Get the config directory path for a channel */
export function getChannelConfigDir(
  channel: string,
  baseDir?: string,
): string {
  const base = baseDir ?? path.join(os.homedir(), ".claude");
  return path.join(base, "channels", channel);
}

/** Save a token to the channel's .env file */
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

/** Load a token from the channel's .env file */
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
