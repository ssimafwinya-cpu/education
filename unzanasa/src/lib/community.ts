// ─── Community: events & announcements ───────────────────────────────────────
// Defaults + pure selectors for the admin-managed association notice board.
// Seed dates are relative to account creation so the demo calendar always has
// upcoming events. Everything here is pure and unit-tested.

import type { AppState, EventItem, Announcement } from "./types";

const DAY = 86_400_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Starter events, spread across the coming months from `now`. */
export function defaultEvents(now = Date.now()): EventItem[] {
  const at = (days: number) => isoDay(now + days * DAY);
  return [
    { id: "evt_sci_week", title: "UNZANASA Science Week", date: at(9), location: "Great East Road Campus", category: "Flagship", description: "A week of talks, demos and the project expo across all departments." },
    { id: "evt_research", title: "Undergraduate Research Symposium", date: at(23), location: "Natural Sciences Auditorium", category: "Research", description: "Students present their research to peers and faculty." },
    { id: "evt_careers", title: "STEM Careers Fair", date: at(37), location: "Main Library Lawns", category: "Careers", description: "Meet employers and explore graduate opportunities in science." },
    { id: "evt_sports", title: "Inter-Department Sports Gala", date: at(54), location: "UNZA Sports Complex", category: "Sports", description: "Departments compete across football, netball, athletics and more." },
    { id: "evt_outreach", title: "Community Science Outreach", date: at(72), location: "Lusaka Secondary Schools", category: "Outreach", description: "Taking hands-on science to local secondary schools." },
    { id: "evt_agm", title: "Annual General Meeting", date: at(90), location: "Natural Sciences Auditorium", category: "Governance", description: "Association reports, budget and the run-up to elections." },
  ];
}

/** Starter announcements for the notice board. */
export function defaultAnnouncements(now = Date.now()): Announcement[] {
  const at = (days: number) => isoDay(now - days * DAY);
  return [
    { id: "ann_welcome", title: "Welcome to the new academic year", body: "Membership registration is open. Pay your association fee to access all UNZANASA services and the Academic Hub.", date: at(1), pinned: true },
    { id: "ann_grants", title: "Undergraduate research mini-grants", body: "Applications are invited for this semester's research mini-grants. Submit proposals through the Project Coordinator.", date: at(4) },
    { id: "ann_timetable", title: "Examination timetable published", body: "The end-of-semester examination timetable is now available on the Member Portal.", date: at(8) },
  ];
}

export function communityOf(state: AppState): { events: EventItem[]; announcements: Announcement[] } {
  return state.community ?? { events: defaultEvents(), announcements: defaultAnnouncements() };
}

/** Upcoming events (today or later), soonest first. */
export function upcomingEvents(events: EventItem[], now = Date.now()): EventItem[] {
  const today = isoDay(now);
  return events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/** Past events, most recent first. */
export function pastEvents(events: EventItem[], now = Date.now()): EventItem[] {
  const today = isoDay(now);
  return events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
}

/** Announcements sorted pinned-first, then newest first. */
export function sortedAnnouncements(anns: Announcement[]): Announcement[] {
  return [...anns].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.date.localeCompare(a.date));
}

export function isAttending(rsvps: string[] | undefined, eventId: string): boolean {
  return Boolean(rsvps?.includes(eventId));
}

/** Break an ISO date into display parts. */
export function eventDateParts(iso: string): { month: string; day: string; weekday: string; full: string } {
  const d = new Date(iso + "T00:00:00");
  return {
    month: d.toLocaleDateString("en", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString("en", { weekday: "short" }),
    full: d.toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
  };
}

/** Tailwind tone (safelisted) for an event category chip. */
export function categoryTone(category: string): string {
  const map: Record<string, string> = {
    Flagship: "gold", Research: "accent", Careers: "sky", Sports: "emerald",
    Outreach: "violet", Social: "rose", Governance: "brand", Academic: "teal",
  };
  return map[category] ?? "brand";
}
