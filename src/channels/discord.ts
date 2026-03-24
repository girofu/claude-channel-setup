// Claude Code Discord Channel 設定模組

/** Discord Bot 所需的權限（bigint） */
export const DISCORD_PERMISSIONS = {
  VIEW_CHANNELS: 1024n,
  SEND_MESSAGES: 2048n,
  SEND_MESSAGES_IN_THREADS: 274877906944n,
  READ_MESSAGE_HISTORY: 65536n,
  ATTACH_FILES: 32768n,
  ADD_REACTIONS: 64n,
} as const;

export interface DiscordBotInfo {
  id: string;
  username: string;
  discriminator: string;
}

export type TokenValidationResult =
  | { valid: true; bot: DiscordBotInfo }
  | { valid: false; error: string };

/** 透過 Discord API 驗證 bot token 是否有效 */
export async function validateDiscordToken(
  token: string,
): Promise<TokenValidationResult> {
  try {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `Token 無效 (${response.status} ${response.statusText})`,
      };
    }

    const data = (await response.json()) as DiscordBotInfo;
    return {
      valid: true,
      bot: { id: data.id, username: data.username, discriminator: data.discriminator },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `無法連線到 Discord API: ${message}` };
  }
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
}

/** 取得 bot 已加入的 guild 列表 */
export async function fetchBotGuilds(token: string): Promise<DiscordGuild[]> {
  const response = await fetch(
    "https://discord.com/api/v10/users/@me/guilds",
    { headers: { Authorization: `Bot ${token}` } },
  );

  if (!response.ok) {
    throw new Error(
      `無法取得 guild 列表 (${response.status} ${response.statusText})`,
    );
  }

  return (await response.json()) as DiscordGuild[];
}

/** 取得 guild 內的 text channel 列表（過濾掉語音、分類等） */
export async function fetchGuildChannels(
  token: string,
  guildId: string,
): Promise<DiscordChannel[]> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/channels`,
    { headers: { Authorization: `Bot ${token}` } },
  );

  if (!response.ok) {
    throw new Error(
      `無法取得 channel 列表 (${response.status} ${response.statusText})`,
    );
  }

  const channels = (await response.json()) as DiscordChannel[];
  // type 0 = GUILD_TEXT
  return channels.filter((ch) => ch.type === 0);
}

/** 生成包含所需權限的 OAuth2 邀請 URL */
export function generateInviteUrl(clientId: string): string {
  if (!clientId) {
    throw new Error("client_id 不可為空");
  }

  const permissions = Object.values(DISCORD_PERMISSIONS).reduce(
    (sum, p) => sum + p,
    0n,
  );

  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "bot");
  url.searchParams.set("permissions", permissions.toString());

  return url.toString();
}
