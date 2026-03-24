import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchBotGuilds,
  fetchGuildChannels,
  fetchGuildChannelsWithCategories,
  type DiscordGuild,
  type DiscordChannel,
  type DiscordChannelWithCategory,
} from "../src/channels/discord.js";

// mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchBotGuilds", () => {
  it("returns the list of guilds the bot has joined", async () => {
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

  it("throws an error when API call fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(fetchBotGuilds("bad-token")).rejects.toThrow(
      "Failed to fetch guild list",
    );
  });
});

describe("fetchGuildChannels", () => {
  it("returns only text channels (filters out non-text channels)", async () => {
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
    // Only returns text channels (type 0)
    expect(result).toEqual([
      { id: "c1", name: "general", type: 0, position: 0 },
      { id: "c3", name: "dev", type: 0, position: 2 },
    ]);
  });

  it("throws an error when API call fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    await expect(fetchGuildChannels("bad-token", "guild-1")).rejects.toThrow(
      "Failed to fetch channel list",
    );
  });
});

describe("fetchGuildChannelsWithCategories", () => {
  it("includes category name for text channels", async () => {
    const channels = [
      { id: "cat1", name: "Development", type: 4, position: 0, parent_id: null },
      { id: "c1", name: "general", type: 0, position: 1, parent_id: "cat1" },
      { id: "c2", name: "bugs", type: 0, position: 2, parent_id: "cat1" },
      { id: "cat2", name: "Operations", type: 4, position: 3, parent_id: null },
      { id: "c3", name: "general", type: 0, position: 4, parent_id: "cat2" },
      { id: "c4", name: "no-category", type: 0, position: 5, parent_id: null },
      { id: "v1", name: "voice", type: 2, position: 6, parent_id: "cat1" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => channels,
    });

    const result = await fetchGuildChannelsWithCategories("fake-token", "guild-1");

    expect(result).toEqual([
      { id: "c1", name: "general", type: 0, position: 1, parent_id: "cat1", categoryName: "Development" },
      { id: "c2", name: "bugs", type: 0, position: 2, parent_id: "cat1", categoryName: "Development" },
      { id: "c3", name: "general", type: 0, position: 4, parent_id: "cat2", categoryName: "Operations" },
      { id: "c4", name: "no-category", type: 0, position: 5, parent_id: null, categoryName: null },
    ]);
  });

  it("distinguishes same-name channels by category", async () => {
    const channels = [
      { id: "cat1", name: "Frontend", type: 4, position: 0, parent_id: null },
      { id: "cat2", name: "Backend", type: 4, position: 1, parent_id: null },
      { id: "c1", name: "bugs", type: 0, position: 2, parent_id: "cat1" },
      { id: "c2", name: "bugs", type: 0, position: 3, parent_id: "cat2" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => channels,
    });

    const result = await fetchGuildChannelsWithCategories("fake-token", "guild-1");

    const bugChannels = result.filter((ch) => ch.name === "bugs");
    expect(bugChannels).toHaveLength(2);
    expect(bugChannels[0].categoryName).toBe("Frontend");
    expect(bugChannels[1].categoryName).toBe("Backend");
  });
});
