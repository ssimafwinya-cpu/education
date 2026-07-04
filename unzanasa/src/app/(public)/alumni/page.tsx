import { PageHero, Section, StatBand } from "@/components/public/sections";
import { Briefcase, GraduationCap, Network } from "lucide-react";

const ALUMNI = [
  { name: "Dr. Mwansa Chulu", year: "2009", field: "Research Physicist, CERN collaboration" },
  { name: "Bwalya Ngoma", year: "2012", field: "Biotech Founder & CEO" },
  { name: "Prof. Lombe Kabwe", year: "2005", field: "Chemistry Faculty, UNZA" },
  { name: "Chileshe Musonda", year: "2016", field: "Data Scientist, fintech" },
];

export default function Alumni() {
  return (
    <div>
      <PageHero eyebrow="Alumni Network" title="Once a scientist, always UNZANASA" subtitle="Our graduates lead in research, industry, academia and entrepreneurship across the world." />

      <Section className="!py-8">
        <StatBand stats={[
          { value: "12,000+", label: "Alumni worldwide" },
          { value: "40+", label: "Countries" },
          { value: "150+", label: "PhDs" },
          { value: "1978", label: "First cohort" },
        ]} />
      </Section>

      <Section title="Notable alumni">
        <div className="grid gap-4 sm:grid-cols-2">
          {ALUMNI.map((a) => (
            <div key={a.name} className="card flex items-center gap-4 p-5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent-500/12 text-accent-600"><GraduationCap size={22} /></div>
              <div><div className="font-semibold">{a.name} <span className="text-xs font-normal text-ink-faint">· Class of {a.year}</span></div><div className="text-sm text-ink-muted">{a.field}</div></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Get involved" className="!pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Network, t: "Join the network", d: "Reconnect with classmates and current students." },
            { Icon: Briefcase, t: "Mentor a student", d: "Offer guidance, internships or career advice." },
            { Icon: GraduationCap, t: "Give back", d: "Support scholarships and research funds." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="card p-6"><div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-500/12 text-brand-600 dark:text-brand-300"><Icon size={18} /></div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-muted">{d}</p></div>
          ))}
        </div>
      </Section>
    </div>
  );
}
