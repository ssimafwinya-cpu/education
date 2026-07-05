import { describe, it, expect } from "vitest";
import { evaluate, sampleFunction } from "./expression";

const evalNum = (s: string, vars?: Record<string, number>) => {
  const r = evaluate(s, vars);
  if (typeof r !== "number") throw new Error((r as { error: string }).error);
  return r;
};

describe("evaluate — arithmetic", () => {
  it("basic operations and precedence", () => {
    expect(evalNum("2+3*4")).toBe(14);
    expect(evalNum("(2+3)*4")).toBe(20);
    expect(evalNum("10/4")).toBe(2.5);
    expect(evalNum("7%3")).toBe(1);
  });
  it("exponent is right-associative", () => {
    expect(evalNum("2^3^2")).toBe(512); // 2^(3^2)
  });
  it("unary minus and plus", () => {
    expect(evalNum("-3+5")).toBe(2);
    expect(evalNum("2*-3")).toBe(-6);
    expect(evalNum("-(2+3)")).toBe(-5);
    expect(evalNum("+4")).toBe(4);
    expect(evalNum("-2^2")).toBe(-4); // unary binds looser than ^
  });
  it("scientific notation", () => {
    expect(evalNum("1e3+1")).toBe(1001);
    expect(evalNum("2.5e-2")).toBe(0.025);
  });
});

describe("evaluate — functions & constants", () => {
  it("trig and roots", () => {
    expect(evalNum("sin(0)")).toBe(0);
    expect(evalNum("cos(0)")).toBe(1);
    expect(evalNum("sqrt(16)")).toBe(4);
    expect(evalNum("sin(pi/2)")).toBeCloseTo(1, 10);
  });
  it("logs and exp", () => {
    expect(evalNum("ln(e)")).toBeCloseTo(1, 10);
    expect(evalNum("log(100)")).toBeCloseTo(2, 10);
    expect(evalNum("exp(0)")).toBe(1);
  });
  it("two-argument functions", () => {
    expect(evalNum("max(2,7)")).toBe(7);
    expect(evalNum("min(2,7)")).toBe(2);
    expect(evalNum("pow(2,10)")).toBe(1024);
    expect(evalNum("mod(-1,5)")).toBe(4);
  });
  it("nested calls", () => {
    expect(evalNum("sqrt(abs(-16))")).toBe(4);
    expect(evalNum("max(sin(0), cos(0))")).toBe(1);
  });
});

describe("evaluate — variables & implicit multiplication", () => {
  it("substitutes variables", () => {
    expect(evalNum("x^2+1", { x: 3 })).toBe(10);
  });
  it("implicit multiplication forms", () => {
    expect(evalNum("2x", { x: 5 })).toBe(10);
    expect(evalNum("3(x+1)", { x: 2 })).toBe(9);
    expect(evalNum("(1+1)(2+2)")).toBe(8);
    expect(evalNum("2pi")).toBeCloseTo(2 * Math.PI, 10);
    expect(evalNum("x sin(pi/2)", { x: 4 })).toBeCloseTo(4, 10);
  });
  it("unknown variable errors", () => {
    const r = evaluate("y+1");
    expect(typeof r).toBe("object");
    if (typeof r === "object") expect(r.error).toContain("Unknown variable");
  });
});

describe("evaluate — error handling", () => {
  it("mismatched parentheses", () => {
    expect(typeof evaluate("(2+3")).toBe("object");
    expect(typeof evaluate("2+3)")).toBe("object");
  });
  it("bad characters and empty input", () => {
    expect(typeof evaluate("2 $ 3")).toBe("object");
    expect(typeof evaluate("")).toBe("object");
  });
  it("wrong arity", () => {
    const r = evaluate("max(1)");
    expect(typeof r).toBe("object");
  });
});

describe("sampleFunction", () => {
  it("samples a parabola across the domain", () => {
    const { points, error } = sampleFunction("x^2", -2, 2, 4);
    expect(error).toBeUndefined();
    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({ x: -2, y: 4 });
    expect(points[2]).toEqual({ x: 0, y: 0 });
  });
  it("marks asymptotes as gaps (null)", () => {
    const { points } = sampleFunction("1/x", -1, 1, 2);
    // middle sample x=0 → Infinity → null gap
    expect(points[1]).toBeNull();
    expect(points[0]).not.toBeNull();
  });
  it("propagates compile errors", () => {
    const { error } = sampleFunction("x^^2", -1, 1);
    expect(error).toBeTruthy();
  });
});
