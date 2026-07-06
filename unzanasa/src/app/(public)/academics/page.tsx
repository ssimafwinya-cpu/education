import Link from "next/link";
import { PageHero, Section, FeatureGrid } from "@/components/public/sections";
import { GraduationCap, BookOpen, Newspaper, MessagesSquare, BarChart3, FlaskConical, ArrowRight, Stethoscope } from "lucide-react";
import { COURSE_CATALOGUE, CATALOGUE_COURSE_COUNT } from "@/lib/courses-catalogue";

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

      <Section id="courses" title="Course catalogue" subtitle={`${CATALOGUE_COURSE_COUNT} undergraduate courses across the School of Natural Sciences — compiled from the departments. Medical-programme students follow dedicated first-year streams.`}>
        <div className="space-y-8">
          {COURSE_CATALOGUE.map((yr) => (
            <div key={yr.year}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-bold text-forest dark:text-brand-300">{yr.year}</h3>
                <p className="text-sm text-ink-muted">{yr.blurb}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {yr.disciplines.map((disc) => (
                  <div key={disc.discipline} className="card p-5">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <span className="text-lg">{disc.emoji}</span> {disc.discipline}
                    </div>
                    <ul className="space-y-2">
                      {disc.courses.map((c) => (
                        <li key={(c.code ?? "") + c.title} className="flex items-start gap-2 text-sm">
                          {c.code
                            ? <span className="mt-0.5 shrink-0 rounded-md bg-brand-500/12 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-600 dark:text-brand-300">{c.code}</span>
                            : <span className="mt-0.5 shrink-0 rounded-md border border-edge px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">—</span>}
                          <span className="text-ink-muted">
                            {c.title}
                            {c.medical && <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-xs text-crimson-600"><Stethoscope size={11} /> medical</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-ink-faint">A living list — additions and corrections are welcome via the Academic Affairs Secretary. Courses shown without a code are known by title pending confirmation.</p>
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
