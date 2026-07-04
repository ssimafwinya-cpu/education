"use client";

import Link from "next/link";
import { PageHero, Section } from "@/components/public/sections";
import { useAccount } from "@/lib/account";
import { GraduationCap, LogIn, LayoutDashboard, FlaskConical, BookOpen, CreditCard, Bell, ArrowRight, Cloud } from "lucide-react";

export default function Portal() {
  const { user } = useAccount();

  return (
    <div>
      <PageHero
        eyebrow="Member Portal"
        title={user ? `Welcome back, ${user.name.split(" ")[0] || "member"}` : "One account for everything UNZANASA"}
        subtitle="Your single sign-on to the Academic Hub, science tools, association services and membership — all under one login."
      >
        {user ? (
          <Link href="/hub" className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-forest transition hover:brightness-105"><LayoutDashboard size={18} /> Open my dashboard</Link>
        ) : (
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-forest transition hover:brightness-105"><LogIn size={18} /> Sign in / Register</Link>
        )}
      </PageHero>

      <Section title="Your portal">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: GraduationCap, t: "Academic Hub", d: "AI tutor, flashcards, quizzes and planning.", href: "/hub", tone: "brand" },
            { Icon: FlaskConical, t: "Science Labs", d: "Discipline tools for Bio, Chem, Physics, Maths.", href: "/hub/science", tone: "accent" },
            { Icon: BookOpen, t: "Research Hub", d: "Citations, DOI lookup and paper tools.", href: "/hub/science/research", tone: "gold" },
            { Icon: LayoutDashboard, t: "My Dashboard", d: "Streak, XP, reviews due and study plan.", href: "/hub", tone: "crimson" },
            { Icon: CreditCard, t: "Membership", d: "Your UNZANASA membership status & benefits.", href: "/portal", tone: "brand" },
            { Icon: Bell, t: "Notifications", d: "Announcements, exam dates and reminders.", href: "/hub", tone: "accent" },
          ].map(({ Icon, t, d, href, tone }) => (
            <Link key={t} href={href}>
              <div className="card card-hover h-full p-6">
                <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-${tone}-500/12 text-${tone}-500`}><Icon size={20} /></div>
                <h3 className="flex items-center gap-1.5 font-semibold">{t} <ArrowRight size={14} className="text-ink-faint" /></h3>
                <p className="mt-1 text-sm text-ink-muted">{d}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="!pb-16">
        <div className="card flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-500"><Cloud size={22} /></div>
          <div className="flex-1">
            <h3 className="font-semibold">One login, synced everywhere</h3>
            <p className="text-sm text-ink-muted">Your notes, flashcards, progress and association profile follow you across every device — powered by a single UNZANASA account.</p>
          </div>
          {!user && <Link href="/login" className="btn-primary shrink-0">Create free account</Link>}
        </div>
      </Section>
    </div>
  );
}
