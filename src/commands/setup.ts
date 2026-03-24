// Main setup flow

export const SUPPORTED_CHANNELS = ["discord", "telegram"] as const;
export type ChannelType = (typeof SUPPORTED_CHANNELS)[number];

const CHANNEL_CONFIG: Record<
  ChannelType,
  {
    displayName: string;
    tokenEnvKey: string;
    tokenPrompt: string;
    prerequisites: string[];
  }
> = {
  discord: {
    displayName: "Discord",
    tokenEnvKey: "DISCORD_BOT_TOKEN",
    tokenPrompt:
      "Paste your Discord Bot Token (from Developer Portal):",
    prerequisites: [
      "Create a new Application at Discord Developer Portal (https://discord.com/developers/applications)",
      'Enable "Message Content Intent" in Bot settings',
      "Copy the Bot Token (click Reset Token)",
    ],
  },
  telegram: {
    displayName: "Telegram",
    tokenEnvKey: "TELEGRAM_BOT_TOKEN",
    tokenPrompt:
      "Paste your Telegram Bot Token (from BotFather):",
    prerequisites: [
      "Open BotFather in Telegram (https://t.me/BotFather) and send /newbot to create a new bot",
      "Set the bot display name and username (must end with 'bot')",
      "Copy the Token provided by BotFather",
    ],
  },
};

export function getChannelDisplayName(channel: ChannelType): string {
  return CHANNEL_CONFIG[channel].displayName;
}

export function getTokenEnvKey(channel: ChannelType): string {
  return CHANNEL_CONFIG[channel].tokenEnvKey;
}

export function getTokenPromptMessage(channel: ChannelType): string {
  return CHANNEL_CONFIG[channel].tokenPrompt;
}

export function getPrerequisiteSteps(channel: ChannelType): string[] {
  return CHANNEL_CONFIG[channel].prerequisites;
}
