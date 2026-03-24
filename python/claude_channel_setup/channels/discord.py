"""Claude Code Discord Channel 設定模組"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

import httpx

# Discord Bot 所需的權限
DISCORD_PERMISSIONS: dict[str, int] = {
    "VIEW_CHANNELS": 1024,
    "SEND_MESSAGES": 2048,
    "SEND_MESSAGES_IN_THREADS": 274877906944,
    "READ_MESSAGE_HISTORY": 65536,
    "ATTACH_FILES": 32768,
    "ADD_REACTIONS": 64,
}


async def validate_discord_token(token: str) -> dict[str, Any]:
    """透過 Discord API 驗證 bot token 是否有效"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://discord.com/api/v10/users/@me",
                headers={"Authorization": f"Bot {token}"},
            )

        if response.status_code != 200:
            return {
                "valid": False,
                "error": f"Token 無效 ({response.status_code} {response.reason_phrase})",
            }

        data = response.json()
        return {
            "valid": True,
            "bot": {
                "id": data["id"],
                "username": data["username"],
                "discriminator": data["discriminator"],
            },
        }
    except Exception as e:
        return {"valid": False, "error": f"無法連線到 Discord API: {e}"}


def generate_invite_url(client_id: str) -> str:
    """生成包含所需權限的 OAuth2 邀請 URL"""
    if not client_id:
        raise ValueError("client_id 不可為空")

    permissions = sum(DISCORD_PERMISSIONS.values())
    params = urlencode(
        {
            "client_id": client_id,
            "scope": "bot",
            "permissions": str(permissions),
        }
    )
    return f"https://discord.com/oauth2/authorize?{params}"
