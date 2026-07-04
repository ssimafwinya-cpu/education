"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Page hero band with the UNZANASA forest gradient. */
export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg,#052e20 0%,#0b4030 55%,#0f766e 100%)" }}>
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {eyebrow && <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-gold ring-1 ring-white/15">{eyebrow}</div>}
          <h1 className="max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-pretty text-lg text-white/75">{subtitle}</p>}
          {children && <div className="mt-7">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}

export function Section({ title, subtitle, children, className, id }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-6 py-14", className)}>
      {(title || subtitle) && (
        <div className="mb-8 max-w-2xl">
          {title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>}
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatBand({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="card p-5 text-center">
          <div className="text-2xl font-extrabold text-brand-500 sm:text-3xl">{s.value}</div>
          <div className="mt-1 text-xs text-ink-muted sm:text-sm">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export function FeatureGrid({ items }: { items: { icon: React.ReactNode; title: string; desc: string; tone?: string }[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((f, i) => (
        <motion.div key={f.title} className="card card-hover p-6" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.4, delay: i * 0.05 }}>
          <div className={cn("mb-4 grid h-11 w-11 place-items-center rounded-xl", `bg-${f.tone ?? "brand"}-500/12 text-${f.tone ?? "brand"}-500`)}>{f.icon}</div>
          <h3 className="text-lg font-semibold">{f.title}</h3>
          <p className="mt-1.5 text-sm text-ink-muted">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}
