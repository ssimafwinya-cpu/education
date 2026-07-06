import Link from "next/link";
import { PageHero, Section, FeatureGrid } from "@/components/public/sections";
import { GraduationCap, BookOpen, Newspaper, MessagesSquare, BarChart3, FlaskConical, ArrowRight, Stethoscope } from "lucide-react";
import { FIRST_YEAR, DEPARTMENTS, PROGRAMMES } from "@/lib/courses-catalogue";

function CourseCode({ code }: { code?: string }) {
  return code
    ? <span className="shrink-0 rounded-md bg-brand-500/12 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-600 dark:text-brand-300">{code}</span>
    : <span className="shrink-0 rounded-md border border-edge px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">—</span>;
}

export default function Academics() {
  return (
    <div>
      <PageHero eyebrow="Academics" title="Everything you need to excel in the sciences" subtitle="From the AI Academic Hub to research support, news and student discussion — UNZANASA's academic services in one place.">
        <Link href="/hub" className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-forest transition hover:brightness-105"><GraduationCap size={18} /> Launch Academic Hub</Link>
      </PageHero>

      <Section title="Academic services">
        <FeatureGrid items={[
          { icon: <GraduationCap size={20} />, title: "Academic Hub", desc: "AI tutoring, flashcards, quizzes, planning and discipline-specific science tools.", tone: "brand" },
          { icon: <FlaskConical size={20} />, title: "Science Labs", desc: "Virtual experiments, calculators and visualizers for Biology, Chemistry, Physics & Maths.", tone: "accent" },
          { icon: <BookOpen size={20} />, title: "Research Corner", desc: "Undergraduate research support, citation tools and paper summarisation.", tone: "gold" },
          { icon: <Newspaper size={20} />, title: "News & Blog", desc: "Departmental announcements, opportunities and science stories.", tone: "crimson" },
          { icon: <MessagesSquare size={20} />, title: "Discussion Forum", desc: "Ask questions, share resources and study together across departments.", tone: "brand" },
          { icon: <BarChart3 size={20} />, title: "Polls & Surveys", desc: "Have your say on academic policy and association decisions.", tone: "accent" },
        ]} />
      </Section>

      <Section id="courses" title="How study is organised" subtitle="Every student in the School of Natural Sciences shares a common first year, then specialises by programme from second year.">
        {/* Common first year */}
        <div className="mb-8">
          <h3 className="mb-1 text-lg font-bold text-forest dark:text-brand-300">Common first year</h3>
          <p className="mb-4 max-w-3xl text-sm text-ink-muted">
            All first-year students take the same four foundation courses. This year is also taken by students bound for
            health programmes at Ridgeway Campus and for Mines, Agriculture, Veterinary Medicine and Engineering — they
            pass through Natural Sciences in first year, then move to their school in second year. Health-programme
            students take designated <span className="inline-flex items-center gap-0.5 text-crimson-600"><Stethoscope size={12} /> health-stream</span> variants of Chemistry, Physics and Mathematics.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FIRST_YEAR.map((f) => (
              <div key={f.discipline} className="card p-5">
                <div className="mb-3 flex items-center gap-2 font-semibold"><span className="text-lg">{f.emoji}</span> {f.discipline}</div>
                <div className="flex items-start gap-2 text-sm">
                  <CourseCode code={f.general.code} />
                  <span className="text-ink-muted">{f.general.title}</span>
                </div>
                {f.healthStream && (
                  <div className="mt-2 flex items-start gap-2 text-sm">
                    <CourseCode code={f.healthStream.code} />
                    <span className="text-ink-muted">{f.healthStream.title}
                      <Stethoscope size={11} className="ml-1 inline align-middle text-crimson-600" />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="mb-8">
          <h3 className="mb-1 text-lg font-bold text-forest dark:text-brand-300">Departments</h3>
          <p className="mb-4 max-w-3xl text-sm text-ink-muted">From second year, courses are delivered by the School&apos;s five departments.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {DEPARTMENTS.map((d) => (
              <div key={d.name} className="card p-4">
                <div className="text-lg">{d.emoji}</div>
                <div className="mt-1 font-semibold leading-tight">{d.name}</div>
                <p className="mt-1 text-xs text-ink-muted">{d.blurb}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Programmes */}
        <div>
          <h3 className="mb-1 text-lg font-bold text-forest dark:text-brand-300">Programmes</h3>
          <p className="mb-4 max-w-3xl text-sm text-ink-muted">From second year a student follows their programme, registering for the courses its contributing departments require.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {PROGRAMMES.map((p) => (
              <div key={p.name} className={`card p-5 ${p.secondYear ? "lg:col-span-2" : ""}`}>
                <div className="flex items-center gap-2 font-semibold"><span className="text-lg">{p.emoji}</span> {p.name}
                  {!p.secondYear && <span className="ml-auto text-xs text-ink-faint">course list being compiled</span>}
                </div>
                {p.secondYear && (
                  <>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-faint">Second-year courses</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {p.secondYear.map((c) => (
                        <div key={c.title} className="flex items-start gap-2 text-sm">
                          <CourseCode code={c.code} />
                          <span className="text-ink-muted">{c.title} <span className="text-ink-faint">· {c.dept}</span></span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-faint">A living list — additions and corrections are welcome via the Academic Affairs Secretary. Courses shown without a code (—) are known by title pending confirmation.</p>
      </Section>

      <Section id="research" title="Research Corner" subtitle="Tools and support for undergraduate research.">
        <div className="card p-6">
          <p className="text-ink-muted">The Research Hub inside the Academic Hub provides a full citation manager (APA, Harvard, Vancouver, MLA, IEEE), DOI lookup, an AI paper summariser and a research notebook.</p>
          <Link href="/hub/science/research" className="btn-secondary mt-4"><ArrowRight size={15} /> Open Research Hub</Link>
        </div>
      </Section>

      <Section id="news" title="News & announcements">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Science Week 2026", "Registration open for the annual UNZANASA Science Week and project expo."],
            ["Research grants", "Applications invited for undergraduate research mini-grants this semester."],
            ["Exam timetable", "End-of-semester examination timetable published on the Member Portal."],
          ].map(([t, d]) => (
            <article key={t} className="card p-5"><div className="text-xs font-semibold text-brand-500">Announcement</div><h3 className="mt-1 font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-muted">{d}</p></article>
          ))}
        </div>
      </Section>

      <Section id="forum" title="Discussion forum">
        <div className="card p-6 text-center">
          <MessagesSquare size={28} className="mx-auto text-brand-500" />
          <p className="mt-2 text-ink-muted">Join the conversation with fellow science students. Threaded discussions and study groups live inside the Academic Hub's Social space.</p>
          <Link href="/hub/social" className="btn-primary mt-4"><ArrowRight size={15} /> Go to Social</Link>
        </div>
      </Section>
    </div>
  );
}
