// CLI UI 工具：顏色、排版、訊息

import pc from "picocolors";

export const icons = {
  success: pc.green("✅"),
  error: pc.red("❌"),
  warning: pc.yellow("⚠️"),
  info: pc.blue("ℹ"),
  arrow: pc.cyan("→"),
  bot: "🤖",
  key: "🔑",
  link: "🔗",
  package: "📦",
  clipboard: "📋",
  memo: "📝",
} as const;

export function title(text: string): string {
  return `\n${icons.bot} ${pc.bold(text)}\n${"━".repeat(40)}\n`;
}

export function step(label: string, detail?: string): string {
  if (detail) {
    return `${icons.arrow} ${pc.bold(label)}: ${detail}`;
  }
  return `${icons.arrow} ${pc.bold(label)}`;
}

export function success(text: string): string {
  return `${icons.success} ${text}`;
}

export function error(text: string): string {
  return `${icons.error} ${text}`;
}

export function warning(text: string): string {
  return `${icons.warning} ${text}`;
}

export function dim(text: string): string {
  return pc.dim(text);
}

export function code(text: string): string {
  return pc.cyan(text);
}

export function prerequisiteList(steps: string[]): string {
  return steps.map((s, i) => `   ${i + 1}. ${s}`).join("\n");
}
