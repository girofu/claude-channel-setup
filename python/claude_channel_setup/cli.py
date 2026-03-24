"""claude-channel-setup CLI 入口（Python 版）"""

from __future__ import annotations

import asyncio
import getpass
import os
import platform
import shutil
import subprocess
import sys

from .channels.discord import generate_invite_url, validate_discord_token
from .channels.telegram import validate_telegram_token
from .lib.claude import get_channel_launch_command, get_plugin_install_commands
from .lib.config import save_channel_token

SUPPORTED_CHANNELS = ["discord", "telegram"]

CHANNEL_CONFIG = {
    "discord": {
        "display_name": "Discord",
        "token_env_key": "DISCORD_BOT_TOKEN",
        "token_prompt": "貼上你的 Discord Bot Token（從 Developer Portal 取得）: ",
        "prerequisites": [
            "在 Discord Developer Portal (https://discord.com/developers/applications) 建立一個新的 Application",
            '在 Bot 設定中啟用 "Message Content Intent"',
            "複製 Bot Token（點擊 Reset Token）",
        ],
    },
    "telegram": {
        "display_name": "Telegram",
        "token_env_key": "TELEGRAM_BOT_TOKEN",
        "token_prompt": "貼上你的 Telegram Bot Token（從 BotFather 取得）: ",
        "prerequisites": [
            "在 Telegram 開啟 BotFather (https://t.me/BotFather)，發送 /newbot 建立新 bot",
            "設定 bot 的顯示名稱和 username（需以 bot 結尾）",
            "複製 BotFather 回傳的 Token",
        ],
    },
}


def print_title(text: str) -> None:
    print(f"\n🤖 {text}")
    print("━" * 40)


def print_success(text: str) -> None:
    print(f"✅ {text}")


def print_error(text: str) -> None:
    print(f"❌ {text}")


def print_warning(text: str) -> None:
    print(f"⚠️  {text}")


def confirm(message: str, default: bool = True) -> bool:
    suffix = " [Y/n] " if default else " [y/N] "
    answer = input(message + suffix).strip().lower()
    if not answer:
        return default
    return answer in ("y", "yes")


def select_channels(args: list[str]) -> list[str]:
    """選擇要設定的 channel"""
    # CLI 引數直接指定
    valid = [a for a in args if a in SUPPORTED_CHANNELS]
    if valid:
        return valid

    print("\n選擇要設定的 channel:")
    print("  1. Discord")
    print("  2. Telegram")
    print("  3. 全部 (Discord + Telegram)")

    choice = input("\n請輸入選項 (1/2/3): ").strip()
    if choice == "1":
        return ["discord"]
    if choice == "2":
        return ["telegram"]
    if choice == "3":
        return list(SUPPORTED_CHANNELS)

    print_error("無效選項")
    return []


async def setup_channel(channel: str) -> None:
    """設定單一 channel"""
    config = CHANNEL_CONFIG[channel]
    print_title(f"設定 {config['display_name']}")

    # 顯示先決條件
    print("\n📋 先決條件（手動步驟）:")
    for i, step in enumerate(config["prerequisites"], 1):
        print(f"   {i}. {step}")

    print()
    if not confirm("以上步驟都已完成？"):
        print("已跳過。")
        return

    # 取得 token
    token = getpass.getpass(config["token_prompt"])
    if not token:
        print_error("未輸入 token，跳過此 channel。")
        return

    # 驗證 token
    print("⏳ 驗證 token...")
    if channel == "discord":
        result = await validate_discord_token(token)
    else:
        result = await validate_telegram_token(token)

    if not result["valid"]:
        print_error(result["error"])
        return

    bot = result["bot"]
    if channel == "discord":
        print_success(f"Token 驗證成功 (bot: {bot['username']}#{bot['discriminator']})")
    else:
        print_success(f"Token 驗證成功 (bot: @{bot['username']})")

    # Discord: 生成邀請 URL
    if channel == "discord":
        invite_url = generate_invite_url(bot["id"])
        print(f"\n🔗 邀請 URL（包含所有必要權限）:")
        print(f"   {invite_url}")

        if confirm("是否在瀏覽器中開啟邀請 URL？"):
            _open_url(invite_url)

        confirm("Bot 已加入你的 server？")

    # 儲存 token
    save_channel_token(channel, config["token_env_key"], token)
    print_success(f"Token 已儲存到 ~/.claude/channels/{channel}/.env")

    # 顯示 plugin 安裝指令
    cmds = get_plugin_install_commands(channel)
    print(f"\n📦 Plugin 安裝指令（在 Claude Code 中執行）:")
    print(f"   {cmds['install']}")
    print(f"   如果找不到 plugin，先執行: {cmds['marketplace_add']}")
    print(f"   安裝後執行: {cmds['reload']}")


def print_next_steps(channels: list[str]) -> None:
    """顯示後續步驟"""
    launch_cmd = get_channel_launch_command(channels)
    names = " + ".join(CHANNEL_CONFIG[ch]["display_name"] for ch in channels)

    print_title("設定完成")
    print("\n📝 後續步驟:\n")
    print("   1. 在 Claude Code 中安裝 plugin（見上方指令）")
    print("   2. 重啟 Claude Code:")
    print(f"      {launch_cmd}")
    print(f"   3. 在 {names} 中 DM 你的 bot，取得配對碼")

    for ch in channels:
        print(f"   4. 執行配對: /{ch}:access pair <code>")
        print(f"   5. 鎖定存取: /{ch}:access policy allowlist")

    print(f"\n   完整文件: https://code.claude.com/docs/en/channels")


def _open_url(url: str) -> None:
    """跨平台開啟 URL"""
    try:
        system = platform.system()
        if system == "Darwin":
            subprocess.run(["open", url], check=True)
        elif system == "Linux":
            subprocess.run(["xdg-open", url], check=True)
        elif system == "Windows":
            subprocess.run(["cmd", "/c", "start", url], check=True)
    except Exception:
        print_warning("無法自動開啟瀏覽器，請手動複製 URL。")


def main() -> None:
    """CLI 主入口"""
    print_title("Claude Channel Setup")

    # 偵測 Claude Code
    if shutil.which("claude"):
        print_success("Claude Code CLI 已偵測到")
    else:
        print_warning("未偵測到 Claude Code CLI — 設定仍可繼續")

    # 偵測 Bun
    if shutil.which("bun"):
        print_success("Bun runtime 已偵測到")
    else:
        print_warning("未偵測到 Bun — Channel plugins 需要 Bun (https://bun.sh)")
        if not confirm("是否繼續設定？", default=False):
            print("已取消。請先安裝 Bun: https://bun.sh/docs/installation")
            sys.exit(0)

    # 選擇 channel
    channels = select_channels(sys.argv[1:])
    if not channels:
        print("未選擇任何 channel，結束。")
        sys.exit(0)

    # 逐一設定
    for ch in channels:
        asyncio.run(setup_channel(ch))

    # 後續步驟
    print_next_steps(channels)


if __name__ == "__main__":
    main()
