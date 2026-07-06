"use client";

// The current executive committee, read from the admin-managed store. Each of
// the Article 8 offices shows its holder (name + department) when recorded, or
// its constitutional duty while the seat is vacant.

import { useStore } from "@/lib/store";
import { committeeOf, officeDef, isVacant } from "@/lib/committee";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export function ExecCommittee() {
  const { state } = useStore();
  const committee = committeeOf(state);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {committee.map((m) => {
        const def = officeDef(m.id);
        const vacant = isVacant(m);
        return (
          <div key={m.id} className="card p-5">
            {vacant ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{def?.emoji}</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-300">{m.office}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{def?.duty}</p>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-500/12 text-sm font-bold text-brand-600 dark:text-brand-300">{initials(m.name)}</div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{m.name}</div>
                  <div className="text-xs font-medium text-brand-600 dark:text-brand-300">{m.office}</div>
                  {m.affiliation && <div className="mt-0.5 text-xs text-ink-muted">{m.affiliation}</div>}
                  {m.email && <a href={`mailto:${m.email}`} className="mt-0.5 block truncate text-xs text-ink-faint hover:text-brand-600">{m.email}</a>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
