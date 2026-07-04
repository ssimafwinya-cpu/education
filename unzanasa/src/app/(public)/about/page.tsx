import { PageHero, Section, StatBand } from "@/components/public/sections";

const EXEC = [
  { role: "President", name: "Chanda Mulenga", dept: "Physics" },
  { role: "Vice President", name: "Natasha Phiri", dept: "Biological Sciences" },
  { role: "Secretary General", name: "Joseph Banda", dept: "Chemistry" },
  { role: "Treasurer", name: "Mary Tembo", dept: "Mathematics" },
  { role: "Academic Secretary", name: "David Zulu", dept: "Computer Science" },
  { role: "Welfare Secretary", name: "Grace Sakala", dept: "Geology" },
];

export default function About() {
  return (
    <div>
      <PageHero eyebrow="About UNZANASA" title="Advancing Natural Sciences at the University of Zambia" subtitle="We represent, support and empower every undergraduate student in the School of Natural Sciences — academically, socially and professionally." />

      <Section title="Our history">
        <div className="prose-cognify max-w-3xl">
          <p>The University of Zambia Natural Sciences Student Association (UNZANASA) is the representative body for students across the School of Natural Sciences. Founded to give science students a unified voice, UNZANASA has grown into a hub for academic excellence, welfare advocacy, research support and community.</p>
          <p>Today, UNZANASA serves thousands of students across departments including Biological Sciences, Chemistry, Physics, Mathematics, Computer Science and Geology — bridging the classroom and student life through mentorship, events and now a purpose-built <strong>digital Academic Hub</strong>.</p>
        </div>
      </Section>

      <Section className="!py-8">
        <StatBand stats={[
          { value: "6", label: "Departments" },
          { value: "4,200+", label: "Members" },
          { value: "50+", label: "Events / year" },
          { value: "1978", label: "Serving students since" },
        ]} />
      </Section>

      <Section id="executive" title="Executive Committee" subtitle="The elected student leaders serving UNZANASA this academic year.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXEC.map((m) => (
            <div key={m.role} className="card flex items-center gap-4 p-5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-500/12 text-lg font-bold text-brand-600 dark:text-brand-300">
                {m.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-ink-muted">{m.role} · {m.dept}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="constitution" title="Constitution & governance" subtitle="UNZANASA is governed by a student-ratified constitution.">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Mission", "To champion academic excellence and student welfare across the Natural Sciences."],
            ["Vision", "To be Africa's leading science student association and digital academic ecosystem."],
            ["Values", "Integrity, scholarship, inclusivity, service and innovation."],
          ].map(([t, d]) => (
            <div key={t} className="card p-6"><h3 className="font-semibold text-brand-600 dark:text-brand-300">{t}</h3><p className="mt-2 text-sm text-ink-muted">{d}</p></div>
          ))}
        </div>
      </Section>

      <Section id="partners" title="Partners & sponsors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {["School of Natural Sciences", "UNZA Library", "Zambia Science Council", "Industry Partners"].map((p) => (
            <div key={p} className="card grid place-items-center p-6 text-center text-sm font-medium text-ink-muted">{p}</div>
          ))}
        </div>
      </Section>
    </div>
  );
}
