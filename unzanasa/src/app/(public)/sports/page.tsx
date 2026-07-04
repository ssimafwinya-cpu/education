import { PageHero, Section } from "@/components/public/sections";
import { Trophy, Medal } from "lucide-react";

const TABLE = [
  { team: "Physics FC", p: 8, w: 6, d: 1, l: 1, pts: 19 },
  { team: "Chemistry United", p: 8, w: 5, d: 2, l: 1, pts: 17 },
  { team: "Biology Lions", p: 8, w: 4, d: 2, l: 2, pts: 14 },
  { team: "Maths Rangers", p: 8, w: 3, d: 2, l: 3, pts: 11 },
  { team: "CompSci Coders", p: 8, w: 2, d: 1, l: 5, pts: 7 },
  { team: "Geology Rovers", p: 8, w: 1, d: 0, l: 7, pts: 3 },
];

export default function Sports() {
  return (
    <div>
      <PageHero eyebrow="Sports & Recreation" title="Inter-department sport at UNZANASA" subtitle="Leagues, tournaments and fitness — building teamwork and wellbeing across the sciences." />

      <Section title="Department league table">
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-edge bg-surface text-left text-xs text-ink-faint">
                <tr>
                  <th className="px-4 py-3">#</th><th className="px-4 py-3">Team</th>
                  <th className="px-3 py-3 text-center">P</th><th className="px-3 py-3 text-center">W</th>
                  <th className="px-3 py-3 text-center">D</th><th className="px-3 py-3 text-center">L</th>
                  <th className="px-4 py-3 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((t, i) => (
                  <tr key={t.team} className="border-b border-edge last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-gold text-forest" : i < 3 ? "bg-brand-500/15 text-brand-600 dark:text-brand-300" : "text-ink-faint"}`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{t.team}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{t.p}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{t.w}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{t.d}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{t.l}</td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums">{t.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section title="Sports programme">
        <div className="grid gap-4 sm:grid-cols-3">
          {[["Football", "🏆"], ["Basketball", "🏀"], ["Netball", "🥅"], ["Athletics", "🏃"], ["Chess", "♟️"], ["Volleyball", "🏐"]].map(([sport, emoji]) => (
            <div key={sport} className="card flex items-center gap-3 p-5"><span className="text-2xl">{emoji}</span><span className="font-semibold">{sport}</span></div>
          ))}
        </div>
      </Section>

      <Section title="Honours" className="!pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { Icon: Trophy, t: "Reigning Champions", d: "Physics FC — 2025 Inter-Department League" },
            { Icon: Medal, t: "Sportsmanship Award", d: "Biology Lions — Fair Play 2025" },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="card flex items-center gap-4 p-6"><div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold-600"><Icon size={22} /></div><div><div className="font-semibold">{t}</div><div className="text-sm text-ink-muted">{d}</div></div></div>
          ))}
        </div>
      </Section>
    </div>
  );
}
