"use client";

// Renders the programmes list on the public Academics page from the
// admin-managed catalogue in the store (falls back to the built-in defaults
// for guests / first visits). Editing happens in the Admin console.

import { useStore } from "@/lib/store";
import { programmesOf } from "@/lib/courses-catalogue";

function CourseCode({ code }: { code?: string }) {
  return code
    ? <span className="shrink-0 rounded-md bg-brand-500/12 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-600 dark:text-brand-300">{code}</span>
    : <span className="shrink-0 rounded-md border border-edge px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">—</span>;
}

export function ProgrammesSection() {
  const { state } = useStore();
  const programmes = programmesOf(state);

  return (
    <div>
      <h3 className="mb-1 text-lg font-bold text-forest dark:text-brand-300">Programmes</h3>
      <p className="mb-4 max-w-3xl text-sm text-ink-muted">From second year a student follows their programme, registering for the courses its contributing departments require.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {programmes.map((p) => {
          const hasCourses = p.courses.length > 0;
          return (
            <div key={p.id} className={`card p-5 ${hasCourses ? "lg:col-span-2" : ""}`}>
              <div className="flex items-center gap-2 font-semibold"><span className="text-lg">{p.emoji}</span> {p.name}
                {!hasCourses && <span className="ml-auto text-xs text-ink-faint">course list being compiled</span>}
              </div>
              {hasCourses && (
                <>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-faint">Second-year courses</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {p.courses.map((c) => (
                      <div key={c.id} className="flex items-start gap-2 text-sm">
                        <CourseCode code={c.code} />
                        <span className="text-ink-muted">{c.title} <span className="text-ink-faint">· {c.dept}</span></span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-ink-faint">A living list, maintained by the Academic Affairs Secretary through the Admin console. Courses shown without a code (—) are known by title pending confirmation.</p>
    </div>
  );
}
