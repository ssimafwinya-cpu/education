"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, Users, GraduationCap, DollarSign, Activity, Ban, Check,
  Search, TrendingUp, Server, AlertTriangle, Eye, Lock, CalendarDays,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, Segmented, EmptyState, useToast } from "@/components/ui";
import { AreaChart, BarChart, Donut } from "@/components/charts";
import { AcademicHubEditor } from "@/components/admin/academic-hub-editor";
import { CommunityEditor } from "@/components/admin/community-editor";
import { CommitteeEditor } from "@/components/admin/committee-editor";
import { cn } from "@/lib/utils";

// The admin panel is role-gated (profile.role === "admin"). Metrics use
// representative aggregate data; wiring to the real /api/admin/* endpoints
// (see docs/API.md) surfaces live figures from PostgreSQL.

const USERS = [
  { name: "Maya Kapoor", email: "maya@uni.edu", plan: "Premium", role: "Student", status: "active", xp: 4820, joined: "2025-11-02" },
  { name: "Jordan Price", email: "jordan@school.org", plan: "Free", role: "Student", status: "active", xp: 4110, joined: "2025-12-14" },
  { name: "Dr. Elaine Ross", email: "e.ross@college.edu", plan: "Institution", role: "Teacher", status: "active", xp: 980, joined: "2025-09-20" },
  { name: "Priya Nair", email: "priya@uni.edu", plan: "Premium", role: "Student", status: "active", xp: 3670, joined: "2026-01-08" },
  { name: "Sam Rivera", email: "sam@school.org", plan: "Free", role: "Student", status: "suspended", xp: 3120, joined: "2025-10-30" },
  { name: "Leo Martins", email: "leo@uni.edu", plan: "Premium", role: "Student", status: "active", xp: 2890, joined: "2026-02-11" },
  { name: "Aisha Bello", email: "aisha@college.edu", plan: "Institution", role: "Student", status: "active", xp: 2540, joined: "2026-03-01" },
];

const FLAGGED = [
  { id: "f1", type: "Deck", title: "Exam leak — Final answers", reporter: "auto-filter", reason: "Possible academic integrity violation", severity: "high" },
  { id: "f2", type: "Comment", title: "Spam link in Calculus Crew", reporter: "3 users", reason: "Spam / advertising", severity: "medium" },
  { id: "f3", type: "Note", title: "Copyrighted textbook chapter", reporter: "1 user", reason: "Copyright", severity: "medium" },
];

const AUDIT = [
  { action: "auth.login", user: "maya@uni.edu", ip: "81.2.x.x", when: "2m ago" },
  { action: "subscription.upgraded", user: "leo@uni.edu", ip: "92.4.x.x", when: "18m ago" },
  { action: "content.reported", user: "system", ip: "—", when: "34m ago" },
  { action: "user.suspended", user: "admin@cognify.app", ip: "10.0.x.x", when: "1h ago" },
  { action: "auth.2fa_enabled", user: "priya@uni.edu", ip: "44.1.x.x", when: "2h ago" },
  { action: "institution.created", user: "admin@cognify.app", ip: "10.0.x.x", when: "5h ago" },
];

export default function AdminPage() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<"overview" | "users" | "academic" | "community" | "committee" | "moderation" | "audit">("overview");
  const [query, setQuery] = useState("");
  const [suspended, setSuspended] = useState<Set<string>>(new Set(["sam@school.org"]));
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const isAdmin = state.profile.role === "admin";

  const filteredUsers = USERS.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));
  const signups = useMemo(() => Array.from({ length: 21 }, (_, i) => Math.round(40 + 30 * Math.sin(i / 3) + i * 2.5)), []);
  const revenue = useMemo(() => Array.from({ length: 12 }, (_, i) => Math.round(1200 + i * 340 + Math.sin(i) * 200)), []);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Admin" icon={<Shield className="text-brand-500" />} />
        <EmptyState
          icon="🔒"
          title="Admin access required"
          description="This area is restricted to administrators. Enable the demo admin role in Settings to preview it."
          action={<Link href="/hub/settings" className="btn-primary"><Lock size={15} /> Go to Settings</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Console"
        description="Platform health, user management, content moderation and audit trail."
        icon={<Shield className="text-brand-500" />}
        actions={<Badge tone="brand"><Server size={12} /> All systems operational</Badge>}
      />

      <div className="mb-5">
        <Segmented value={tab} onChange={setTab} options={[
          { value: "overview", label: "Overview" },
          { value: "users", label: "Users" },
          { value: "academic", label: "Academic Hub" },
          { value: "community", label: "Events & News" },
          { value: "committee", label: "Committee" },
          { value: "moderation", label: <span className="flex items-center gap-1">Moderation {FLAGGED.length - resolved.size > 0 && <span className="chip bg-rose-500/15 text-rose-500">{FLAGGED.length - resolved.size}</span>}</span> },
          { value: "audit", label: "Audit log" },
        ]} />
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: Users, label: "Total users", value: "48,210", delta: "+6.2%", tone: "brand" },
              { icon: Activity, label: "Active today", value: "12,847", delta: "+3.1%", tone: "teal" },
              { icon: GraduationCap, label: "Institutions", value: "312", delta: "+9", tone: "violet" },
              { icon: DollarSign, label: "MRR", value: "$84.2k", delta: "+11.4%", tone: "amber" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <div className={`mb-2 grid h-9 w-9 place-items-center rounded-lg bg-${s.tone}-500/12 text-${s.tone}-500`}><Icon size={17} /></div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="flex items-center justify-between"><span className="text-xs text-ink-muted">{s.label}</span><span className="text-[11px] font-medium text-teal-500">{s.delta}</span></div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><TrendingUp size={16} className="text-brand-500" /> Daily sign-ups · 21 days</h3>
              <AreaChart data={signups} color="#6366f1" />
            </Card>
            <Card>
              <h3 className="mb-3 font-semibold">Plan mix</h3>
              <div className="flex justify-center">
                <Donut size={150} segments={[
                  { value: 68, color: "#94a3b8", label: "Free" },
                  { value: 24, color: "#6366f1", label: "Premium" },
                  { value: 8, color: "#14b8a6", label: "Institution" },
                ]} center={<div className="text-center"><div className="text-lg font-bold">48.2k</div><div className="text-[10px] text-ink-faint">users</div></div>} />
              </div>
              <div className="mt-3 space-y-1 text-xs">
                {[["Free", "68%", "#94a3b8"], ["Premium", "24%", "#6366f1"], ["Institution", "8%", "#14b8a6"]].map(([l, v, c]) => (
                  <div key={l as string} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c as string }} /><span className="flex-1 text-ink-muted">{l}</span><span className="font-semibold">{v}</span></div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><DollarSign size={16} className="text-amber-500" /> Monthly revenue · 12 months</h3>
            <BarChart data={revenue} color="#f59e0b" labels={["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]} />
          </Card>
        </div>
      )}

      {tab === "academic" && (
        <Card>
          <h3 className="mb-1 flex items-center gap-2 font-semibold"><GraduationCap size={16} className="text-brand-500" /> Academic Hub — course catalogue</h3>
          <p className="mb-4 text-sm text-ink-muted">Manage the School of Natural Sciences programmes and their second-year courses. Changes appear on the public Academics page.</p>
          <AcademicHubEditor />
        </Card>
      )}

      {tab === "community" && (
        <Card>
          <h3 className="mb-1 flex items-center gap-2 font-semibold"><CalendarDays size={16} className="text-brand-500" /> Events & announcements</h3>
          <p className="mb-4 text-sm text-ink-muted">Maintain the association calendar and notice board. Events appear on the public Events page and the hub dashboard; members can RSVP.</p>
          <CommunityEditor />
        </Card>
      )}

      {tab === "committee" && (
        <Card>
          <h3 className="mb-1 flex items-center gap-2 font-semibold"><Users size={16} className="text-brand-500" /> Executive Committee</h3>
          <p className="mb-4 text-sm text-ink-muted">Record who currently holds each Article 8 office. The committee is shown on the public About page.</p>
          <CommitteeEditor />
        </Card>
      )}

      {tab === "users" && (
        <div>
          <div className="relative mb-4 max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…" className="input pl-9" />
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-edge bg-surface text-left text-xs text-ink-faint">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">XP</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSusp = suspended.has(u.email);
                    return (
                      <tr key={u.email} className="border-b border-edge last:border-0 hover:bg-surface/50">
                        <td className="px-4 py-3"><div className="font-medium">{u.name}</div><div className="text-xs text-ink-faint">{u.email}</div></td>
                        <td className="px-4 py-3"><Badge tone={u.plan === "Free" ? "brand" : u.plan === "Premium" ? "violet" : "teal"}>{u.plan}</Badge></td>
                        <td className="px-4 py-3 text-ink-muted">{u.role}</td>
                        <td className="px-4 py-3 tabular-nums">{u.xp.toLocaleString()}</td>
                        <td className="px-4 py-3">{isSusp ? <Badge tone="rose">Suspended</Badge> : <Badge tone="teal">Active</Badge>}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { setSuspended((prev) => { const n = new Set(prev); n.has(u.email) ? n.delete(u.email) : n.add(u.email); return n; }); toast({ emoji: isSusp ? "✅" : "🚫", title: isSusp ? `${u.name} reinstated` : `${u.name} suspended` }); }}
                            className={cn("btn-sm", isSusp ? "btn-secondary" : "btn-ghost text-rose-500")}
                          >
                            {isSusp ? <><Check size={13} /> Reinstate</> : <><Ban size={13} /> Suspend</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === "moderation" && (
        <div className="space-y-3">
          {FLAGGED.filter((f) => !resolved.has(f.id)).length === 0 ? (
            <EmptyState icon="✅" title="Queue clear" description="No flagged content awaiting review. Great job!" />
          ) : (
            FLAGGED.map((f) => resolved.has(f.id) ? null : (
              <Card key={f.id} className={cn("border-l-4", f.severity === "high" ? "border-l-rose-500" : "border-l-amber-500")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-10 w-10 place-items-center rounded-xl", f.severity === "high" ? "bg-rose-500/12 text-rose-500" : "bg-amber-500/12 text-amber-500")}><AlertTriangle size={18} /></div>
                    <div>
                      <div className="flex items-center gap-2"><Badge tone="brand">{f.type}</Badge><span className="font-medium">{f.title}</span></div>
                      <div className="text-xs text-ink-muted">{f.reason} · reported by {f.reporter}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toast({ emoji: "👁️", title: "Opening content preview" })} className="btn-ghost btn-sm"><Eye size={14} /> Review</button>
                    <button onClick={() => { setResolved((prev) => new Set(prev).add(f.id)); toast({ emoji: "🗑️", title: "Content removed" }); }} className="btn-ghost btn-sm text-rose-500"><Ban size={14} /> Remove</button>
                    <button onClick={() => { setResolved((prev) => new Set(prev).add(f.id)); toast({ emoji: "✅", title: "Dismissed" }); }} className="btn-secondary btn-sm"><Check size={14} /> Dismiss</button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "audit" && (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-edge">
            {AUDIT.map((a, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <code className="rounded-md bg-surface px-2 py-1 text-xs font-medium text-brand-600 dark:text-brand-300">{a.action}</code>
                <span className="flex-1 text-sm text-ink-muted">{a.user}</span>
                <span className="hidden text-xs text-ink-faint sm:inline">{a.ip}</span>
                <span className="text-xs text-ink-faint">{a.when}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
