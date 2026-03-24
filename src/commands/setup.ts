// 主設定流程

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
      "貼上你的 Discord Bot Token（從 Developer Portal 取得）:",
    prerequisites: [
      "在 Discord Developer Portal (https://discord.com/developers/applications) 建立一個新的 Application",
      '在 Bot 設定中啟用 "Message Content Intent"',
      "複製 Bot Token（點擊 Reset Token）",
    ],
  },
  telegram: {
    displayName: "Telegram",
    tokenEnvKey: "TELEGRAM_BOT_TOKEN",
    tokenPrompt:
      "貼上你的 Telegram Bot Token（從 BotFather 取得）:",
    prerequisites: [
      "在 Telegram 開啟 BotFather (https://t.me/BotFather)，發送 /newbot 建立新 bot",
      "設定 bot 的顯示名稱和 username（需以 bot 結尾）",
      "複製 BotFather 回傳的 Token",
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
