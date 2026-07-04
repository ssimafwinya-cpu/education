"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap, ArrowRight, FlaskConical, Atom, Calculator, Dna,
  BookOpen, Users, Trophy, HeartHandshake, CalendarDays, Microscope,
  Brain, Sparkles, ChevronRight,
} from "lucide-react";
import { PageHero, Section, StatBand, FeatureGrid } from "@/components/public/sections";

const DISCIPLINES = [
  { icon: <Dna size={22} />, title: "Biology AI", desc: "Cell & histology labeling, genetics solver, DNA/protein visualization, taxonomy assistant.", tone: "brand", href: "/hub/science/biology" },
  { icon: <FlaskConical size={22} />, title: "Chemistry AI", desc: "Molecule viewers, equation balancer, stoichiometry, pH & titration, periodic table.", tone: "accent", href: "/hub/science/chemistry" },
  { icon: <Atom size={22} />, title: "Physics AI", desc: "Kinematics & projectile simulators, circuits, vectors, unit converter, scientific calculator.", tone: "gold", href: "/hub/science/physics" },
  { icon: <Calculator size={22} />, title: "Mathematics AI", desc: "Algebra & calculus solvers, matrices, statistics, graphing, step-by-step reasoning.", tone: "crimson", href: "/hub/science/mathematics" },
  { icon: <Microscope size={22} />, title: "Lab Assistant", desc: "Virtual experiments, reagent calculators, methodology feedback, AI lab-report generator.", tone: "brand", href: "/hub/science/lab" },
  { icon: <BookOpen size={22} />, title: "Research Hub", desc: "Citation manager (APA/Harvard/Vancouver/MLA/IEEE), DOI lookup, paper summariser.", tone: "accent", href: "/hub/science/research" },
];

export default function Home() {
  return (
    <div>
      <PageHero
        eyebrow="University of Zambia · School of Natural Sciences"
        title="The digital home of every Natural Sciences student"
        subtitle="UNZANASA unites association services with an AI-powered Academic Hub built specifically for science students — study, collaborate, run virtual labs, and prepare for exams through one account."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/hub" className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-base font-semibold text-forest transition hover:brightness-105">
            <GraduationCap size={19} /> Enter the Academic Hub
          </Link>
          <Link href="/portal" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15">
            Member Portal <ArrowRight size={17} />
          </Link>
        </div>
      </PageHero>

      {/* Stats */}
      <Section className="!py-10">
        <StatBand stats={[
          { value: "4,200+", label: "Natural Sciences students" },
          { value: "6", label: "Departments served" },
          { value: "40+", label: "AI science tools" },
          { value: "1", label: "Unified student account" },
        ]} />
      </Section>

      {/* Academic Hub highlight */}
      <Section>
        <div className="glass overflow-hidden rounded-3xl border border-edge p-1 shadow-lift">
          <div className="grid gap-6 rounded-[1.35rem] bg-surface p-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/12 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
                <Sparkles size={13} /> AI Academic Hub
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Your personal science tutor, lab and study workspace</h2>
              <p className="mt-3 text-ink-muted">
                Tutoring grounded in your own notes, spaced-repetition flashcards, oral quizzes, an AI study planner, and discipline-specific tools for Biology, Chemistry, Physics and Mathematics — all in one place.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["AI Tutor", "Flashcards (FSRS)", "Oral Quizzes", "Study Planner", "Lab Reports", "Virtual Labs"].map((t) => (
                  <span key={t} className="chip bg-brand-500/10 text-brand-600 dark:text-brand-300">{t}</span>
                ))}
              </div>
              <Link href="/hub" className="btn-primary mt-6"><Brain size={16} /> Open the hub</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Dna, k: "Biology", tone: "brand" },
                { icon: FlaskConical, k: "Chemistry", tone: "accent" },
                { icon: Atom, k: "Physics", tone: "gold" },
                { icon: Calculator, k: "Mathematics", tone: "crimson" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <Link key={c.k} href="/hub" className="card card-hover flex flex-col items-center gap-2 py-6 text-center">
                    <div className={`grid h-12 w-12 place-items-center rounded-xl bg-${c.tone}-500/12 text-${c.tone}-500`}><Icon size={24} /></div>
                    <span className="text-sm font-semibold">{c.k}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* Discipline tools */}
      <Section title="AI tools for every discipline" subtitle="Purpose-built for undergraduate science education — not a generic study app.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DISCIPLINES.map((d, i) => (
            <motion.div key={d.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.05 }}>
              <Link href={d.href}>
                <div className="card card-hover h-full p-6">
                  <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-${d.tone}-500/12 text-${d.tone}-500`}>{d.icon}</div>
                  <h3 className="flex items-center gap-1.5 text-lg font-semibold">{d.title} <ChevronRight size={15} className="text-ink-faint" /></h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{d.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Association pillars */}
      <Section title="More than study tools" subtitle="UNZANASA supports the whole student — academics, welfare, sport and community.">
        <FeatureGrid items={[
          { icon: <Users size={20} />, title: "Community & Forums", desc: "Discussion boards, study groups and peer support across all six departments.", tone: "brand" },
          { icon: <CalendarDays size={20} />, title: "Events & Conferences", desc: "Science week, career fairs, outreach programmes and the academic calendar.", tone: "accent" },
          { icon: <Trophy size={20} />, title: "Sports & Recreation", desc: "Inter-department leagues, tournaments and the UNZANASA sports programme.", tone: "gold" },
          { icon: <HeartHandshake size={20} />, title: "Welfare & Support", desc: "Student welfare, mentorship, counselling links and financial-aid information.", tone: "crimson" },
          { icon: <BookOpen size={20} />, title: "Research Corner", desc: "Undergraduate research support, publications and the citation toolkit.", tone: "brand" },
          { icon: <GraduationCap size={20} />, title: "Alumni Network", desc: "Stay connected with graduates and mentors across science careers.", tone: "accent" },
        ]} />
      </Section>

      {/* CTA */}
      <Section className="!pb-20">
        <div className="relative overflow-hidden rounded-3xl px-8 py-12 text-center text-white shadow-lift" style={{ background: "linear-gradient(135deg,#0b4030,#0f766e)" }}>
          <GraduationCap size={30} className="mx-auto text-gold" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">One account. Your entire science degree.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">Join thousands of UNZA Natural Sciences students studying smarter with UNZANASA.</p>
          <Link href="/hub" className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-base font-semibold text-forest transition hover:brightness-105">
            Get started free <ArrowRight size={18} />
          </Link>
        </div>
      </Section>
    </div>
  );
}
