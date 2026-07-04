"use client";

// ─── UNZANASA public site shell ──────────────────────────────────────────────
// The association-facing chrome: the signature navy-green navbar with dropdowns,
// a day/night toggle, and the footer. Faithful to the original UNZANASA site
// and consistent with the Academic Hub (which reuses the same theme + account).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, GraduationCap, ChevronDown } from "lucide-react";
import { Brand } from "./brand";
import { useTheme } from "@/components/theme";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  drop?: { label: string; href: string }[];
}

const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    drop: [
      { label: "Our History", href: "/about" },
      { label: "Executive Committee", href: "/about#executive" },
      { label: "Constitution", href: "/about#constitution" },
      { label: "Partners & Sponsors", href: "/about#partners" },
    ],
  },
  {
    label: "Academics",
    href: "/academics",
    drop: [
      { label: "Academic Hub", href: "/hub" },
      { label: "Research Corner", href: "/academics#research" },
      { label: "News & Blog", href: "/academics#news" },
      { label: "Discussion Forum", href: "/academics#forum" },
    ],
  },
  {
    label: "Events",
    href: "/events",
    drop: [
      { label: "Events Calendar", href: "/events" },
      { label: "Conferences", href: "/events#conferences" },
      { label: "Outreach Programs", href: "/events#outreach" },
      { label: "Photo Gallery", href: "/events#gallery" },
    ],
  },
  { label: "Sports", href: "/sports" },
  { label: "Welfare", href: "/welfare" },
  { label: "Alumni", href: "/alumni" },
  { label: "Contact", href: "/contact" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, resolved, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-40" style={{ background: "linear-gradient(90deg,#052e20,#0b4030)" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6">
          <Brand />
          <ul className="ml-auto hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <li key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white",
                    active(item.href) && "text-gold",
                  )}
                >
                  {item.label}
                  {item.drop && <ChevronDown size={13} className="opacity-70" />}
                </Link>
                {item.drop && (
                  <div className="invisible absolute left-0 top-full min-w-[200px] rounded-xl border border-black/5 bg-white p-1.5 opacity-0 shadow-lift transition-all group-hover:visible group-hover:opacity-100 dark:bg-surface-raised">
                    {item.drop.map((d) => (
                      <Link key={d.label} href={d.href} className="block rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-brand-500/10 hover:text-ink">
                        {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
            <li>
              <Link href="/portal" className="ml-1 rounded-lg bg-crimson px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-crimson-700">
                Member Portal
              </Link>
            </li>
            <li>
              <Link href="/hub" className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-forest transition hover:brightness-105">
                <GraduationCap size={15} /> Academic Hub
              </Link>
            </li>
          </ul>

          <button
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            className="ml-auto rounded-lg p-2 text-white/80 transition hover:bg-white/10 lg:ml-2"
            title="Toggle day / night"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="rounded-lg p-2 text-white lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div
              className="absolute right-0 top-0 h-full w-72 overflow-y-auto p-4"
              style={{ background: "#052e20" }}
              initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <Brand compact />
                <button onClick={() => setMobileOpen(false)} className="text-white"><X size={20} /></button>
              </div>
              <div className="space-y-1">
                {NAV.map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">
                    {item.label}
                  </Link>
                ))}
                <Link href="/portal" onClick={() => setMobileOpen(false)} className="mt-2 block rounded-lg bg-crimson px-3 py-2.5 text-center text-sm font-semibold text-white">Member Portal</Link>
                <Link href="/hub" onClick={() => setMobileOpen(false)} className="block rounded-lg bg-gold px-3 py-2.5 text-center text-sm font-semibold text-forest">Academic Hub</Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="mt-16 text-white" style={{ background: "linear-gradient(180deg,#0b4030,#052e20)" }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-sm text-white/60">
              The official association of Natural Sciences students at the University of Zambia — advancing academic excellence, welfare and community.
            </p>
          </div>
          <FooterCol title="Explore" links={[["About", "/about"], ["Academics", "/academics"], ["Events", "/events"], ["Sports", "/sports"]]} />
          <FooterCol title="Students" links={[["Academic Hub", "/hub"], ["Member Portal", "/portal"], ["Welfare", "/welfare"], ["Alumni", "/alumni"]]} />
          <FooterCol title="Connect" links={[["Contact", "/contact"], ["Research Corner", "/academics#research"], ["Discussion Forum", "/academics#forum"]]} />
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} UNZANASA · University of Zambia Natural Sciences Student Association · School of Natural Sciences
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-gold">{title}</div>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-white/60 transition hover:text-white">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
