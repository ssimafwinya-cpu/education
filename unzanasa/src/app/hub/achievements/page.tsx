"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Flame, Coins, Star, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Progress, Badge, ProgressRing } from "@/components/ui";
import { ACHIEVEMENTS } from "@/lib/store";
import { levelProgress, levelTitle, xpForLevel, LEVEL_TITLES } from "@/lib/gamification";
import { cn, formatRelative } from "@/lib/utils";

export default function AchievementsPage() {
  const { state } = useStore();
  const progress = levelProgress(state.game.xp);

  const achievements = useMemo(
    () => ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: state.game.unlocked[a.id] })).sort((a, b) => Number(!!b.unlockedAt) - Number(!!a.unlockedAt)),
    [state.game.unlocked],
  );
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  // Level ladder around the current level.
  const ladder = Array.from({ length: 6 }, (_, i) => progress.level - 1 + i).filter((l) => l >= 1).slice(0, 6);

  return (
    <div>
      <PageHeader title="Achievements" description="Earn XP, level up, unlock badges and collect coins as you learn." icon={<Trophy className="text-amber-500" />} />

      {/* Hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 lg:col-span-2">
          <ProgressRing value={progress.pctToNext} size={100} stroke={9}>
            <div className="text-center"><div className="text-2xl font-extrabold">{progress.level}</div><div className="text-[9px] uppercase text-ink-faint">Level</div></div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-xl font-bold">{levelTitle(progress.level)}</h2><Badge tone="brand">Level {progress.level}</Badge></div>
            <p className="text-sm text-ink-muted">{progress.into} / {progress.needed} XP to level {progress.level + 1}</p>
            <Progress value={progress.pctToNext} className="mt-2" tone="brand" />
            <div className="mt-3 flex gap-4 text-sm">
              <span className="flex items-center gap-1.5"><Zap size={15} className="text-brand-500" /> <strong>{state.game.xp.toLocaleString()}</strong> XP</span>
              <span className="flex items-center gap-1.5"><Coins size={15} className="text-amber-500" /> <strong>{state.game.coins}</strong> coins</span>
              <span className="flex items-center gap-1.5"><Flame size={15} className="text-orange-500" /> <strong>{state.game.streak.current}</strong> day streak</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <div className="text-4xl">🏅</div>
          <div className="mt-2 text-3xl font-extrabold">{unlockedCount}<span className="text-lg text-ink-faint">/{achievements.length}</span></div>
          <div className="text-sm text-ink-muted">Badges unlocked</div>
          <Progress value={(unlockedCount / achievements.length) * 100} className="mt-3 w-full" tone="amber" />
        </Card>
      </div>

      {/* Level ladder */}
      <Card className="mt-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Star size={17} className="text-amber-500" /> Level ladder</h2>
        <div className="flex flex-wrap gap-2">
          {ladder.map((lvl) => {
            const reached = state.game.xp >= xpForLevel(lvl);
            const current = lvl === progress.level;
            return (
              <div key={lvl} className={cn("flex-1 min-w-[100px] rounded-xl border p-3 text-center transition", current ? "border-brand-400 bg-brand-500/10" : reached ? "border-teal-500/30 bg-teal-500/5" : "border-edge opacity-60")}>
                <div className={cn("mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold", reached ? "bg-brand-500 text-white" : "bg-surface text-ink-faint")}>{lvl}</div>
                <div className="mt-1.5 text-xs font-semibold">{LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((lvl - 1) / 3))]}</div>
                <div className="text-[10px] text-ink-faint">{xpForLevel(lvl).toLocaleString()} XP</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Badges grid */}
      <h2 className="mb-3 mt-6 flex items-center gap-2 font-semibold"><Trophy size={17} className="text-amber-500" /> Badges</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => {
          const unlocked = !!a.unlockedAt;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}>
              <Card className={cn("relative flex items-center gap-4 overflow-hidden", !unlocked && "opacity-70")}>
                {unlocked && <div className="absolute right-0 top-0 h-16 w-16 opacity-20" style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }} />}
                <div className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl", unlocked ? "bg-amber-500/12" : "bg-surface grayscale")}>
                  {unlocked ? a.emoji : <Lock size={22} className="text-ink-faint" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{a.name}</h3>{unlocked && <Badge tone="teal">✓</Badge>}</div>
                  <p className="text-xs text-ink-muted">{a.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
                    <span className="flex items-center gap-0.5"><Coins size={11} className="text-amber-500" /> {a.coins}</span>
                    {unlocked && <span>· {formatRelative(a.unlockedAt!)}</span>}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
