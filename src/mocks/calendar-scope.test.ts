import { describe, it, expect } from "vitest";
import { api } from "@/lib/api/client";

/**
 * Every calendar endpoint hangs off /units/{id}, so the mock has to be scoped
 * the same way — a global list would make the unit picker look broken and hide
 * real cross-unit bugs behind fixtures that never disagree.
 */
describe("calendar data is scoped to one unit", () => {
  it("gives each unit its own feeds", async () => {
    const [first, second] = await Promise.all([api.listFeeds("u_1"), api.listFeeds("u_2")]);

    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);
    const shared = first.filter((f) => second.some((s) => s.id === f.id));
    expect(shared).toEqual([]);
  });

  it("returns no feeds for a unit that never connected one", async () => {
    await expect(api.listFeeds("u_nonexistent")).resolves.toEqual([]);
  });

  it("adds a feed to the unit it was added under, and nowhere else", async () => {
    const added = await api.addFeed("u_2", "Expedia", "https://expedia.com/ical/x.ics");

    await expect(api.listFeeds("u_2")).resolves.toContainEqual(expect.objectContaining({ id: added.id }));
    const others = await api.listFeeds("u_1");
    expect(others.some((f) => f.id === added.id)).toBe(false);

    await api.deleteFeed("u_2", added.id);
    await expect(api.listFeeds("u_2")).resolves.not.toContainEqual(
      expect.objectContaining({ id: added.id }),
    );
  });

  it("ignores a delete aimed at the wrong unit", async () => {
    const [feed] = await api.listFeeds("u_1");
    await api.deleteFeed("u_2", feed.id);

    await expect(api.listFeeds("u_1")).resolves.toContainEqual(
      expect.objectContaining({ id: feed.id }),
    );
  });

  it("builds the grid for the month asked for, per unit", async () => {
    const [first, second] = await Promise.all([
      api.getCalendar("u_1", "2026-09"),
      api.getCalendar("u_2", "2026-09"),
    ]);

    expect(first).toHaveLength(30);
    expect(first[0].date).toBe("2026-09-01");
    // Same month, different units — the day patterns must not be identical.
    expect(second.map((d) => d.status)).not.toEqual(first.map((d) => d.status));
  });

  it("leaves a unit with no seeded pattern fully available", async () => {
    const days = await api.getCalendar("u_nonexistent", "2026-09");

    expect(days).toHaveLength(30);
    expect(days.every((d) => d.status === "available")).toBe(true);
  });
});
