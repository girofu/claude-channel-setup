"""Claude Code Channel 設定檔管理"""

from __future__ import annotations

import os
from pathlib import Path


def get_channel_config_dir(channel: str, base_dir: str | None = None) -> str:
    """取得 channel 設定目錄路徑"""
    base = base_dir or os.path.join(Path.home(), ".claude")
    return os.path.join(base, "channels", channel)


def save_channel_token(
    channel: str, key: str, token: str, base_dir: str | None = None
) -> None:
    """將 token 儲存到 channel 的 .env 檔案"""
    config_dir = get_channel_config_dir(channel, base_dir)
    os.makedirs(config_dir, exist_ok=True)
    env_path = os.path.join(config_dir, ".env")
    with open(env_path, "w") as f:
        f.write(f"{key}={token}\n")


def load_channel_token(
    channel: str, key: str, base_dir: str | None = None
) -> str | None:
    """從 channel 的 .env 檔案讀取 token"""
    config_dir = get_channel_config_dir(channel, base_dir)
    env_path = os.path.join(config_dir, ".env")

    if not os.path.exists(env_path):
        return None

    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if "=" in line:
                k, v = line.split("=", 1)
                if k == key:
                    return v

    return None
