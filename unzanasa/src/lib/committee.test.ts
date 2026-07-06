import { describe, it, expect } from "vitest";
import { OFFICES, defaultCommittee, committeeOf, officeDef, isVacant, filledCount } from "./committee";
import type { AppState, ExecMember } from "./types";

describe("offices", () => {
  it("has the ten Article 8 positions (incl. two committee members)", () => {
    expect(OFFICES).toHaveLength(10);
    expect(OFFICES[0].office).toBe("President");
    expect(OFFICES.filter((o) => o.office === "Committee Member")).toHaveLength(2);
  });
});

describe("defaultCommittee", () => {
  it("is all vacant", () => {
    const c = defaultCommittee();
    expect(c).toHaveLength(10);
    expect(c.every(isVacant)).toBe(true);
    expect(filledCount(c)).toBe(0);
  });
});

describe("committeeOf", () => {
  it("returns defaults when nothing is stored", () => {
    const c = committeeOf({} as AppState);
    expect(c).toHaveLength(10);
    expect(filledCount(c)).toBe(0);
  });
  it("merges stored holders onto the canonical office order", () => {
    const stored: ExecMember[] = [{ id: "off_president", office: "President", name: "Kasikila Isaac", affiliation: "Physics" }];
    const c = committeeOf({ committee: stored } as AppState);
    expect(c).toHaveLength(10);
    const pres = c.find((m) => m.id === "off_president")!;
    expect(pres.name).toBe("Kasikila Isaac");
    expect(isVacant(pres)).toBe(false);
    expect(filledCount(c)).toBe(1);
  });
});

describe("officeDef", () => {
  it("looks up the duty + emoji for an office id", () => {
    expect(officeDef("off_treasurer")?.duty).toContain("Financial Committee");
    expect(officeDef("nope")).toBeUndefined();
  });
});
