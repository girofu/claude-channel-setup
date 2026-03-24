"""Config 管理測試"""

import os
import tempfile
import pytest
from claude_channel_setup.lib.config import (
    get_channel_config_dir,
    save_channel_token,
    load_channel_token,
)


class TestGetChannelConfigDir:
    def test_回傳正確路徑(self, tmp_path):
        result = get_channel_config_dir("discord", base_dir=str(tmp_path))
        assert result == os.path.join(str(tmp_path), "channels", "discord")


class TestSaveChannelToken:
    def test_將_token_存入_env_檔案(self, tmp_path):
        save_channel_token(
            "discord", "DISCORD_BOT_TOKEN", "my-token-123", str(tmp_path)
        )
        env_path = os.path.join(str(tmp_path), "channels", "discord", ".env")
        assert os.path.exists(env_path)
        with open(env_path) as f:
            assert f.read() == "DISCORD_BOT_TOKEN=my-token-123\n"

    def test_目錄不存在時自動建立(self, tmp_path):
        custom_base = os.path.join(str(tmp_path), "nonexistent", ".claude")
        save_channel_token("telegram", "TELEGRAM_BOT_TOKEN", "tg-token", custom_base)
        env_path = os.path.join(custom_base, "channels", "telegram", ".env")
        assert os.path.exists(env_path)

    def test_已存在的_env_會被覆蓋(self, tmp_path):
        save_channel_token("discord", "DISCORD_BOT_TOKEN", "old-token", str(tmp_path))
        save_channel_token("discord", "DISCORD_BOT_TOKEN", "new-token", str(tmp_path))
        env_path = os.path.join(str(tmp_path), "channels", "discord", ".env")
        with open(env_path) as f:
            assert f.read() == "DISCORD_BOT_TOKEN=new-token\n"


class TestLoadChannelToken:
    def test_從_env_檔案讀取_token(self, tmp_path):
        save_channel_token("discord", "DISCORD_BOT_TOKEN", "my-token", str(tmp_path))
        token = load_channel_token("discord", "DISCORD_BOT_TOKEN", str(tmp_path))
        assert token == "my-token"

    def test_檔案不存在時回傳_None(self, tmp_path):
        token = load_channel_token("discord", "DISCORD_BOT_TOKEN", str(tmp_path))
        assert token is None

    def test_key_不存在時回傳_None(self, tmp_path):
        save_channel_token("discord", "DISCORD_BOT_TOKEN", "my-token", str(tmp_path))
        token = load_channel_token("discord", "OTHER_KEY", str(tmp_path))
        assert token is None
