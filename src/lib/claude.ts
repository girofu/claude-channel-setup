// Claude Code CLI 整合模組

type ExecFn = (cmd: string) => Promise<{ stdout: string }>;

/** 偵測系統是否安裝了 Claude Code CLI */
export async function detectClaudeCode(
  exec?: ExecFn,
): Promise<boolean> {
  const run = exec ?? defaultExec;
  try {
    await run("which claude");
    return true;
  } catch {
    return false;
  }
}

/** 取得 plugin 安裝相關指令 */
export function getPluginInstallCommands(channel: string) {
  return {
    install: `/plugin install ${channel}@claude-plugins-official`,
    marketplaceAdd: `/plugin marketplace add anthropics/claude-plugins-official`,
    marketplaceUpdate: `/plugin marketplace update claude-plugins-official`,
    reload: `/reload-plugins`,
  };
}

/** 生成帶 --channels 的 Claude Code 啟動指令 */
export function getChannelLaunchCommand(channels: string[]): string {
  if (channels.length === 0) {
    throw new Error("至少需要一個 channel");
  }

  const plugins = channels
    .map((ch) => `plugin:${ch}@claude-plugins-official`)
    .join(" ");

  return `claude --channels ${plugins}`;
}

async function defaultExec(cmd: string): Promise<{ stdout: string }> {
  const { execFileSync } = await import("node:child_process");
  const args = cmd.split(" ");
  const bin = args[0];
  const stdout = execFileSync(bin, args.slice(1), { encoding: "utf-8" });
  return { stdout };
}
