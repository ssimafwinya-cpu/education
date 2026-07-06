import Link from "next/link";
import { PageHero, Section, StatBand } from "@/components/public/sections";
import { ExecCommittee } from "@/components/public/exec-committee";

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

      <Section id="executive" title="Executive Committee" subtitle="The Article 8 offices — elected by members each academic year, two weeks after the UNZASU elections. Vacant seats show the office's constitutional duty.">
        <ExecCommittee />
        <p className="mt-4 text-sm text-ink-muted">
          Eligibility, tenure and election rules are set out in Articles 9–13 of the{" "}
          <Link href="/constitution" className="font-medium text-brand-600 hover:underline dark:text-brand-300">Constitution</Link>.
        </p>
      </Section>

      <Section id="constitution" title="Constitution & governance" subtitle="UNZANASA is governed by its Constitution — the supreme law of the Association, approved by the Dean of the School of Natural Sciences.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Four organs", "The Executive Committee, the General Assembly, the Electoral Commission and the Disciplinary Committee (Article 4)."],
            ["Membership", "Full membership for all School of Natural Sciences students; alumni and faculty are members too (Article 3)."],
            ["Accountability", "Audited annual finances, an independent 12-member Electoral Commission, and impeachment by 30% of the General Assembly."],
            ["Rule of law", "Subject to the UNZASU Constitution, the Constitution of Zambia and the Higher Education Act (Article 1)."],
          ].map(([t, d]) => (
            <div key={t} className="card p-6"><h3 className="font-semibold text-brand-600 dark:text-brand-300">{t}</h3><p className="mt-2 text-sm text-ink-muted">{d}</p></div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/constitution" className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
            Read the full Constitution
          </Link>
          <a href="/documents/UNZANASA-Constitution.pdf" download className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
            Download the official PDF
          </a>
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
