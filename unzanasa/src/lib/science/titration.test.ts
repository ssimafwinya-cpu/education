import { describe, it, expect } from "vitest";
import { titrationCurve, suggestIndicator, type TitrationConfig } from "./titration";

describe("titrationCurve — strong acid / strong base", () => {
  const cfg: TitrationConfig = {
    kind: "strong-acid-strong-base",
    analyteConc: 0.1, analyteVol: 25, titrantConc: 0.1,
  };
  const curve = titrationCurve(cfg);

  it("equivalence volume matches C·V/C", () => {
    expect(curve.equivalenceVolume).toBeCloseTo(25, 1);
  });
  it("starts acidic (pH ≈ 1)", () => {
    expect(curve.initialPH).toBeCloseTo(1, 1);
  });
  it("is neutral at the equivalence point", () => {
    expect(curve.equivalencePH).toBeCloseTo(7, 1);
  });
  it("ends basic after excess base", () => {
    const last = curve.points[curve.points.length - 1];
    expect(last.pH).toBeGreaterThan(11);
  });
  it("pH rises monotonically as base is added", () => {
    for (let i = 1; i < curve.points.length; i++) {
      expect(curve.points[i].pH).toBeGreaterThanOrEqual(curve.points[i - 1].pH - 0.01);
    }
  });
});

describe("titrationCurve — weak acid / strong base", () => {
  const cfg: TitrationConfig = {
    kind: "weak-acid-strong-base",
    analyteConc: 0.1, analyteVol: 25, titrantConc: 0.1, Ka: 1.8e-5,
  };
  const curve = titrationCurve(cfg);

  it("starts less acidic than a strong acid (pH ≈ 2.9)", () => {
    expect(curve.initialPH).toBeGreaterThan(2.5);
    expect(curve.initialPH).toBeLessThan(3.5);
  });
  it("has a basic equivalence point (> 8) due to conjugate base", () => {
    expect(curve.equivalencePH).toBeGreaterThan(8);
  });
  it("passes through pH = pKa at the half-equivalence point", () => {
    const halfV = curve.equivalenceVolume / 2;
    const nearest = curve.points.reduce((a, b) => (Math.abs(b.volume - halfV) < Math.abs(a.volume - halfV) ? b : a));
    expect(nearest.pH).toBeCloseTo(4.74, 0); // pKa of acetic acid
  });
});

describe("titrationCurve — weak base / strong acid", () => {
  const curve = titrationCurve({
    kind: "weak-base-strong-acid",
    analyteConc: 0.1, analyteVol: 25, titrantConc: 0.1, Kb: 1.8e-5,
  });
  it("starts basic and ends acidic", () => {
    expect(curve.initialPH).toBeGreaterThan(10);
    expect(curve.points[curve.points.length - 1].pH).toBeLessThan(3);
  });
  it("has an acidic equivalence point (< 6)", () => {
    expect(curve.equivalencePH).toBeLessThan(6);
  });
});

describe("suggestIndicator", () => {
  it("recommends by equivalence pH", () => {
    expect(suggestIndicator(7)).toContain("Bromothymol");
    expect(suggestIndicator(9)).toContain("Phenolphthalein");
    expect(suggestIndicator(4)).toContain("Methyl orange");
  });
});
