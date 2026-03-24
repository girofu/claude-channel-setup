// Claude Code Telegram channel setup module

export interface TelegramBotInfo {
  id: number;
  firstName: string;
  username: string;
}

export type TelegramTokenResult =
  | { valid: true; bot: TelegramBotInfo }
  | { valid: false; error: string };

/** Validate token via the Telegram Bot API */
export async function validateTelegramToken(
  token: string,
): Promise<TelegramTokenResult> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getMe`,
    );

    if (!response.ok) {
      return {
        valid: false,
        error: `Invalid token (${response.status} ${response.statusText})`,
      };
    }

    const data = (await response.json()) as {
      ok: boolean;
      description?: string;
      result?: { id: number; first_name: string; username: string };
    };

    if (!data.ok) {
      return {
        valid: false,
        error: `Telegram API error: ${data.description ?? "Unknown error"}`,
      };
    }

    const bot = data.result!;
    return {
      valid: true,
      bot: { id: bot.id, firstName: bot.first_name, username: bot.username },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Unable to connect to Telegram API: ${message}` };
  }
}
