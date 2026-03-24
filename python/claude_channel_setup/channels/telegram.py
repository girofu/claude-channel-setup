"""Claude Code Telegram Channel 設定模組"""

from __future__ import annotations

from typing import Any

import httpx


async def validate_telegram_token(token: str) -> dict[str, Any]:
    """透過 Telegram Bot API 驗證 token 是否有效"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.telegram.org/bot{token}/getMe",
            )

        if response.status_code != 200:
            return {
                "valid": False,
                "error": f"Token 無效 ({response.status_code} {response.reason_phrase})",
            }

        data = response.json()
        if not data.get("ok"):
            description = data.get("description", "Unknown error")
            return {"valid": False, "error": f"Telegram API 錯誤: {description}"}

        bot = data["result"]
        return {
            "valid": True,
            "bot": {
                "id": bot["id"],
                "first_name": bot["first_name"],
                "username": bot["username"],
            },
        }
    except Exception as e:
        return {"valid": False, "error": f"無法連線到 Telegram API: {e}"}
