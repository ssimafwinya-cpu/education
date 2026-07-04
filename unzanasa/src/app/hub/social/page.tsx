"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, UserPlus, MessageSquare, Share2, Trophy, Flame, Plus,
  Crown, Check, Search, Globe, Lock, Hash,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, Segmented, Modal, useToast, EmptyState } from "@/components/ui";
import { levelFromXp, levelTitle } from "@/lib/gamification";
import { cn } from "@/lib/utils";

// Social features are simulated client-side for the demo (real cohorts,
// messaging and shared libraries are backed by the StudyGroup / GroupMember /
// Deck.shared models in production). Interactions (join, share) are live and
// persist in-page so the experience is tangible.

const PEERS = [
  { name: "Maya K.", avatar: "🦉", xp: 4820, streak: 21, subject: "Biology" },
  { name: "Jordan P.", avatar: "🐧", xp: 4110, streak: 14, subject: "Calculus" },
  { name: "Priya N.", avatar: "🐨", xp: 3670, streak: 9, subject: "Chemistry" },
  { name: "Sam R.", avatar: "🦁", xp: 3120, streak: 6, subject: "History" },
  { name: "Leo M.", avatar: "🦊", xp: 2890, streak: 12, subject: "Physics" },
  { name: "Aisha B.", avatar: "🦋", xp: 2540, streak: 4, subject: "Biology" },
];

const GROUPS_SEED = [
  { id: "g1", name: "Pre-Med Study Squad", emoji: "🩺", members: 24, subject: "Biology", desc: "Grinding through anatomy & physiology together.", visibility: "public" as const },
  { id: "g2", name: "Calculus Crew", emoji: "📐", members: 18, subject: "Calculus", desc: "Daily problem sets and derivative drills.", visibility: "public" as const },
  { id: "g3", name: "History Buffs", emoji: "🏛️", members: 31, subject: "History", desc: "20th century deep dives and timeline quizzes.", visibility: "public" as const },
  { id: "g4", name: "Night Owls 🌙", emoji: "🦉", members: 12, subject: "Mixed", desc: "Late-night accountability & streak keeping.", visibility: "private" as const },
];

export default function SocialPage() {
  const { state } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<"groups" | "friends" | "shared">("groups");
  const [joined, setJoined] = useState<Set<string>>(new Set(["g1"]));
  const [friends, setFriends] = useState<Set<string>>(new Set(["Maya K.", "Jordan P."]));
  const [shared, setShared] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [customGroups, setCustomGroups] = useState<typeof GROUPS_SEED>([]);
  const [query, setQuery] = useState("");

  const leaderboard = useMemo(() => {
    const me = {
      name: `${state.profile.name.split(" ")[0]} (you)`,
      avatar: state.profile.avatar,
      xp: state.game.xp,
      streak: state.game.streak.current,
      subject: "",
      you: true,
    };
    return [...PEERS, me as any].sort((a, b) => b.xp - a.xp);
  }, [state.profile.name, state.profile.avatar, state.game.xp, state.game.streak]);

  const allGroups = [...customGroups, ...GROUPS_SEED].filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Social Learning"
        description="Join study groups, add friends, share decks and climb the leaderboard together."
        icon={<Users className="text-brand-500" />}
        actions={tab === "groups" && <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} /> Create group</button>}
      />

      {/* Community stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Users, label: "Groups joined", value: joined.size, tone: "brand" },
          { icon: UserPlus, label: "Friends", value: friends.size, tone: "teal" },
          { icon: Share2, label: "Decks shared", value: shared.size, tone: "violet" },
          { icon: Trophy, label: "Rank", value: `#${leaderboard.findIndex((p: any) => p.you) + 1}`, tone: "amber" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${s.tone}-500/12 text-${s.tone}-500`}><Icon size={18} /></div>
              <div><div className="text-xl font-bold">{s.value}</div><div className="text-xs text-ink-muted">{s.label}</div></div>
            </Card>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={tab} onChange={setTab} options={[
          { value: "groups", label: <span className="flex items-center gap-1"><Users size={14} /> Groups</span> },
          { value: "friends", label: <span className="flex items-center gap-1"><UserPlus size={14} /> Friends</span> },
          { value: "shared", label: <span className="flex items-center gap-1"><Share2 size={14} /> Shared decks</span> },
        ]} />
        {tab === "groups" && (
          <div className="relative ml-auto w-full max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search groups…" className="input pl-9" />
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tab === "groups" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {allGroups.map((g, i) => {
                const isJoined = joined.has(g.id);
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="h-full">
                      <div className="flex items-start justify-between">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-2xl">{g.emoji}</div>
                        <Badge tone={g.visibility === "public" ? "teal" : "amber"}>{g.visibility === "public" ? <><Globe size={11} /> Public</> : <><Lock size={11} /> Private</>}</Badge>
                      </div>
                      <h3 className="mt-3 font-semibold">{g.name}</h3>
                      <p className="line-clamp-2 text-xs text-ink-muted">{g.desc}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-ink-faint"><Users size={12} /> {g.members + (isJoined ? 1 : 0)} members · {g.subject}</div>
                      <button
                        onClick={() => {
                          setJoined((prev) => { const n = new Set(prev); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; });
                          toast({ emoji: isJoined ? "👋" : "🎉", title: isJoined ? "Left group" : `Joined ${g.name}` });
                        }}
                        className={cn("mt-3 w-full", isJoined ? "btn-secondary" : "btn-primary")}
                      >
                        {isJoined ? <><Check size={15} /> Joined</> : <><UserPlus size={15} /> Join group</>}
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {tab === "friends" && (
            <div className="space-y-2.5">
              {PEERS.map((p, i) => {
                const isFriend = friends.has(p.name);
                return (
                  <motion.div key={p.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-500/20 to-teal-500/20 text-2xl">{p.avatar}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="font-semibold">{p.name}</span><Badge tone="brand">Lv {levelFromXp(p.xp)}</Badge></div>
                        <div className="flex items-center gap-3 text-xs text-ink-faint"><span>{p.xp.toLocaleString()} XP</span><span className="flex items-center gap-0.5"><Flame size={11} className="text-amber-500" /> {p.streak}d</span><span>· {p.subject}</span></div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => toast({ emoji: "💬", title: `Messaging ${p.name}`, description: "Chat is available in the full release." })} className="btn-ghost btn-sm"><MessageSquare size={15} /></button>
                        <button
                          onClick={() => { setFriends((prev) => { const n = new Set(prev); n.has(p.name) ? n.delete(p.name) : n.add(p.name); return n; }); toast({ emoji: isFriend ? "👋" : "🤝", title: isFriend ? "Removed friend" : `Added ${p.name}` }); }}
                          className={cn("btn-sm", isFriend ? "btn-secondary" : "btn-primary")}
                        >
                          {isFriend ? <><Check size={14} /> Friends</> : <><UserPlus size={14} /> Add</>}
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {tab === "shared" && (
            state.decks.length === 0 ? (
              <EmptyState icon="🗂️" title="No decks to share" description="Create a deck first, then share it with the community." />
            ) : (
              <div className="space-y-2.5">
                <p className="text-sm text-ink-muted">Share your decks so friends and groups can study them.</p>
                {state.decks.map((d) => {
                  const isShared = shared.has(d.id);
                  const count = state.cards.filter((c) => c.deckId === d.id).length;
                  return (
                    <Card key={d.id} className="flex items-center gap-4">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-xl">{d.emoji}</div>
                      <div className="min-w-0 flex-1"><div className="truncate font-medium">{d.name}</div><div className="text-xs text-ink-faint">{count} cards</div></div>
                      {isShared && <Badge tone="teal"><Globe size={11} /> Shared</Badge>}
                      <button onClick={() => { setShared((prev) => { const n = new Set(prev); n.has(d.id) ? n.delete(d.id) : n.add(d.id); return n; }); toast({ emoji: isShared ? "🔒" : "🌍", title: isShared ? "Made private" : "Deck shared" }); }} className={cn("btn-sm", isShared ? "btn-secondary" : "btn-primary")}>
                        {isShared ? "Unshare" : <><Share2 size={14} /> Share</>}
                      </button>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Trophy size={17} className="text-amber-500" /> Weekly leaderboard</h2>
            <div className="space-y-2">
              {leaderboard.map((p: any, i) => (
                <div key={p.name} className={cn("flex items-center gap-3 rounded-xl p-2.5", p.you && "bg-brand-500/10 ring-1 ring-brand-500/30")}>
                  <div className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-bold", i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-400 text-white" : "text-ink-faint")}>
                    {i === 0 ? <Crown size={13} /> : i + 1}
                  </div>
                  <span className="text-lg">{p.avatar}</span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-[11px] text-ink-faint">{levelTitle(levelFromXp(p.xp))}</div></div>
                  <span className="text-sm font-bold tabular-nums">{p.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(g) => { setCustomGroups((prev) => [g, ...prev]); setJoined((prev) => new Set(prev).add(g.id)); setCreateOpen(false); toast({ emoji: "🎉", title: `Created ${g.name}` }); }} />
    </div>
  );
}

function CreateGroupModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (g: typeof GROUPS_SEED[number]) => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [subject, setSubject] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const EMOJIS = ["📚", "🧬", "📐", "🏛️", "⚗️", "💻", "🩺", "🌙", "🔥", "🎯"];

  return (
    <Modal open={open} onClose={onClose} title="Create study group">
      <div className="space-y-4">
        <div><label className="mb-1.5 block text-xs font-medium text-ink-muted">Group name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Biology Warriors" /></div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Icon</label>
          <div className="flex flex-wrap gap-1.5">{EMOJIS.map((e) => <button key={e} onClick={() => setEmoji(e)} className={cn("grid h-9 w-9 place-items-center rounded-lg text-lg", emoji === e ? "bg-brand-500/15 ring-2 ring-brand-500" : "hover:bg-surface")}>{e}</button>)}</div>
        </div>
        <div><label className="mb-1.5 block text-xs font-medium text-ink-muted">Subject / topic</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="e.g. Biology" /></div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Visibility</label>
          <Segmented value={visibility} onChange={setVisibility} options={[{ value: "public", label: "🌍 Public" }, { value: "private", label: "🔒 Private" }]} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button disabled={!name.trim()} onClick={() => onCreate({ id: `g_${Date.now()}`, name: name.trim(), emoji, members: 1, subject: subject.trim() || "General", desc: "A new study group.", visibility })} className="btn-primary"><Hash size={15} /> Create</button>
        </div>
      </div>
    </Modal>
  );
}
