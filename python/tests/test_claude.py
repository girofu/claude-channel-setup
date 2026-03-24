"""Claude Code 整合測試"""

import pytest
from claude_channel_setup.lib.claude import (
    get_plugin_install_commands,
    get_channel_launch_command,
)


class TestGetPluginInstallCommands:
    def test_生成_discord_plugin_安裝指令(self):
        cmds = get_plugin_install_commands("discord")
        assert cmds["install"] == "/plugin install discord@claude-plugins-official"
        assert (
            cmds["marketplace_add"]
            == "/plugin marketplace add anthropics/claude-plugins-official"
        )

    def test_生成_telegram_plugin_安裝指令(self):
        cmds = get_plugin_install_commands("telegram")
        assert cmds["install"] == "/plugin install telegram@claude-plugins-official"


class TestGetChannelLaunchCommand:
    def test_單一_channel_的啟動指令(self):
        cmd = get_channel_launch_command(["discord"])
        assert cmd == "claude --channels plugin:discord@claude-plugins-official"

    def test_多個_channel_的啟動指令(self):
        cmd = get_channel_launch_command(["discord", "telegram"])
        assert (
            cmd
            == "claude --channels plugin:discord@claude-plugins-official plugin:telegram@claude-plugins-official"
        )

    def test_空陣列拋出錯誤(self):
        with pytest.raises(ValueError, match="至少需要一個 channel"):
            get_channel_launch_command([])
