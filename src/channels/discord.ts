// Claude Code Discord channel setup module

/** Required Discord bot permissions (bigint) */
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

/** Validate bot token via the Discord API */
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
        error: `Invalid token (${response.status} ${response.statusText})`,
      };
    }

    const data = (await response.json()) as DiscordBotInfo;
    return {
      valid: true,
      bot: { id: data.id, username: data.username, discriminator: data.discriminator },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Unable to connect to Discord API: ${message}` };
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
  parent_id?: string | null;
}

export interface DiscordChannelWithCategory extends DiscordChannel {
  categoryName: string | null;
}

/** Fetch the list of guilds the bot has joined */
export async function fetchBotGuilds(token: string): Promise<DiscordGuild[]> {
  const response = await fetch(
    "https://discord.com/api/v10/users/@me/guilds",
    { headers: { Authorization: `Bot ${token}` } },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch guild list (${response.status} ${response.statusText})`,
    );
  }

  return (await response.json()) as DiscordGuild[];
}

/** Fetch text channels in a guild (filters out voice, category, etc.) */
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
      `Failed to fetch channel list (${response.status} ${response.statusText})`,
    );
  }

  const channels = (await response.json()) as DiscordChannel[];
  // type 0 = GUILD_TEXT
  return channels.filter((ch) => ch.type === 0);
}

/** Fetch text channels in a guild, including their parent category name */
export async function fetchGuildChannelsWithCategories(
  token: string,
  guildId: string,
): Promise<DiscordChannelWithCategory[]> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/channels`,
    { headers: { Authorization: `Bot ${token}` } },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch channel list (${response.status} ${response.statusText})`,
    );
  }

  const channels = (await response.json()) as DiscordChannel[];

  // Build category id -> name mapping (type 4 = GUILD_CATEGORY)
  const categoryMap = new Map<string, string>();
  for (const ch of channels) {
    if (ch.type === 4) {
      categoryMap.set(ch.id, ch.name);
    }
  }

  // Return text channels (type 0) with category name attached
  return channels
    .filter((ch) => ch.type === 0)
    .map((ch) => ({
      ...ch,
      categoryName: ch.parent_id ? (categoryMap.get(ch.parent_id) ?? null) : null,
    }));
}

/** Generate an OAuth2 invite URL with the required permissions */
export function generateInviteUrl(clientId: string): string {
  if (!clientId) {
    throw new Error("client_id must not be empty");
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
