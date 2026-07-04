import { PageHero, Section } from "@/components/public/sections";
import { CalendarDays, MapPin, Presentation, Users, Camera } from "lucide-react";

const EVENTS = [
  { date: "Mar 14", title: "UNZANASA Science Week", where: "Great East Road Campus", tag: "Flagship" },
  { date: "Apr 02", title: "Undergraduate Research Symposium", where: "Natural Sciences Auditorium", tag: "Research" },
  { date: "Apr 20", title: "STEM Careers Fair", where: "Main Library Lawns", tag: "Careers" },
  { date: "May 09", title: "Inter-Department Sports Gala", where: "UNZA Sports Complex", tag: "Sports" },
  { date: "May 25", title: "Community Science Outreach", where: "Lusaka Secondary Schools", tag: "Outreach" },
  { date: "Jun 12", title: "End-of-Year Science Ball", where: "UNZA Grounds", tag: "Social" },
];

export default function Events() {
  return (
    <div>
      <PageHero eyebrow="Events" title="What's happening at UNZANASA" subtitle="Conferences, outreach, sports and social events across the academic year." />

      <Section title="Upcoming events">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((e) => (
            <article key={e.title} className="card card-hover p-5">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/12 text-center text-brand-600 dark:text-brand-300">
                  <span className="text-[10px] font-bold uppercase leading-none">{e.date.split(" ")[0]}</span>
                  <span className="text-lg font-extrabold leading-none">{e.date.split(" ")[1]}</span>
                </div>
                <span className="chip bg-gold/15 text-gold-600">{e.tag}</span>
              </div>
              <h3 className="mt-3 font-semibold">{e.title}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><MapPin size={12} /> {e.where}</div>
            </article>
          ))}
        </div>
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
