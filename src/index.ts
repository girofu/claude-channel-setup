// claude-channel-setup CLI 入口

import { select, input, confirm, password } from "@inquirer/prompts";
import ora from "ora";
import {
  SUPPORTED_CHANNELS,
  type ChannelType,
  getChannelDisplayName,
  getTokenEnvKey,
  getTokenPromptMessage,
  getPrerequisiteSteps,
} from "./commands/setup.js";
import {
  validateDiscordToken,
  generateInviteUrl,
  fetchBotGuilds,
  fetchGuildChannels,
} from "./channels/discord.js";
import { validateTelegramToken } from "./channels/telegram.js";
import { saveChannelToken, loadChannelToken } from "./lib/config.js";
import {
  loadAccessConfig,
  saveAccessConfig,
  addGroup,
  setDmPolicy,
  addAllowedUser,
} from "./lib/access.js";
import { detectClaudeCode, getPluginInstallCommands, getChannelLaunchCommand } from "./lib/claude.js";
import * as ui from "./utils/ui.js";

async function main() {
  console.log(ui.title("Claude Channel Setup"));

  // 1. 偵測 Claude Code
  const spinner = ora("偵測 Claude Code CLI...").start();
  const hasClaude = await detectClaudeCode();
  if (hasClaude) {
    spinner.succeed("Claude Code CLI 已偵測到");
  } else {
    spinner.warn("未偵測到 Claude Code CLI — 設定仍可繼續，但安裝 plugin 需手動執行");
  }

  // 2. 偵測 Bun
  const bunSpinner = ora("偵測 Bun runtime...").start();
  const hasBun = await detectBun();
  if (hasBun) {
    bunSpinner.succeed("Bun runtime 已偵測到");
  } else {
    bunSpinner.fail("未偵測到 Bun — Channel plugins 需要 Bun (https://bun.sh)");
    const shouldContinue = await confirm({
      message: "是否繼續設定？（之後需自行安裝 Bun）",
      default: false,
    });
    if (!shouldContinue) {
      console.log(ui.dim("已取消。請先安裝 Bun: https://bun.sh/docs/installation"));
      process.exit(0);
    }
  }

  // 3. 選擇 channel
  const selectedChannels = await selectChannels();
  if (selectedChannels.length === 0) {
    console.log(ui.dim("未選擇任何 channel，結束。"));
    process.exit(0);
  }

  // 4. 逐一設定每個 channel
  for (const channel of selectedChannels) {
    await setupChannel(channel);
  }

  // 5. 顯示最終指令
  printNextSteps(selectedChannels);
}

async function detectBun(): Promise<boolean> {
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync("bun", ["--version"], { encoding: "utf-8" });
    return true;
  } catch {
    return false;
  }
}

async function selectChannels(): Promise<ChannelType[]> {
  const choices = SUPPORTED_CHANNELS.map((ch) => ({
    name: getChannelDisplayName(ch),
    value: ch,
  }));

  // 如果 CLI 帶了參數，直接使用
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const valid = args.filter((a): a is ChannelType =>
      (SUPPORTED_CHANNELS as readonly string[]).includes(a),
    );
    if (valid.length > 0) return valid;
  }

  const channel = await select({
    message: "選擇要設定的 channel:",
    choices: [
      ...choices,
      { name: "全部設定 (Discord + Telegram)", value: "all" as const },
    ],
  });

  if (channel === "all") return [...SUPPORTED_CHANNELS];
  return [channel as ChannelType];
}

async function setupChannel(channel: ChannelType): Promise<void> {
  const displayName = getChannelDisplayName(channel);
  console.log(ui.title(`設定 ${displayName}`));

  // 顯示先決條件
  console.log(`${ui.icons.clipboard} 先決條件（手動步驟）:`);
  console.log(ui.prerequisiteList(getPrerequisiteSteps(channel)));
  console.log();

  await confirm({ message: "以上步驟都已完成？", default: true });

  // 取得 token
  const token = await password({
    message: getTokenPromptMessage(channel),
    mask: "*",
  });

  if (!token) {
    console.log(ui.error("未輸入 token，跳過此 channel。"));
    return;
  }

  // 驗證 token
  const validateSpinner = ora("驗證 token...").start();
  let botId = "";

  if (channel === "discord") {
    const result = await validateDiscordToken(token);
    if (!result.valid) {
      validateSpinner.fail(result.error);
      return;
    }
    validateSpinner.succeed(
      `Token 驗證成功 (bot: ${result.bot.username}#${result.bot.discriminator})`,
    );
    botId = result.bot.id;
  } else {
    const result = await validateTelegramToken(token);
    if (!result.valid) {
      validateSpinner.fail(result.error);
      return;
    }
    validateSpinner.succeed(
      `Token 驗證成功 (bot: @${result.bot.username})`,
    );
  }

  // Discord: 生成邀請 URL
  if (channel === "discord") {
    const inviteUrl = generateInviteUrl(botId);
    console.log(`\n${ui.icons.link} 邀請 URL（包含所有必要權限）:`);
    console.log(`   ${ui.code(inviteUrl)}`);

    const openBrowser = await confirm({
      message: "是否在瀏覽器中開啟邀請 URL？",
      default: true,
    });

    if (openBrowser) {
      await openUrl(inviteUrl);
    }

    await confirm({ message: "Bot 已加入你的 server？", default: true });

    // Discord: 設定 Server Channel（Group）
    await setupDiscordGroups(token, channel);
  }

  // 儲存 token
  const saveSpinner = ora("儲存 token...").start();
  saveChannelToken(channel, getTokenEnvKey(channel), token);
  saveSpinner.succeed(`Token 已儲存到 ~/.claude/channels/${channel}/.env`);

  // 顯示 plugin 安裝指令
  const cmds = getPluginInstallCommands(channel);
  console.log(`\n${ui.icons.package} Plugin 安裝指令（在 Claude Code 中執行）:`);
  console.log(`   ${ui.code(cmds.install)}`);
  console.log(ui.dim(`   如果找不到 plugin，先執行: ${cmds.marketplaceAdd}`));
  console.log(ui.dim(`   安裝後執行: ${cmds.reload}`));
}

function printNextSteps(channels: ChannelType[]): void {
  const launchCmd = getChannelLaunchCommand(channels);
  const channelNames = channels.map(getChannelDisplayName).join(" + ");

  console.log(ui.title("設定完成"));
  console.log(`${ui.icons.memo} 後續步驟:\n`);
  console.log(`   1. 在 Claude Code 中安裝 plugin（見上方指令）`);
  console.log(`   2. 重啟 Claude Code:`);
  console.log(`      ${ui.code(launchCmd)}`);
  console.log(`   3. 在 ${channelNames} 中 DM 你的 bot，取得配對碼`);

  for (const ch of channels) {
    console.log(`   4. 執行配對: ${ui.code(`/${ch}:access pair <code>`)}`);
    console.log(`   5. 鎖定存取: ${ui.code(`/${ch}:access policy allowlist`)}`);
  }

  console.log(`\n${ui.dim("完整文件: https://code.claude.com/docs/en/channels")}`);
}

async function setupDiscordGroups(
  token: string,
  channel: ChannelType,
): Promise<void> {
  const wantGroups = await confirm({
    message: "是否設定 Server Channel？（讓 bot 在指定 channel 回應，而非只有 DM）",
    default: true,
  });

  if (!wantGroups) return;

  const spinner = ora("取得 bot 已加入的 server 列表...").start();
  let guilds;
  try {
    guilds = await fetchBotGuilds(token);
  } catch (err) {
    spinner.fail(
      `無法取得 server 列表: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  if (guilds.length === 0) {
    spinner.warn("Bot 尚未加入任何 server。請先用邀請 URL 加入後再設定。");
    return;
  }
  spinner.succeed(`找到 ${guilds.length} 個 server`);

  // 選擇 server
  const guildChoice = await select({
    message: "選擇要設定的 server:",
    choices: guilds.map((g) => ({
      name: g.name,
      value: g.id,
      description: `ID: ${g.id}`,
    })),
  });

  // 取得 channel 列表
  const chSpinner = ora("取得 channel 列表...").start();
  let channels;
  try {
    channels = await fetchGuildChannels(token, guildChoice);
  } catch (err) {
    chSpinner.fail(
      `無法取得 channel 列表: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  if (channels.length === 0) {
    chSpinner.warn("此 server 沒有 bot 可以存取的文字頻道。");
    return;
  }
  chSpinner.succeed(`找到 ${channels.length} 個文字頻道`);

  // 選擇 channel（可多選）
  const channelChoices = channels
    .sort((a, b) => a.position - b.position)
    .map((ch) => ({
      name: `#${ch.name}`,
      value: ch.id,
      description: `ID: ${ch.id}`,
    }));

  // 逐一確認要加入哪些 channel
  const selectedChannels: string[] = [];
  for (const ch of channelChoices) {
    const add = await confirm({
      message: `加入 ${ch.name}？`,
      default: false,
    });
    if (add) selectedChannels.push(ch.value);
  }

  if (selectedChannels.length === 0) {
    console.log(ui.dim("未選擇任何 channel，跳過 group 設定。"));
    return;
  }

  // 設定 requireMention
  const requireMention = await confirm({
    message: "需要 @mention bot 才回應？（建議在多人 channel 開啟）",
    default: true,
  });

  // 寫入 access.json
  let config = loadAccessConfig(channel);
  for (const chId of selectedChannels) {
    config = addGroup(config, chId, { requireMention });
  }

  // 同時確保 dmPolicy 是 allowlist（避免 pairing 卡住的問題）
  if (config.dmPolicy === "pairing") {
    const switchPolicy = await confirm({
      message:
        "目前 DM 政策是 pairing（需配對），要改成 allowlist（直接允許）嗎？",
      default: true,
    });
    if (switchPolicy) {
      config = setDmPolicy(config, "allowlist");
    }
  }

  saveAccessConfig(channel, config);

  const chNames = selectedChannels
    .map((id) => {
      const ch = channels.find((c) => c.id === id);
      return ch ? `#${ch.name}` : id;
    })
    .join(", ");

  console.log(
    ui.success(
      `已設定 ${selectedChannels.length} 個 channel: ${chNames}`,
    ),
  );
  console.log(
    ui.dim(
      `  requireMention: ${requireMention} — ${requireMention ? "需要 @bot 才回應" : "所有訊息都回應"}`,
    ),
  );
}

async function openUrl(url: string): Promise<void> {
  try {
    const { execFileSync } = await import("node:child_process");
    const platform = process.platform;
    if (platform === "darwin") {
      execFileSync("open", [url]);
    } else if (platform === "linux") {
      execFileSync("xdg-open", [url]);
    } else if (platform === "win32") {
      execFileSync("cmd", ["/c", "start", url]);
    }
  } catch {
    console.log(ui.warning("無法自動開啟瀏覽器，請手動複製 URL。"));
  }
}

main().catch((err) => {
  console.error(ui.error(`發生錯誤: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
