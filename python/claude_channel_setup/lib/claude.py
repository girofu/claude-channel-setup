"""Claude Code CLI 整合模組"""

from __future__ import annotations


def get_plugin_install_commands(channel: str) -> dict[str, str]:
    """取得 plugin 安裝相關指令"""
    return {
        "install": f"/plugin install {channel}@claude-plugins-official",
        "marketplace_add": "/plugin marketplace add anthropics/claude-plugins-official",
        "marketplace_update": "/plugin marketplace update claude-plugins-official",
        "reload": "/reload-plugins",
    }


def get_channel_launch_command(channels: list[str]) -> str:
    """生成帶 --channels 的 Claude Code 啟動指令"""
    if not channels:
        raise ValueError("至少需要一個 channel")

    plugins = " ".join(f"plugin:{ch}@claude-plugins-official" for ch in channels)
    return f"claude --channels {plugins}"
