"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain, Flame, Zap, Trophy, ArrowRight, CalendarDays, BookOpen,
  Clock, TrendingUp, Sparkles, StickyNote, Target, ChevronRight, AlertTriangle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Progress, ProgressRing, Badge } from "@/components/ui";
import { AreaChart, Heatmap } from "@/components/charts";
import { levelProgress, levelTitle } from "@/lib/gamification";
import {
  dueCards, masteryBySubject, recentActivity, activityHeatmapValues, subjectStats,
} from "@/lib/selectors";
import { formatRelative, subjectColor, cn, isoDate } from "@/lib/utils";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { state } = useStore();
  const now = Date.now();

  const due = useMemo(() => dueCards(state, now), [state, now]);
  const progress = levelProgress(state.game.xp);
  const activity = useMemo(() => recentActivity(state, 14, now), [state, now]);
  const heatmap = useMemo(() => activityHeatmapValues(state), [state]);
  const mastery = useMemo(() => masteryBySubject(state, now), [state, now]);
  const weakest = mastery.filter((m) => m.cards > 0).slice(0, 3);

  const upcomingExams = useMemo(
    () =>
      state.subjects
        .filter((s) => !s.archived && s.examDate && s.examDate > now)
        .sort((a, b) => (a.examDate! - b.examDate!))
        .slice(0, 3)
        .map((s) => ({ subject: s, days: Math.ceil((s.examDate! - now) / 86400000) })),
    [state.subjects, now],
  );

  const pinned = state.subjects.filter((s) => s.pinned && !s.archived);
  const recentNotes = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const todayIso = isoDate();
  const todayTasks = state.planner.filter((t) => t.date === todayIso);
  const todayDone = todayTasks.filter((t) => t.done).length;

  const greeting = (() => {
    const h = new Date().getHours();
    const first = state.profile.name.split(" ")[0];
    if (h < 12) return `Good morning, ${first}`;
    if (h < 18) return `Good afternoon, ${first}`;
    return `Good evening, ${first}`;
  })();

  const todayXp = activity[activity.length - 1]?.xp ?? 0;
  const dailyTarget = state.profile.settings.dailyReviewTarget;
  const reviewsToday = state.activity.find((d) => d.date === todayIso)?.reviews ?? 0;

  return (
    <div>
      <PageHeader
        title={greeting}
        description="Here's your learning at a glance. Let's keep the momentum going."
        actions={
          <Link href="/app/review" className="btn-primary">
            <Brain size={16} /> Review {due.length > 0 ? `(${due.length})` : ""}
          </Link>
        }
      />

      {/* Top stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Flame, label: "Day streak", value: state.game.streak.current, sub: `Best: ${state.game.streak.best}`, tone: "amber" },
          { icon: Zap, label: "XP today", value: todayXp, sub: `${state.game.xp.toLocaleString()} total`, tone: "brand" },
          { icon: Brain, label: "Cards due", value: due.length, sub: due.length ? "Ready to review" : "All caught up 🎉", tone: "rose" },
          { icon: Trophy, label: "Level", value: progress.level, sub: levelTitle(progress.level), tone: "teal" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} {...fade} transition={{ delay: i * 0.05 }}>
              <Card className="flex items-center gap-3.5">
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", `bg-${s.tone}-500/12 text-${s.tone}-500`)}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums leading-tight">{s.value}</div>
                  <div className="truncate text-xs text-ink-muted">{s.label}</div>
                  <div className="truncate text-[11px] text-ink-faint">{s.sub}</div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-5 lg:col-span-2">
          {/* Today's plan */}
          <motion.div {...fade} transition={{ delay: 0.1 }}>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold"><Target size={17} className="text-brand-500" /> Today's study plan</h2>
                <Link href="/app/planner" className="btn-ghost btn-sm">Open planner <ChevronRight size={14} /></Link>
              </div>
              {todayTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-edge-strong p-5 text-center text-sm text-ink-muted">
                  No tasks scheduled today.{" "}
                  <Link href="/app/planner" className="font-semibold text-brand-500 hover:underline">Auto-generate a plan →</Link>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <Progress value={(todayDone / todayTasks.length) * 100} className="flex-1" tone="accent" />
                    <span className="text-xs font-medium text-ink-muted tabular-nums">{todayDone}/{todayTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {todayTasks.slice(0, 4).map((t) => {
                      const subj = state.subjects.find((s) => s.id === t.subjectId);
                      return (
                        <div key={t.id} className={cn("flex items-center gap-3 rounded-xl border border-edge p-3", t.done && "opacity-55")}>
                          <div className={cn("h-2.5 w-2.5 rounded-full", t.done ? "bg-teal-500" : "bg-brand-500")} />
                          <div className="flex-1">
                            <div className={cn("text-sm font-medium", t.done && "line-through")}>{t.title}</div>
                            <div className="text-xs text-ink-faint">{subj ? `${subj.emoji} ${subj.name} · ` : ""}{t.durationMin} min</div>
                          </div>
                          <Badge tone="brand" className="capitalize">{t.kind}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </motion.div>

          {/* XP activity chart */}
          <motion.div {...fade} transition={{ delay: 0.15 }}>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold"><TrendingUp size={17} className="text-teal-500" /> XP · last 14 days</h2>
                <Link href="/app/analytics" className="btn-ghost btn-sm">Analytics <ChevronRight size={14} /></Link>
              </div>
              <AreaChart
                data={activity.map((a) => a.xp)}
                labels={activity.map((a) => a.date.slice(5))}
                color="#14b8a6"
                valueFormat={(n) => `${n} XP`}
              />
            </Card>
          </motion.div>

          {/* Weak subjects */}
          {weakest.length > 0 && (
            <motion.div {...fade} transition={{ delay: 0.2 }}>
              <Card>
                <h2 className="mb-4 flex items-center gap-2 font-semibold"><AlertTriangle size={17} className="text-amber-500" /> Focus areas</h2>
                <div className="space-y-3">
                  {weakest.map((m) => {
                    const c = subjectColor(m.subject.color);
                    return (
                      <Link key={m.subject.id} href={`/app/courses/${m.subject.id}`} className="flex items-center gap-3 rounded-xl border border-edge p-3 transition hover:border-edge-strong">
                        <div className="text-xl">{m.subject.emoji}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{m.subject.name}</span>
                            <span className="text-xs font-semibold" style={{ color: c.solid }}>{m.mastery}% mastery</span>
                          </div>
                          <Progress value={m.mastery} className="mt-1.5" tone={m.mastery < 50 ? "rose" : m.mastery < 75 ? "amber" : "accent"} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-5">
          {/* Level ring */}
          <motion.div {...fade} transition={{ delay: 0.1 }}>
            <Card className="flex flex-col items-center text-center">
              <ProgressRing value={progress.pctToNext} size={112} stroke={9}>
                <div>
                  <div className="text-2xl font-extrabold">{progress.level}</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-faint">Level</div>
                </div>
              </ProgressRing>
              <div className="mt-3 font-semibold">{levelTitle(progress.level)}</div>
              <div className="text-xs text-ink-muted">{progress.into}/{progress.needed} XP to level {progress.level + 1}</div>
              <div className="mt-3 flex w-full items-center justify-around border-t border-edge pt-3 text-center">
                <div><div className="text-lg font-bold">🪙 {state.game.coins}</div><div className="text-[11px] text-ink-faint">Coins</div></div>
                <div><div className="text-lg font-bold">{Object.keys(state.game.unlocked).length}</div><div className="text-[11px] text-ink-faint">Badges</div></div>
              </div>
            </Card>
          </motion.div>

          {/* Daily goal */}
          <motion.div {...fade} transition={{ delay: 0.15 }}>
            <Card>
              <h3 className="mb-2 text-sm font-semibold">Daily review goal</h3>
              <div className="flex items-center gap-3">
                <ProgressRing value={(reviewsToday / dailyTarget) * 100} size={54} stroke={6} color="#f59e0b">
                  <span className="text-xs font-bold">{Math.min(100, Math.round((reviewsToday / dailyTarget) * 100))}%</span>
                </ProgressRing>
                <div className="text-sm">
                  <div className="font-semibold tabular-nums">{reviewsToday} / {dailyTarget} cards</div>
                  <div className="text-xs text-ink-faint">{reviewsToday >= dailyTarget ? "Goal smashed! 🎉" : `${dailyTarget - reviewsToday} to go`}</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Upcoming exams */}
          <motion.div {...fade} transition={{ delay: 0.2 }}>
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={15} className="text-rose-500" /> Upcoming exams</h3>
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-ink-faint">No exams scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingExams.map(({ subject, days }) => (
                    <div key={subject.id} className="flex items-center gap-3">
                      <div className="text-lg">{subject.emoji}</div>
                      <div className="flex-1 text-sm font-medium">{subject.name}</div>
                      <Badge tone={days <= 7 ? "rose" : days <= 21 ? "amber" : "teal"}>{days}d</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Consistency heatmap */}
          <motion.div {...fade} transition={{ delay: 0.25 }}>
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Flame size={15} className="text-amber-500" /> Consistency</h3>
              <Heatmap values={heatmap} weeks={12} />
            </Card>
          </motion.div>

          {/* Recent notes */}
          <motion.div {...fade} transition={{ delay: 0.3 }}>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold"><StickyNote size={15} className="text-brand-500" /> Recent notes</h3>
                <Link href="/app/notes" className="text-xs text-brand-500 hover:underline">All</Link>
              </div>
              <div className="space-y-1">
                {recentNotes.map((n) => (
                  <Link key={n.id} href={`/app/notes?id=${n.id}`} className="block rounded-lg px-2 py-1.5 transition hover:bg-surface">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    <div className="text-[11px] text-ink-faint">{formatRelative(n.updatedAt)}</div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Pinned courses / quick resume */}
      {pinned.length > 0 && (
        <motion.div {...fade} transition={{ delay: 0.25 }} className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><BookOpen size={17} className="text-brand-500" /> Pinned courses</h2>
            <Link href="/app/courses" className="btn-ghost btn-sm">All courses <ChevronRight size={14} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((s) => {
              const st = subjectStats(state, s.id, now);
              const c = subjectColor(s.color);
              return (
                <Link key={s.id} href={`/app/courses/${s.id}`}>
                  <Card hover className="h-full">
                    <div className="flex items-start justify-between">
                      <div className="text-3xl">{s.emoji}</div>
                      {st.dueCards > 0 && <Badge tone="rose">{st.dueCards} due</Badge>}
                    </div>
                    <h3 className="mt-3 font-semibold">{s.name}</h3>
                    <p className="text-xs text-ink-faint">{st.decks} decks · {st.cards} cards · {st.notes} notes</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Progress value={st.mastery} tone="brand" />
                      <span className="text-xs font-semibold tabular-nums" style={{ color: c.solid }}>{st.mastery}%</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* AI nudge */}
      <motion.div {...fade} transition={{ delay: 0.3 }} className="mt-5">
        <Link href="/app/tutor">
          <div className="glass card-hover flex items-center gap-4 rounded-2xl p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow">
              <Sparkles size={22} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Stuck on something?</div>
              <div className="text-sm text-ink-muted">Ask your AI tutor to explain, quiz you, or build a study plan.</div>
            </div>
            <ArrowRight size={20} className="text-ink-faint" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
