"""Telegram channel 測試"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from claude_channel_setup.channels.telegram import validate_telegram_token


class TestValidateTelegramToken:
    @pytest.mark.asyncio
    async def test_token_有效時回傳_bot_資訊(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "ok": True,
            "result": {
                "id": 123456789,
                "is_bot": True,
                "first_name": "MyClaude",
                "username": "my_claude_bot",
            },
        }

        with patch("claude_channel_setup.channels.telegram.httpx") as mock_httpx:
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_httpx.AsyncClient.return_value = mock_client

            result = await validate_telegram_token("123:ABC-DEF")

        assert result == {
            "valid": True,
            "bot": {
                "id": 123456789,
                "first_name": "MyClaude",
                "username": "my_claude_bot",
            },
        }

    @pytest.mark.asyncio
    async def test_token_無效時回傳錯誤(self):
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.reason_phrase = "Unauthorized"

        with patch("claude_channel_setup.channels.telegram.httpx") as mock_httpx:
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_httpx.AsyncClient.return_value = mock_client

            result = await validate_telegram_token("bad-token")

        assert result == {"valid": False, "error": "Token 無效 (401 Unauthorized)"}

    @pytest.mark.asyncio
    async def test_api_回傳_ok_false_時回傳錯誤(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": False, "description": "Not Found"}

        with patch("claude_channel_setup.channels.telegram.httpx") as mock_httpx:
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_httpx.AsyncClient.return_value = mock_client

            result = await validate_telegram_token("bad-token")

        assert result == {"valid": False, "error": "Telegram API 錯誤: Not Found"}
