"use client";

// Admin editor for the association notice board — events and announcements.
// Writes to the store (SET_EVENTS / SET_ANNOUNCEMENTS); the public Events page
// and the hub dashboard read the same slices live.

import { useStore } from "@/lib/store";
import { communityOf } from "@/lib/community";
import type { EventItem, Announcement } from "@/lib/types";
import { uid, isoDate } from "@/lib/utils";
import { Plus, Trash2, CalendarDays, Megaphone, Pin } from "lucide-react";

const CATEGORIES = ["Flagship", "Research", "Careers", "Sports", "Outreach", "Governance", "Social", "Academic"];

export function CommunityEditor() {
  const { state, dispatch } = useStore();
  const { events, announcements } = communityOf(state);

  const setEvents = (next: EventItem[]) => dispatch({ type: "SET_EVENTS", events: next });
  const setAnns = (next: Announcement[]) => dispatch({ type: "SET_ANNOUNCEMENTS", announcements: next });
  const patchEvent = (id: string, patch: Partial<EventItem>) => setEvents(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const patchAnn = (id: string, patch: Partial<Announcement>) => setAnns(announcements.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const addEvent = () => setEvents([...events, { id: uid("evt"), title: "New event", date: isoDate(), location: "", category: "Academic" }]);
  const addAnn = () => setAnns([{ id: uid("ann"), title: "New announcement", body: "", date: isoDate(), pinned: false }, ...announcements]);

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Events */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold"><CalendarDays size={16} className="text-brand-500" /> Events <span className="text-sm text-ink-faint">({events.length})</span></div>
          <button onClick={addEvent} className="btn-primary btn-sm"><Plus size={14} /> Add event</button>
        </div>
        <div className="space-y-3">
          {sortedEvents.map((e) => (
            <div key={e.id} className="rounded-xl border border-edge bg-surface p-3">
              <div className="flex items-center gap-2">
                <input value={e.title} onChange={(ev) => patchEvent(e.id, { title: ev.target.value })} className="input flex-1 font-semibold" placeholder="Event title" aria-label="Event title" />
                <button onClick={() => setEvents(events.filter((x) => x.id !== e.id))} className="btn-ghost btn-sm text-crimson-600" aria-label="Delete event"><Trash2 size={14} /></button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="date" value={e.date} onChange={(ev) => patchEvent(e.id, { date: ev.target.value })} className="input text-sm" aria-label="Event date" />
                <select value={e.category} onChange={(ev) => patchEvent(e.id, { category: ev.target.value })} className="input text-sm" aria-label="Category">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input value={e.location} onChange={(ev) => patchEvent(e.id, { location: ev.target.value })} className="input mt-2 text-sm" placeholder="Location" aria-label="Location" />
              <textarea value={e.description ?? ""} onChange={(ev) => patchEvent(e.id, { description: ev.target.value })} className="input mt-2 text-sm" rows={2} placeholder="Short description (optional)" aria-label="Description" />
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold"><Megaphone size={16} className="text-brand-500" /> Announcements <span className="text-sm text-ink-faint">({announcements.length})</span></div>
          <button onClick={addAnn} className="btn-primary btn-sm"><Plus size={14} /> Add notice</button>
        </div>
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-edge bg-surface p-3">
              <div className="flex items-center gap-2">
                <input value={a.title} onChange={(ev) => patchAnn(a.id, { title: ev.target.value })} className="input flex-1 font-semibold" placeholder="Notice title" aria-label="Notice title" />
                <button onClick={() => patchAnn(a.id, { pinned: !a.pinned })} className={`btn-ghost btn-sm ${a.pinned ? "text-gold-600" : "text-ink-faint"}`} aria-label="Pin notice" title={a.pinned ? "Pinned" : "Pin"}><Pin size={14} /></button>
                <button onClick={() => setAnns(announcements.filter((x) => x.id !== a.id))} className="btn-ghost btn-sm text-crimson-600" aria-label="Delete notice"><Trash2 size={14} /></button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input type="date" value={a.date} onChange={(ev) => patchAnn(a.id, { date: ev.target.value })} className="input w-40 text-sm" aria-label="Notice date" />
                {a.pinned && <span className="chip bg-gold/15 text-gold-600">Pinned</span>}
              </div>
              <textarea value={a.body} onChange={(ev) => patchAnn(a.id, { body: ev.target.value })} className="input mt-2 text-sm" rows={2} placeholder="Notice body" aria-label="Notice body" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
