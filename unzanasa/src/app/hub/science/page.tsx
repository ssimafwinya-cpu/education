"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FlaskConical, Dna, Atom, Calculator, Microscope, BookOpen, Code2,
  ArrowRight, Sparkles, Beaker,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const DISCIPLINES = [
  {
    href: "/hub/science/biology", icon: Dna, title: "Biology AI", tone: "brand",
    desc: "DNA/RNA toolkit, translation, genetics (Punnett & Hardy-Weinberg), GC content, taxonomy assistant.",
    tools: ["DNA Toolkit", "Codon Translator", "Punnett Square", "Hardy-Weinberg"],
  },
  {
    href: "/hub/science/chemistry", icon: FlaskConical, title: "Chemistry AI", tone: "accent",
    desc: "Interactive periodic table, molar mass, equation balancer, pH & stoichiometry calculators.",
    tools: ["Periodic Table", "Equation Balancer", "Molar Mass", "pH Calculator"],
  },
  {
    href: "/hub/science/physics", icon: Atom, title: "Physics AI", tone: "gold",
    desc: "Kinematics solver, projectile simulator, Ohm's law, vectors, unit converter, constants.",
    tools: ["Projectile Sim", "Kinematics", "Ohm's Law", "Unit Converter"],
  },
  {
    href: "/hub/science/mathematics", icon: Calculator, title: "Mathematics AI", tone: "crimson",
    desc: "Quadratic solver, matrix calculator, statistics, numerical calculus with steps.",
    tools: ["Quadratic Solver", "Matrix Calc", "Statistics", "Calculus"],
  },
  {
    href: "/hub/science/lab", icon: Microscope, title: "Lab Assistant", tone: "brand",
    desc: "AI lab-report generator, reagent & solution calculators, methodology guidance.",
    tools: ["Lab Report", "Solution Prep", "Safety Notes"],
  },
  {
    href: "/hub/science/research", icon: BookOpen, title: "Research Hub", tone: "accent",
    desc: "Citation generator (APA/Harvard/Vancouver/MLA/IEEE), DOI formatter, reference organizer.",
    tools: ["Citations ×5", "DOI Lookup", "References"],
  },
];

export default function ScienceHub() {
  return (
    <div>
      <PageHeader
        title="Science Labs"
        description="Discipline-specific AI tools built for the School of Natural Sciences — compute, visualize, simulate and cite."
        icon={<FlaskConical className="text-brand-500" />}
        actions={<Badge tone="brand"><Sparkles size={12} /> 30+ tools</Badge>}
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {DISCIPLINES.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.div key={d.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={d.href}>
                <Card hover className="flex h-full flex-col">
                  <div className={cn("mb-4 grid h-12 w-12 place-items-center rounded-xl", `bg-${d.tone}-500/12 text-${d.tone}-500`)}>
                    <Icon size={24} />
                  </div>
                  <h2 className="flex items-center gap-1.5 text-lg font-semibold">{d.title} <ArrowRight size={15} className="text-ink-faint" /></h2>
                  <p className="mt-1.5 flex-1 text-sm text-ink-muted">{d.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.tools.map((t) => <span key={t} className={cn("chip", `bg-${d.tone}-500/10 text-${d.tone}-600 dark:text-${d.tone}-300`)}>{t}</span>)}
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* CS teaser */}
      <div className="mt-6">
        <Card className="flex flex-wrap items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/12 text-violet-500"><Code2 size={24} /></div>
          <div className="flex-1">
            <h2 className="font-semibold">Computer Science tools</h2>
            <p className="text-sm text-ink-muted">Code editor, algorithm visualizers and a programming tutor live inside the AI Tutor and Notes code blocks — with a dedicated CS workspace coming next.</p>
          </div>
          <Link href="/hub/tutor" className="btn-secondary"><Beaker size={15} /> Open AI Tutor</Link>
        </Card>
      </div>
    </div>
  );
}
