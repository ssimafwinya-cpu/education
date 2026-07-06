import { PageHero, Section } from "@/components/public/sections";
import { CalendarDays, Presentation, Users, Camera } from "lucide-react";
import { EventsBoard } from "@/components/public/events-board";

export default function Events() {
  return (
    <div>
      <PageHero eyebrow="Events" title="What's happening at UNZANASA" subtitle="Conferences, outreach, sports and social events across the academic year." />

      <Section>
        <EventsBoard />
      </Section>

      <Section id="conferences" title="Conferences" subtitle="Flagship academic gatherings hosted by UNZANASA.">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Presentation, t: "Science Research Symposium", d: "Undergraduate & postgraduate research presentations." },
            { Icon: Users, t: "Departmental Colloquia", d: "Guest lectures from academics and industry." },
            { Icon: CalendarDays, t: "Annual General Meeting", d: "Association governance and elections." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="card p-6"><div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-accent-500/12 text-accent-600"><Icon size={18} /></div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-muted">{d}</p></div>
          ))}
        </div>
      </Section>

      <Section id="outreach" title="Outreach programs" subtitle="Taking science to the community.">
        <div className="card p-6"><p className="text-ink-muted">UNZANASA runs school outreach, science fairs and mentorship programmes to inspire the next generation of Zambian scientists.</p></div>
      </Section>

      <Section id="gallery" title="Photo gallery">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-500/10 grid place-items-center text-ink-faint"><Camera size={22} /></div>
          ))}
        </div>
      </Section>
    </div>
  );
}
