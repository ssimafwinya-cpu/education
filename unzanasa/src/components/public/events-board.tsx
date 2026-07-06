"use client";

// Public events board + notice board, read live from the admin-managed store
// (falls back to defaults for guests). Signed-in members can RSVP; the RSVP is
// stored per-account and synced.

import { useStore } from "@/lib/store";
import { useAccount } from "@/lib/account";
import { communityOf, upcomingEvents, pastEvents, sortedAnnouncements, isAttending, eventDateParts, categoryTone } from "@/lib/community";
import { MapPin, Check, CalendarPlus, Megaphone, Pin } from "lucide-react";

export function EventsBoard() {
  const { state, dispatch } = useStore();
  const { user } = useAccount();
  const { events, announcements } = communityOf(state);
  const upcoming = upcomingEvents(events);
  const past = pastEvents(events).slice(0, 3);
  const notices = sortedAnnouncements(announcements);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-muted">No upcoming events posted yet — check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => {
              const d = eventDateParts(e.date);
              const tone = categoryTone(e.category);
              const going = isAttending(state.rsvps, e.id);
              return (
                <article key={e.id} className="card card-hover flex flex-col p-5">
                  <div className="flex items-center justify-between">
                    <div className={`grid h-12 w-12 place-items-center rounded-xl bg-${tone}-500/12 text-center text-${tone}-600 dark:text-${tone}-300`}>
                      <span className="text-[10px] font-bold uppercase leading-none">{d.month}</span>
                      <span className="text-lg font-extrabold leading-none">{d.day}</span>
                    </div>
                    <span className={`chip bg-${tone}-500/15 text-${tone}-600 dark:text-${tone}-300`}>{e.category}</span>
                  </div>
                  <h3 className="mt-3 font-semibold">{e.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><MapPin size={12} /> {e.location || "TBA"}</div>
                  {e.description && <p className="mt-2 text-sm text-ink-muted">{e.description}</p>}
                  <div className="mt-auto pt-3">
                    <button
                      onClick={() => dispatch({ type: "TOGGLE_RSVP", eventId: e.id })}
                      className={going ? "btn-primary btn-sm w-full" : "btn-secondary btn-sm w-full"}
                    >
                      {going ? <><Check size={14} /> Attending</> : <><CalendarPlus size={14} /> RSVP</>}
                    </button>
                    {!user && going && <p className="mt-1 text-center text-[10px] text-ink-faint">Saved on this device — sign in to sync.</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {notices.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight"><Megaphone size={20} className="text-brand-500" /> Notice board</h2>
          <div className="space-y-3">
            {notices.map((a) => (
              <article key={a.id} className={`card p-5 ${a.pinned ? "border-gold/40" : ""}`}>
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin size={13} className="text-gold-600" />}
                  <h3 className="font-semibold">{a.title}</h3>
                  <span className="ml-auto text-xs text-ink-faint">{eventDateParts(a.date).full}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink-muted">{a.body}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight">Recently held</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {past.map((e) => {
              const d = eventDateParts(e.date);
              return (
                <div key={e.id} className="rounded-xl border border-edge p-4 opacity-70">
                  <div className="text-xs font-medium text-ink-faint">{d.month} {d.day}</div>
                  <div className="mt-1 text-sm font-medium">{e.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
