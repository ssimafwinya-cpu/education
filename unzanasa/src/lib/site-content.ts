// ─── Site content ────────────────────────────────────────────────────────────
// The association-wide, admin-managed content: the programme catalogue, events,
// announcements, the past-paper bank, the executive committee and admin-authored
// Career Mode courses. Unlike a member's personal data (notes, decks, RSVPs),
// this is shared — one copy for everyone, edited by admins and served from
// /api/content.

import type { CatalogueProgramme, EventItem, Announcement, PastPaper, ExecMember } from "./types";
import type { CareerCourse } from "./career";
import { defaultProgrammes } from "./courses-catalogue";
import { defaultEvents, defaultAnnouncements } from "./community";
import { defaultPastPapers } from "./past-papers";
import { defaultCommittee } from "./committee";

export interface SiteContent {
  programmes: CatalogueProgramme[];
  events: EventItem[];
  announcements: Announcement[];
  pastPapers: PastPaper[];
  committee: ExecMember[];
  /** Custom Career Mode courses (the built-ins ship in code and are not stored). */
  careerCourses: CareerCourse[];
}

export function defaultSiteContent(now = Date.now()): SiteContent {
  return {
    programmes: defaultProgrammes(),
    events: defaultEvents(now),
    announcements: defaultAnnouncements(now),
    pastPapers: defaultPastPapers(),
    committee: defaultCommittee(),
    careerCourses: [],
  };
}

/** Fill any missing top-level section from the defaults (forward-compatible). */
export function mergeSiteContent(partial: Partial<SiteContent> | null | undefined): SiteContent {
  const d = defaultSiteContent();
  return {
    programmes: partial?.programmes ?? d.programmes,
    events: partial?.events ?? d.events,
    announcements: partial?.announcements ?? d.announcements,
    pastPapers: partial?.pastPapers ?? d.pastPapers,
    committee: partial?.committee ?? d.committee,
    careerCourses: partial?.careerCourses ?? d.careerCourses,
  };
}

/** Extract the site-content slices from a full app state. */
export function siteContentFromState(state: {
  catalogue?: { programmes: CatalogueProgramme[] };
  community?: { events: EventItem[]; announcements: Announcement[] };
  pastPapers?: PastPaper[];
  committee?: ExecMember[];
  careerCourses?: CareerCourse[];
}): SiteContent {
  return mergeSiteContent({
    programmes: state.catalogue?.programmes,
    events: state.community?.events,
    announcements: state.community?.announcements,
    pastPapers: state.pastPapers,
    committee: state.committee,
    careerCourses: state.careerCourses,
  });
}
