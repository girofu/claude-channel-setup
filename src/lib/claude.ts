// Claude Code CLI integration module

type ExecFn = (cmd: string) => Promise<{ stdout: string }>;

/** Detect whether Claude Code CLI is installed on the system */
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

/** Get plugin installation related commands */
export function getPluginInstallCommands(channel: string) {
  return {
    install: `/plugin install ${channel}@claude-plugins-official`,
    marketplaceAdd: `/plugin marketplace add anthropics/claude-plugins-official`,
    marketplaceUpdate: `/plugin marketplace update claude-plugins-official`,
    reload: `/reload-plugins`,
  };
}

/** Generate a Claude Code launch command with --channels flag */
export function getChannelLaunchCommand(channels: string[]): string {
  if (channels.length === 0) {
    throw new Error("At least one channel is required");
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
