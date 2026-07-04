"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Palette, Bell, Brain, Shield, Database, Trash2, Check,
  Sun, Moon, Monitor, Download, Upload, RotateCcw, Sparkles, LogOut,
} from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useAccount } from "@/lib/account";
import { useTheme } from "@/components/theme";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, useToast, Modal, ConfirmButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/lib/types";

const AVATARS = ["🦊", "🦉", "🐧", "🦁", "🐨", "🐼", "🦅", "🐙", "🦋", "🐢", "🦄", "🐰"];

export default function SettingsPage() {
  const { state, dispatch } = useStore();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const s = state.profile.settings;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cognify-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ emoji: "📦", title: "Data exported", description: "Your backup has been downloaded." });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your profile, appearance, study preferences and data." icon={<User className="text-brand-500" />} />

      {/* Account & sync */}
      <AccountSection />

      {/* Profile */}
      <SettingsSection icon={<User size={17} />} title="Profile">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-5xl">{state.profile.avatar}</div>
          <div className="flex-1 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-medium text-ink-muted">Name</label><input value={state.profile.name} onChange={(e) => dispatch({ type: "UPDATE_PROFILE", patch: { name: e.target.value } })} className="input" /></div>
              <div><label className="mb-1 block text-xs font-medium text-ink-muted">Email</label><input value={state.profile.email} onChange={(e) => dispatch({ type: "UPDATE_PROFILE", patch: { email: e.target.value } })} className="input" /></div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Avatar</label>
          <div className="flex flex-wrap gap-1.5">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => dispatch({ type: "UPDATE_PROFILE", patch: { avatar: a } })} className={cn("grid h-10 w-10 place-items-center rounded-xl text-xl transition", state.profile.avatar === a ? "bg-brand-500/15 ring-2 ring-brand-500" : "hover:bg-surface")}>{a}</button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection icon={<Palette size={17} />} title="Appearance">
        <label className="mb-1.5 block text-xs font-medium text-ink-muted">Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {([["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]] as [ThemeMode, typeof Sun, string][]).map(([val, Icon, label]) => (
            <button key={val} onClick={() => { setTheme(val); dispatch({ type: "UPDATE_SETTINGS", patch: { theme: val } }); }} className={cn("flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 transition", theme === val ? "border-brand-500 bg-brand-500/10" : "border-edge hover:border-edge-strong")}>
              <Icon size={20} className={theme === val ? "text-brand-500" : "text-ink-muted"} /> <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center justify-between rounded-xl border border-edge p-3">
          <div><div className="text-sm font-medium">Reduce motion</div><div className="text-xs text-ink-faint">Minimise animations and transitions</div></div>
          <Toggle checked={s.reducedMotion} onChange={(v) => { dispatch({ type: "UPDATE_SETTINGS", patch: { reducedMotion: v } }); document.documentElement.classList.toggle("reduce-motion", v); }} />
        </label>
      </SettingsSection>

      {/* Study preferences */}
      <SettingsSection icon={<Brain size={17} />} title="Study preferences">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Daily review target (cards)</label>
            <input type="number" min={5} max={500} value={s.dailyReviewTarget} onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", patch: { dailyReviewTarget: +e.target.value } })} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Daily study target (min)</label>
            <input type="number" min={10} max={600} step={5} value={s.dailyStudyMinutesTarget} onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", patch: { dailyStudyMinutesTarget: +e.target.value } })} className="input" />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>FSRS desired retention</span>
            <Badge tone="brand">{Math.round(s.desiredRetention * 100)}%</Badge>
          </label>
          <input type="range" min={0.8} max={0.97} step={0.01} value={s.desiredRetention} onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", patch: { desiredRetention: +e.target.value } })} className="w-full accent-brand-500" />
          <div className="mt-1 flex justify-between text-[11px] text-ink-faint"><span>Fewer reviews (80%)</span><span>Higher retention (97%)</span></div>
          <p className="mt-2 text-xs text-ink-muted">Higher retention means the scheduler shows cards more often. 90% is the recommended balance.</p>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={<Bell size={17} />} title="Notifications">
        {([
          ["reviewReminders", "Review reminders", "Daily nudge when cards are due"],
          ["examReminders", "Exam reminders", "Countdown alerts before exams"],
          ["achievementAlerts", "Achievement alerts", "Celebrate unlocked badges"],
          ["motivational", "Motivational messages", "Encouragement to keep your streak"],
        ] as const).map(([key, title, desc]) => (
          <label key={key} className="flex items-center justify-between border-b border-edge py-3 last:border-0">
            <div><div className="text-sm font-medium">{title}</div><div className="text-xs text-ink-faint">{desc}</div></div>
            <Toggle checked={s.notifications[key]} onChange={(v) => dispatch({ type: "UPDATE_SETTINGS", patch: { notifications: { ...s.notifications, [key]: v } } })} />
          </label>
        ))}
      </SettingsSection>

      {/* AI */}
      <SettingsSection icon={<Sparkles size={17} />} title="AI providers">
        <p className="text-sm text-ink-muted">UNZANASA Academic Hub works out of the box with a built-in offline tutor. Add an API key on the server (see <code className="rounded bg-surface px-1 py-0.5 text-xs">.env</code>) to unlock live LLM tutoring.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[["Claude", "Anthropic"], ["GPT", "OpenAI"], ["Gemini", "Google"], ["Mistral", "Mistral"], ["DeepSeek", "DeepSeek"], ["Offline", "Built-in"]].map(([name, provider]) => (
            <div key={name} className="rounded-xl border border-edge p-3 text-center">
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-[11px] text-ink-faint">{provider}</div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Role (demo) */}
      <SettingsSection icon={<Shield size={17} />} title="Role & access">
        <p className="text-sm text-ink-muted">Switch roles to preview teacher and admin experiences. In production this is set by your account and institution.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["student", "teacher", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { dispatch({ type: "UPDATE_PROFILE", patch: { role: r } }); toast({ emoji: r === "admin" ? "🛡️" : r === "teacher" ? "🍎" : "🎓", title: `Role: ${r}` }); }}
              className={cn("flex flex-col items-center gap-1 rounded-xl border-2 py-3 capitalize transition", state.profile.role === r ? "border-brand-500 bg-brand-500/10" : "border-edge hover:border-edge-strong")}
            >
              <span className="text-sm font-medium">{r}</span>
              {r === "admin" && <span className="text-[10px] text-ink-faint">unlocks admin panel</span>}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Data & privacy */}
      <SettingsSection icon={<Database size={17} />} title="Data & privacy">
        <p className="text-sm text-ink-muted">Your data is stored locally in your browser. Export a backup or import one anytime.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={exportData} className="btn-secondary"><Download size={15} /> Export data</button>
          <button onClick={() => setImportOpen(true)} className="btn-secondary"><Upload size={15} /> Import data</button>
          <ConfirmButton onConfirm={() => { dispatch({ type: "RESET" }); toast({ emoji: "🔄", title: "Reset to demo data" }); }} className="btn-secondary text-amber-600 dark:text-amber-400" confirmLabel="Click again to reset">
            <RotateCcw size={15} /> Reset to demo
          </ConfirmButton>
        </div>
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400"><Shield size={15} /> Danger zone</div>
          <p className="mt-1 text-xs text-ink-muted">Permanently erase all your UNZANASA Academic Hub data from this device.</p>
          <ConfirmButton
            onConfirm={() => { localStorage.removeItem("unzanasa.state.v1"); dispatch({ type: "RESET" }); toast({ emoji: "🗑️", title: "All data erased" }); }}
            className="btn-secondary mt-2 border-rose-500/30 text-rose-600 dark:text-rose-400" confirmLabel="Click again to erase everything"
          >
            <Trash2 size={15} /> Erase all data
          </ConfirmButton>
        </div>
        <Link href="/" className="btn-ghost mt-4 w-full justify-start text-ink-muted"><LogOut size={15} /> Log out (return to landing)</Link>
      </SettingsSection>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function AccountSection() {
  const { user, status, logout, syncNow } = useAccount();
  const toast = useToast();

  return (
    <SettingsSection icon={<Cloud size={17} />} title="Account & cloud sync">
      {user ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{user.name || user.email}</div>
              <div className="text-xs text-ink-faint">{user.email}</div>
            </div>
            <Badge tone={status === "synced" ? "teal" : status === "syncing" ? "brand" : "amber"}>
              {status === "syncing" ? <RefreshCw size={11} className="animate-spin" /> : status === "synced" ? <Cloud size={11} /> : <CloudOff size={11} />}
              <span className="capitalize">{status}</span>
            </Badge>
          </div>
          <p className="mt-2 text-xs text-ink-muted">Your notes, decks, reviews and progress sync automatically across every device you sign in on.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => { syncNow(); toast({ emoji: "☁️", title: "Syncing now" }); }} className="btn-secondary btn-sm"><RefreshCw size={13} /> Sync now</button>
            <button onClick={async () => { await logout(); toast({ emoji: "👋", title: "Signed out", description: "You're back in guest mode — data stays on this device." }); }} className="btn-secondary btn-sm"><LogOut size={13} /> Sign out</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-medium"><CloudOff size={15} className="text-ink-faint" /> Guest mode</div>
            <p className="mt-1 text-xs text-ink-muted">Your data lives only in this browser. Create a free account to back it up and sync across devices.</p>
          </div>
          <Link href="/login" className="btn-primary btn-sm">Sign in / register</Link>
        </div>
      )}
    </SettingsSection>
  );
}

function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><span className="text-brand-500">{icon}</span> {title}</h2>
        {children}
      </Card>
    </motion.div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-brand-500" : "bg-edge-strong")} role="switch" aria-checked={checked}>
      <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" animate={{ left: checked ? 22 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
    </button>
  );
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [error, setError] = useState("");

  const onFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed?.version === 1 && parsed.profile && Array.isArray(parsed.cards)) {
        dispatch({ type: "HYDRATE", state: parsed });
        toast({ emoji: "✅", title: "Data imported" });
        onClose();
      } else setError("This file doesn't look like a UNZANASA Academic Hub backup.");
    } catch {
      setError("Couldn't parse the file. Make sure it's a valid JSON backup.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import data">
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">Select a UNZANASA Academic Hub backup file (.json). This will replace your current data.</p>
        <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="input" />
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </Modal>
  );
}
