import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchBotGuilds,
  fetchGuildChannels,
  type DiscordGuild,
  type DiscordChannel,
} from "../src/channels/discord.js";

// mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchBotGuilds", () => {
  it("回傳 bot 已加入的 guild 列表", async () => {
    const guilds: DiscordGuild[] = [
      { id: "111", name: "Server A", icon: null },
      { id: "222", name: "Server B", icon: "abc" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => guilds,
    });

    const result = await fetchBotGuilds("fake-token");
    expect(result).toEqual(guilds);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://discord.com/api/v10/users/@me/guilds",
      { headers: { Authorization: "Bot fake-token" } },
    );
  });

  it("API 失敗時拋出錯誤", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(fetchBotGuilds("bad-token")).rejects.toThrow(
      "無法取得 guild 列表",
    );
  });
});

describe("fetchGuildChannels", () => {
  it("回傳 text channel 列表（過濾掉非文字頻道）", async () => {
    const channels = [
      { id: "c1", name: "general", type: 0, position: 0 },
      { id: "c2", name: "voice", type: 2, position: 1 },
      { id: "c3", name: "dev", type: 0, position: 2 },
      { id: "c4", name: "announcements", type: 5, position: 3 },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => channels,
    });

    const result = await fetchGuildChannels("fake-token", "guild-1");
    // 只回傳 text channels (type 0)
    expect(result).toEqual([
      { id: "c1", name: "general", type: 0, position: 0 },
      { id: "c3", name: "dev", type: 0, position: 2 },
    ]);
  });

  it("API 失敗時拋出錯誤", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    await expect(fetchGuildChannels("bad-token", "guild-1")).rejects.toThrow(
      "無法取得 channel 列表",
    );
  });
});
