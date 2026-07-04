"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, StickyNote, Layers, Brain, ListChecks,
  GraduationCap, MessageSquare, CalendarDays, LineChart, Trophy, Settings,
  Search, Menu, X, Flame, Sun, Moon, Monitor, Sparkles, Command,
  FileText, Network, Users, Shield, Cloud, CloudOff, RefreshCw,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useAccount } from "@/lib/account";
import { useTheme } from "@/components/theme";
import { globalSearch } from "@/lib/selectors";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ui";
import { useToast } from "@/components/ui";
import { ACHIEVEMENTS } from "@/lib/store";
import { Onboarding } from "@/components/onboarding";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: "due";
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "",
    items: [{ href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Learn",
    items: [
      { href: "/app/courses", label: "Courses", icon: BookOpen },
      { href: "/app/notes", label: "Notes", icon: StickyNote },
      { href: "/app/pdf", label: "PDF Learning", icon: FileText },
      { href: "/app/mindmaps", label: "Mind Maps", icon: Network },
    ],
  },
  {
    title: "Practice",
    items: [
      { href: "/app/flashcards", label: "Flashcards", icon: Layers },
      { href: "/app/review", label: "Review", icon: Brain, badge: "due" },
      { href: "/app/quizzes", label: "Quizzes", icon: ListChecks },
      { href: "/app/exams", label: "Exams", icon: GraduationCap },
    ],
  },
  {
    title: "Plan & AI",
    items: [
      { href: "/app/tutor", label: "AI Tutor", icon: MessageSquare },
      { href: "/app/planner", label: "Planner", icon: CalendarDays },
    ],
  },
  {
    title: "Progress",
    items: [
      { href: "/app/analytics", label: "Analytics", icon: LineChart },
      { href: "/app/achievements", label: "Achievements", icon: Trophy },
      { href: "/app/social", label: "Social", icon: Users },
    ],
  },
];

// Flattened list for the command palette.
const NAV = NAV_SECTIONS.flatMap((s) => s.items);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, ready, justUnlocked, clearUnlocked } = useStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const toast = useToast();

  const dueCount = useMemo(
    () => state.cards.filter((c) => c.srs.due <= Date.now()).length,
    [state.cards],
  );
  const progress = levelProgress(state.game.xp);

  // ⌘K / Ctrl-K command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  // Surface achievement unlocks as toasts.
  useEffect(() => {
    if (justUnlocked.length === 0) return;
    justUnlocked.forEach((id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) toast({ emoji: a.emoji, title: "Achievement unlocked!", description: `${a.name} · +${a.coins} coins` });
    });
    clearUnlocked();
  }, [justUnlocked, toast, clearUnlocked]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const ThemeIcon = themeIcon;
  const cycleTheme = () => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/app" className="flex items-center gap-2.5 px-2 py-1">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow">
          <Brain size={20} />
        </div>
        <div>
          <div className="text-lg font-bold leading-none tracking-tight">Cognify</div>
          <div className="text-[11px] text-ink-faint">Learn anything, faster</div>
        </div>
      </Link>

      <nav className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{section.title}</div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, "exact" in item ? item.exact : false);
                return (
                  <Link key={item.href} href={item.href} className={cn("nav-link", active && "nav-link-active")}>
                    <Icon size={18} className={active ? "text-brand-500" : ""} />
                    <span className="flex-1">{item.label}</span>
                    {"badge" in item && item.badge === "due" && dueCount > 0 && (
                      <span className="chip bg-rose-500/15 text-rose-500 tabular-nums">{dueCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {state.profile.role === "admin" && (
          <div>
            <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Manage</div>
            <Link href="/app/admin" className={cn("nav-link", isActive("/app/admin") && "nav-link-active")}>
              <Shield size={18} /> <span>Admin</span>
            </Link>
          </div>
        )}
      </nav>

      <Link
        href="/app/settings"
        className={cn("nav-link mt-2", isActive("/app/settings") && "nav-link-active")}
      >
        <Settings size={18} />
        <span>Settings</span>
      </Link>

      {/* Level / streak card */}
      <div className="mt-3 rounded-2xl border border-edge bg-surface-raised p-3">
        <div className="flex items-center gap-3">
          <ProgressRing value={progress.pctToNext} size={46} stroke={5}>
            <span className="text-xs font-bold">{progress.level}</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{levelTitle(progress.level)}</div>
            <div className="text-[11px] text-ink-faint">
              {progress.into}/{progress.needed} XP to L{progress.level + 1}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Flame size={16} className="text-amber-500" />
            <span className="text-xs font-bold tabular-nums">{state.game.streak.current}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-edge bg-surface/60 px-3 py-4 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside
              className="absolute left-0 top-0 h-full w-72 border-r border-edge bg-surface px-3 py-4"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-edge bg-surface/70 px-4 py-3 backdrop-blur-xl">
          <button className="btn-ghost btn-sm lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex flex-1 items-center gap-2 rounded-xl border border-edge bg-surface-raised px-3.5 py-2 text-sm text-ink-faint transition hover:border-edge-strong sm:max-w-md"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search notes, cards, courses…</span>
            <kbd className="hidden items-center gap-0.5 rounded-md border border-edge px-1.5 py-0.5 text-[10px] font-medium text-ink-faint sm:inline-flex">
              <Command size={10} />K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <SyncBadge />
            <Link href="/app/tutor" className="btn-primary btn-sm hidden sm:inline-flex">
              <Sparkles size={15} /> Ask AI
            </Link>
            <button onClick={cycleTheme} className="btn-ghost btn-sm" aria-label="Toggle theme" title={`Theme: ${theme}`}>
              <ThemeIcon size={18} />
            </button>
            <Link href="/app/settings" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500/20 to-teal-500/20 text-lg" title={state.profile.name}>
              {state.profile.avatar}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {ready ? children : <ShellSkeleton />}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={(href) => { setPaletteOpen(false); router.push(href); }} />

      {ready && !state.onboarded && <Onboarding />}
    </div>
  );
}

function SyncBadge() {
  const { user, status, syncNow } = useAccount();
  if (!user) {
    return (
      <Link href="/login" className="btn-ghost btn-sm hidden text-ink-faint sm:inline-flex" title="Sign in to sync across devices">
        <CloudOff size={16} /> <span className="hidden md:inline">Guest</span>
      </Link>
    );
  }
  const icon =
    status === "syncing" ? <RefreshCw size={16} className="animate-spin" /> :
    status === "offline" || status === "error" ? <CloudOff size={16} /> :
    <Cloud size={16} />;
  const label = status === "syncing" ? "Syncing…" : status === "offline" ? "Offline" : status === "error" ? "Retry sync" : "Synced";
  const tone = status === "error" ? "text-rose-500" : status === "offline" ? "text-amber-500" : "text-teal-500";
  return (
    <button onClick={() => syncNow()} className={cn("btn-ghost btn-sm hidden sm:inline-flex", tone)} title={`Cloud sync: ${label} (${user.email})`}>
      {icon} <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
      </div>
      <div className="skeleton h-64" />
    </div>
  );
}

function CommandPalette({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (href: string) => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const results = useMemo(() => (q ? globalSearch(state, q, 12) : []), [q, state]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const quick = NAV.map((n) => ({ href: n.href, label: n.label, icon: n.icon }));
  const filteredQuick = q ? quick.filter((x) => x.label.toLowerCase().includes(q.toLowerCase())) : quick.slice(0, 6);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="relative w-full max-w-xl glass overflow-hidden rounded-2xl shadow-lift"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
          >
            <div className="flex items-center gap-2 border-b border-edge px-4">
              <Search size={18} className="text-ink-faint" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search or jump to…"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-ink-faint"
              />
              <button onClick={onClose} className="btn-ghost btn-sm"><X size={16} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredQuick.length > 0 && (
                <div className="mb-1 px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Go to</div>
              )}
              {filteredQuick.map((x) => {
                const Icon = x.icon;
                return (
                  <button key={x.href} onClick={() => onNavigate(x.href)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface">
                    <Icon size={16} className="text-ink-muted" /> {x.label}
                  </button>
                );
              })}
              {results.length > 0 && (
                <div className="mb-1 mt-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Results</div>
              )}
              {results.map((r) => (
                <button key={r.type + r.id} onClick={() => onNavigate(r.href)} className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface">
                  <span className="chip bg-surface text-ink-faint shrink-0 capitalize">{r.type}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.title}</span>
                    <span className="block truncate text-xs text-ink-faint">{r.snippet}</span>
                  </span>
                </button>
              ))}
              {q && results.length === 0 && filteredQuick.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-ink-faint">No results for “{q}”.</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
