"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Target, Clock, Flame, Brain, Award, AlertTriangle,
  CheckCircle2, Calendar, Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, Progress } from "@/components/ui";
import { AreaChart, BarChart, Heatmap, Donut } from "@/components/charts";
import {
  recentActivity, masteryBySubject, overallAccuracy, totalStudyMinutes,
  activityHeatmapValues, reviewForecast,
} from "@/lib/selectors";
import { currentRetention } from "@/lib/fsrs";
import { subjectColor, formatDuration, cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { state } = useStore();
  const now = Date.now();

  const activity = useMemo(() => recentActivity(state, 21, now), [state, now]);
  const mastery = useMemo(() => masteryBySubject(state, now), [state, now]);
  const heatmap = useMemo(() => activityHeatmapValues(state), [state]);
  const forecast = useMemo(() => reviewForecast(state, 14, now), [state, now]);
  const accuracy = overallAccuracy(state);
  const studyMin = totalStudyMinutes(state);

  // Card state distribution.
  const stateCounts = useMemo(() => {
    const c = { new: 0, learning: 0, review: 0, relearning: 0 };
    state.cards.forEach((card) => c[card.srs.state]++);
    return c;
  }, [state.cards]);

  const matured = state.cards.filter((c) => c.srs.state === "review" && c.srs.stability > 21).length;
  const avgRetention = useMemo(() => {
    const reviewed = state.cards.filter((c) => c.srs.state !== "new");
    if (!reviewed.length) return 100;
    return Math.round((reviewed.reduce((n, c) => n + currentRetention(c.srs, now), 0) / reviewed.length) * 100);
  }, [state.cards, now]);

  const weak = mastery.filter((m) => m.cards > 0 && m.mastery < 60);
  const strong = mastery.filter((m) => m.cards > 0 && m.mastery >= 75);
  const totalXp = state.game.xp;
  const activeDays = state.activity.filter((d) => d.reviews > 0 || d.studyMinutes > 0).length;

  return (
    <div>
      <PageHeader title="Analytics" description="Understand your learning: retention, accuracy, consistency and what to focus on next." icon={<TrendingUp className="text-teal-500" />} />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Brain, label: "Avg retention", value: `${avgRetention}%`, tone: "teal", sub: `${matured} mature cards` },
          { icon: Target, label: "Recall accuracy", value: `${accuracy}%`, tone: "brand", sub: "all reviews" },
          { icon: Clock, label: "Study time", value: formatDuration(studyMin), tone: "amber", sub: `${activeDays} active days` },
          { icon: Zap, label: "Total XP", value: totalXp.toLocaleString(), tone: "violet", sub: `Level ${state.game.streak.best ? "" : ""}${Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1)}` },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <div className={cn("mb-2 grid h-9 w-9 place-items-center rounded-lg", `bg-${k.tone}-500/12 text-${k.tone}-500`)}><Icon size={17} /></div>
                <div className="text-2xl font-bold">{k.value}</div>
                <div className="text-xs text-ink-muted">{k.label}</div>
                <div className="text-[11px] text-ink-faint">{k.sub}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* XP over time */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><TrendingUp size={17} className="text-teal-500" /> XP · last 21 days</h2>
          <AreaChart data={activity.map((a) => a.xp)} labels={activity.map((a) => a.date.slice(5))} color="#14b8a6" valueFormat={(n) => `${n} XP`} />
        </Card>

        {/* Card states donut */}
        <Card>
          <h2 className="mb-3 font-semibold">Card states</h2>
          <div className="flex items-center justify-center">
            <Donut
              size={150}
              segments={[
                { value: stateCounts.review, color: "#14b8a6", label: "Review" },
                { value: stateCounts.learning, color: "#f59e0b", label: "Learning" },
                { value: stateCounts.relearning, color: "#f43f5e", label: "Relearning" },
                { value: stateCounts.new, color: "#0ea5e9", label: "New" },
              ]}
              center={<div className="text-center"><div className="text-2xl font-bold">{state.cards.length}</div><div className="text-[10px] text-ink-faint">cards</div></div>}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
            {[["Review", stateCounts.review, "#14b8a6"], ["Learning", stateCounts.learning, "#f59e0b"], ["Relearning", stateCounts.relearning, "#f43f5e"], ["New", stateCounts.new, "#0ea5e9"]].map(([l, v, c]) => (
              <div key={l as string} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c as string }} /> <span className="text-ink-muted">{l}</span> <span className="ml-auto font-semibold">{v as number}</span></div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Review forecast */}
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Calendar size={17} className="text-brand-500" /> Review forecast · next 14 days</h2>
          <BarChart data={forecast.map((f) => f.count)} labels={forecast.map((f, i) => (i % 2 === 0 ? f.date.slice(8) : ""))} color="#6366f1" />
          <p className="mt-2 text-xs text-ink-faint">Cards the FSRS scheduler will surface each day. Flatter is more sustainable.</p>
        </Card>

        {/* Study minutes bar */}
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Clock size={17} className="text-amber-500" /> Daily study minutes</h2>
          <BarChart data={activity.slice(-14).map((a) => a.studyMinutes)} labels={activity.slice(-14).map((a, i) => (i % 2 === 0 ? a.date.slice(8) : ""))} color="#f59e0b" />
        </Card>
      </div>

      {/* Mastery by subject */}
      <Card className="mt-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Award size={17} className="text-brand-500" /> Mastery by subject</h2>
        {mastery.filter((m) => m.cards > 0).length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-faint">Review some cards to see mastery data.</p>
        ) : (
          <div className="space-y-3">
            {mastery.filter((m) => m.cards > 0).map((m) => {
              const c = subjectColor(m.subject.color);
              return (
                <div key={m.subject.id} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 truncate text-sm font-medium">{m.subject.emoji} {m.subject.name}</div>
                  <Progress value={m.mastery} tone={m.mastery < 50 ? "rose" : m.mastery < 75 ? "amber" : "accent"} />
                  <div className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums" style={{ color: c.solid }}>{m.mastery}%</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Consistency heatmap */}
      <Card className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><Flame size={17} className="text-amber-500" /> Consistency</h2>
          <div className="flex items-center gap-1 text-[11px] text-ink-faint">Less <span className="mx-1 flex gap-0.5">{["bg-surface", "bg-brand-500/25", "bg-brand-500/45", "bg-brand-500/70", "bg-brand-500"].map((cl) => <span key={cl} className={cn("h-2.5 w-2.5 rounded-sm border border-edge/40", cl)} />)}</span> More</div>
        </div>
        <Heatmap values={heatmap} weeks={20} />
      </Card>

      {/* Recommendations */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle size={17} className="text-rose-500" /> Focus next</h2>
          {weak.length === 0 ? (
            <p className="text-sm text-ink-faint">No weak subjects — great job! Keep reviewing to maintain your streak.</p>
          ) : (
            <div className="space-y-2">
              {weak.map((m) => (
                <div key={m.subject.id} className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <span className="text-xl">{m.subject.emoji}</span>
                  <div className="flex-1"><div className="text-sm font-medium">{m.subject.name}</div><div className="text-xs text-ink-faint">{m.mastery}% mastery · {m.dueCards} cards due</div></div>
                  <Badge tone="rose">Priority</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 size={17} className="text-teal-500" /> Strengths</h2>
          {strong.length === 0 ? (
            <p className="text-sm text-ink-faint">Keep reviewing to build mastery in your subjects.</p>
          ) : (
            <div className="space-y-2">
              {strong.map((m) => (
                <div key={m.subject.id} className="flex items-center gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 p-3">
                  <span className="text-xl">{m.subject.emoji}</span>
                  <div className="flex-1"><div className="text-sm font-medium">{m.subject.name}</div><div className="text-xs text-ink-faint">{m.mastery}% mastery — well retained</div></div>
                  <Badge tone="teal">Strong</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
