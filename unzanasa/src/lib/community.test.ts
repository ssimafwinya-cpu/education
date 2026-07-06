import { describe, it, expect } from "vitest";
import {
  defaultEvents, defaultAnnouncements, upcomingEvents, pastEvents,
  sortedAnnouncements, isAttending, eventDateParts, categoryTone,
} from "./community";
import type { EventItem, Announcement } from "./types";

const NOW = Date.parse("2026-07-06T00:00:00Z");

describe("defaults", () => {
  it("seeds six upcoming events relative to now", () => {
    const evts = defaultEvents(NOW);
    expect(evts).toHaveLength(6);
    expect(upcomingEvents(evts, NOW)).toHaveLength(6); // all in the future
  });
  it("seeds announcements with one pinned", () => {
    const anns = defaultAnnouncements(NOW);
    expect(anns.length).toBeGreaterThan(0);
    expect(anns.some((a) => a.pinned)).toBe(true);
  });
});

describe("upcoming / past split", () => {
  const events: EventItem[] = [
    { id: "a", title: "Past", date: "2026-07-01", location: "x", category: "Research" },
    { id: "b", title: "Today", date: "2026-07-06", location: "x", category: "Research" },
    { id: "c", title: "Soon", date: "2026-07-20", location: "x", category: "Research" },
    { id: "d", title: "Later", date: "2026-08-10", location: "x", category: "Research" },
  ];
  it("upcoming includes today and sorts ascending", () => {
    const u = upcomingEvents(events, NOW);
    expect(u.map((e) => e.id)).toEqual(["b", "c", "d"]);
  });
  it("past excludes today and sorts descending", () => {
    const p = pastEvents(events, NOW);
    expect(p.map((e) => e.id)).toEqual(["a"]);
  });
});

describe("announcements ordering", () => {
  it("pinned first, then newest", () => {
    const anns: Announcement[] = [
      { id: "1", title: "old", body: "", date: "2026-01-01" },
      { id: "2", title: "new", body: "", date: "2026-06-01" },
      { id: "3", title: "pinned-old", body: "", date: "2026-02-01", pinned: true },
    ];
    expect(sortedAnnouncements(anns).map((a) => a.id)).toEqual(["3", "2", "1"]);
  });
});

describe("rsvp + formatting helpers", () => {
  it("isAttending checks membership", () => {
    expect(isAttending(["a", "b"], "b")).toBe(true);
    expect(isAttending(["a"], "z")).toBe(false);
    expect(isAttending(undefined, "z")).toBe(false);
  });
  it("eventDateParts breaks an ISO date apart", () => {
    const p = eventDateParts("2026-03-14");
    expect(p.month).toBe("MAR");
    expect(p.day).toBe("14");
    expect(p.full).toContain("2026");
  });
  it("categoryTone maps known categories and falls back", () => {
    expect(categoryTone("Sports")).toBe("emerald");
    expect(categoryTone("Unknown")).toBe("brand");
  });
});
