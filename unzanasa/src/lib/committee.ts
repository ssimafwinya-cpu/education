// ─── Executive committee ─────────────────────────────────────────────────────
// The nine offices established by Article 8 of the UNZANASA Constitution, with
// a one-line duty summary from Articles 14–17. Holders are filled in by an
// admin; until then an office reads as "Vacant". Pure defaults + selectors.

import type { AppState, ExecMember } from "./types";

export interface OfficeDef {
  id: string;
  office: string;
  duty: string;
  emoji: string;
}

/** Article 8 composition, in constitutional order. */
export const OFFICES: OfficeDef[] = [
  { id: "off_president", office: "President", duty: "Presides over meetings, coordinates all activities, spokesperson and account signatory.", emoji: "🎓" },
  { id: "off_vice", office: "Vice-President", duty: "Deputises the President, chairs the Disciplinary Committee, succeeds if the presidency falls vacant.", emoji: "🤝" },
  { id: "off_secgen", office: "Secretary General", duty: "Keeps minutes and correspondence; account signatory.", emoji: "📝" },
  { id: "off_treasurer", office: "Treasurer", duty: "Keeps the books, chairs the Financial Committee, presents the audited report.", emoji: "💰" },
  { id: "off_project", office: "Project Co-ordinator", duty: "Oversees project proposals and manages Association projects.", emoji: "📋" },
  { id: "off_academic", office: "Academic Affairs Secretary", duty: "Represents students academically and coordinates academic activities.", emoji: "📚" },
  { id: "off_sports", office: "Sports & Recreation Secretary", duty: "Oversees all sports and recreation activities.", emoji: "⚽" },
  { id: "off_publicity", office: "Publicity & Information Secretary", duty: "Publicises meetings and resolutions; runs email and social media.", emoji: "📣" },
  { id: "off_committee1", office: "Committee Member", duty: "Performs duties delegated by the Executive Committee.", emoji: "👥" },
  { id: "off_committee2", office: "Committee Member", duty: "Performs duties delegated by the Executive Committee.", emoji: "👥" },
];

/** A blank committee (all offices vacant), used as the default. */
export function defaultCommittee(): ExecMember[] {
  return OFFICES.map((o) => ({ id: o.id, office: o.office, name: "", affiliation: "", email: "" }));
}

export function committeeOf(state: AppState): ExecMember[] {
  const stored = state.committee;
  if (!stored || stored.length === 0) return defaultCommittee();
  // Merge stored holders onto the canonical office order (keeps duties/emoji).
  return OFFICES.map((o) => stored.find((m) => m.id === o.id) ?? { id: o.id, office: o.office, name: "", affiliation: "", email: "" });
}

export function officeDef(id: string): OfficeDef | undefined {
  return OFFICES.find((o) => o.id === id);
}

export function isVacant(m: ExecMember): boolean {
  return !m.name.trim();
}

/** How many offices currently have a named holder. */
export function filledCount(committee: ExecMember[]): number {
  return committee.filter((m) => !isVacant(m)).length;
}
