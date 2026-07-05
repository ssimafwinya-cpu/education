// ─── Titration curve simulator ───────────────────────────────────────────────
// Computes pH as a function of titrant volume for the four common monoprotic
// titrations. Exact aqueous equilibrium at each point (with a small water
// autoionisation floor so very dilute regions stay finite). Pure + unit-tested.
//
// Analyte sits in the flask; titrant is added from the burette.

const KW = 1e-14;

export type TitrationKind =
  | "strong-acid-strong-base" // strong acid analyte, strong base titrant
  | "weak-acid-strong-base"
  | "strong-base-strong-acid"
  | "weak-base-strong-acid";

export interface TitrationConfig {
  kind: TitrationKind;
  analyteConc: number; // mol/L
  analyteVol: number; // mL
  titrantConc: number; // mol/L
  /** For weak acid/base titrations. */
  Ka?: number;
  Kb?: number;
}

export interface TitrationPoint { volume: number; pH: number; }

export interface TitrationCurve {
  points: TitrationPoint[];
  equivalenceVolume: number; // mL
  equivalencePH: number;
  initialPH: number;
  maxVolume: number;
}

const pH = (h: number) => -Math.log10(Math.max(h, 1e-14));
const pOH = (oh: number) => 14 - pH(oh); // via Kw

/** pH of the analyte alone (before any titrant), used as the starting point. */
function initialPH(cfg: TitrationConfig): number {
  const c = cfg.analyteConc;
  switch (cfg.kind) {
    case "strong-acid-strong-base": return pH(c);
    case "strong-base-strong-acid": return 14 - pH(c);
    case "weak-acid-strong-base": {
      const Ka = cfg.Ka ?? 1e-5;
      const x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
      return pH(x);
    }
    case "weak-base-strong-acid": {
      const Kb = cfg.Kb ?? 1e-5;
      const x = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * c)) / 2;
      return 14 - pH(x); // pOH → pH
    }
  }
}

/** pH after `vb` mL of titrant has been added. */
function pointPH(cfg: TitrationConfig, vb: number): number {
  const Va = cfg.analyteVol / 1000; // L
  const Vb = vb / 1000;
  const nAnalyte = cfg.analyteConc * Va;
  const nTitrant = cfg.titrantConc * Vb;
  const Vtot = Va + Vb;

  switch (cfg.kind) {
    case "strong-acid-strong-base": {
      const net = nAnalyte - nTitrant; // remaining acid (mol)
      if (Math.abs(net) < 1e-12) return 7;
      return net > 0 ? pH(net / Vtot) : 14 - pH((-net) / Vtot);
    }
    case "strong-base-strong-acid": {
      const net = nAnalyte - nTitrant; // remaining base
      if (Math.abs(net) < 1e-12) return 7;
      return net > 0 ? 14 - pH(net / Vtot) : pH((-net) / Vtot);
    }
    case "weak-acid-strong-base": {
      const Ka = cfg.Ka ?? 1e-5;
      if (nTitrant < nAnalyte - 1e-12) {
        // buffer region: Henderson–Hasselbalch
        const HA = nAnalyte - nTitrant, A = nTitrant;
        if (A <= 0) { const x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * (HA / Vtot))) / 2; return pH(x); }
        return -Math.log10(Ka) + Math.log10(A / HA);
      }
      if (Math.abs(nTitrant - nAnalyte) < 1e-12) {
        // equivalence: conjugate base hydrolysis
        const cA = nAnalyte / Vtot;
        const Kb = KW / Ka;
        const oh = Math.sqrt(Kb * cA);
        return 14 - pH(oh);
      }
      const excess = nTitrant - nAnalyte;
      return 14 - pH(excess / Vtot);
    }
    case "weak-base-strong-acid": {
      const Kb = cfg.Kb ?? 1e-5;
      if (nTitrant < nAnalyte - 1e-12) {
        const B = nAnalyte - nTitrant, BH = nTitrant;
        if (BH <= 0) { const x = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * (B / Vtot))) / 2; return 14 - pH(x); }
        const pOHv = -Math.log10(Kb) + Math.log10(BH / B);
        return 14 - pOHv;
      }
      if (Math.abs(nTitrant - nAnalyte) < 1e-12) {
        const cB = nAnalyte / Vtot;
        const Ka = KW / Kb;
        const h = Math.sqrt(Ka * cB);
        return pH(h);
      }
      const excess = nTitrant - nAnalyte;
      return pH(excess / Vtot);
    }
  }
}

export function titrationCurve(cfg: TitrationConfig, steps = 200): TitrationCurve {
  const equivVol = (cfg.analyteConc * cfg.analyteVol) / cfg.titrantConc; // mL
  const maxVolume = Math.max(equivVol * 2, equivVol + 5);
  const points: TitrationPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = (maxVolume * i) / steps;
    points.push({ volume: Math.round(v * 100) / 100, pH: Math.round(pointPH(cfg, v) * 100) / 100 });
  }
  return {
    points,
    equivalenceVolume: Math.round(equivVol * 100) / 100,
    equivalencePH: Math.round(pointPH(cfg, equivVol) * 100) / 100,
    initialPH: Math.round(initialPH(cfg) * 100) / 100,
    maxVolume,
  };
}

/** Suitable indicator suggestion from the equivalence pH. */
export function suggestIndicator(equivalencePH: number): string {
  if (equivalencePH < 5) return "Methyl orange (pH 3.1–4.4)";
  if (equivalencePH > 8) return "Phenolphthalein (pH 8.3–10.0)";
  return "Bromothymol blue (pH 6.0–7.6)";
}
