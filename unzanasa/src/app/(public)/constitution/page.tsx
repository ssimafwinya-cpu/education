import type { Metadata } from "next";
import { FileDown, Scale, Landmark } from "lucide-react";
import { PageHero, Section } from "@/components/public/sections";
import { CONSTITUTION, CONSTITUTION_META, DEFINITIONS, type Block, type ListItem, type ListStyle } from "@/lib/constitution";

export const metadata: Metadata = {
  title: "Constitution — UNZANASA",
  description: "The Constitution of the University of Zambia School of Natural Sciences Student Association (UNZANASA): objectives, membership, organs, the Executive Committee, discipline, finance and amendment.",
};

const LIST_CLASS: Record<ListStyle, string> = {
  decimal: "list-decimal",
  alpha: "list-[lower-alpha]",
  roman: "list-[lower-roman]",
};

function RenderItems({ items, style }: { items: ListItem[]; style: ListStyle }) {
  return (
    <ol className={`${LIST_CLASS[style]} ml-5 space-y-1.5`}>
      {items.map((it, i) => (
        <li key={i} className="pl-1 text-sm leading-relaxed text-ink-muted">
          {it.text}
          {it.sub && <div className="mt-1.5"><RenderItems items={it.sub.items} style={it.sub.style} /></div>}
        </li>
      ))}
    </ol>
  );
}

function RenderBlock({ block }: { block: Block }) {
  if (block.kind === "p") return <p className="text-sm leading-relaxed text-ink-muted">{block.text}</p>;
  return <RenderItems items={block.items} style={block.style} />;
}

export default function ConstitutionPage() {
  return (
    <div>
      <PageHero
        eyebrow="Governance"
        title="The UNZANASA Constitution"
        subtitle="The supreme law of the University of Zambia School of Natural Sciences Student Association — binding on all students and leaders under the School, subject to the UNZASU Constitution, the Constitution of Zambia and the Higher Education Act."
      />

      <Section className="!pt-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <a href={CONSTITUTION_META.pdf} download className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
            <FileDown size={16} /> Download the official PDF
          </a>
          <span className="text-xs text-ink-faint">Approved by the Dean of the School of Natural Sciences, the UNZANASA President and the Constitution Review.</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Scale size={15} className="text-brand-500" /> Contents</div>
              <nav className="space-y-3 text-sm">
                <a href="#definitions" className="block text-ink-muted transition hover:text-brand-600 dark:hover:text-brand-300">Definitions</a>
                {CONSTITUTION.map((part) => (
                  <div key={part.id}>
                    <a href={`#${part.id}`} className="block font-medium text-ink transition hover:text-brand-600 dark:hover:text-brand-300">{part.title}</a>
                    <div className="mt-1 space-y-1 border-l border-edge pl-3">
                      {part.articles.map((a) => (
                        <a key={a.id} href={`#${a.id}`} className="block text-xs text-ink-muted transition hover:text-brand-600 dark:hover:text-brand-300">{a.title}</a>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Full text */}
          <div className="min-w-0 space-y-10">
            <section id="definitions" className="scroll-mt-24">
              <h2 className="mb-4 text-xl font-bold tracking-tight">Definition Section</h2>
              <dl className="space-y-3">
                {DEFINITIONS.map((d) => (
                  <div key={d.term} className="rounded-xl border border-edge bg-surface p-4">
                    <dt className="text-sm font-semibold text-brand-600 dark:text-brand-300">“{d.term}”</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{d.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {CONSTITUTION.map((part) => (
              <section key={part.id} id={part.id} className="scroll-mt-24">
                <div className="mb-5 flex items-center gap-2.5 border-b border-edge pb-3">
                  <Landmark size={18} className="shrink-0 text-brand-500" />
                  <h2 className="text-xl font-bold tracking-tight">{part.title}</h2>
                </div>
                <div className="space-y-8">
                  {part.articles.map((article) => (
                    <article key={article.id} id={article.id} className="scroll-mt-24">
                      <h3 className="mb-3 font-semibold text-ink">{article.title}</h3>
                      <div className="space-y-3">
                        {article.blocks.map((b, i) => <RenderBlock key={i} block={b} />)}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-xl border border-edge bg-surface p-5">
              <h3 className="font-semibold">Approved by</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {CONSTITUTION_META.approvals.map((a) => (
                  <div key={a.role}>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-ink-muted">{a.role}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </Section>
    </div>
  );
}
