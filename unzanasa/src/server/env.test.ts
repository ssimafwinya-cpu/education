import { describe, it, expect } from "vitest";
import { checkEnv, formatReport } from "./env";

const prod = { NODE_ENV: "production", AUTH_SECRET: "x".repeat(44), DATABASE_URL: "postgresql://u:p@h:5432/db", NEXT_PUBLIC_APP_URL: "https://hub.unza.zm", RESEND_API_KEY: "re_123", MAIL_FROM: "Hub <no-reply@unza.zm>" };

describe("checkEnv — production", () => {
  it("a fully configured production env passes with no errors", () => {
    const r = checkEnv(prod);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.production).toBe(true);
  });

  it("errors when AUTH_SECRET is missing in production", () => {
    const r = checkEnv({ ...prod, AUTH_SECRET: undefined });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.key === "AUTH_SECRET")).toBe(true);
  });

  it("allows the dev-secret override for throwaway prod environments", () => {
    const r = checkEnv({ ...prod, AUTH_SECRET: undefined, COGNIFY_ALLOW_DEV_SECRET: "1" });
    expect(r.errors.some((e) => e.key === "AUTH_SECRET")).toBe(false);
  });

  it("errors on a non-postgres DATABASE_URL in production", () => {
    const r = checkEnv({ ...prod, DATABASE_URL: "mysql://x" });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.key === "DATABASE_URL")).toBe(true);
  });

  it("warns (not errors) when no database is configured", () => {
    const r = checkEnv({ ...prod, DATABASE_URL: undefined });
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.key === "DATABASE_URL")).toBe(true);
  });

  it("warns about http app url and missing mail key", () => {
    const r = checkEnv({ ...prod, NEXT_PUBLIC_APP_URL: "http://hub.unza.zm", RESEND_API_KEY: undefined });
    expect(r.warnings.some((w) => w.key === "NEXT_PUBLIC_APP_URL")).toBe(true);
    expect(r.warnings.some((w) => w.key === "RESEND_API_KEY")).toBe(true);
  });
});

describe("checkEnv — development", () => {
  it("an empty dev env is OK (no hard errors), just informational", () => {
    const r = checkEnv({ NODE_ENV: "development" });
    expect(r.ok).toBe(true);
    expect(r.production).toBe(false);
    expect(r.info.length).toBeGreaterThan(0);
  });
});

describe("formatReport", () => {
  it("renders a pass/fail summary line", () => {
    expect(formatReport(checkEnv(prod))).toContain("Preflight OK.");
    expect(formatReport(checkEnv({ ...prod, AUTH_SECRET: undefined }))).toContain("Preflight FAILED");
  });
});
