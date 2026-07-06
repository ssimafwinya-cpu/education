import { describe, it, expect } from "vitest";
import { generateToken, hashToken, resetIdentifier, verifyIdentifier, RESET_TTL_MS, VERIFY_TTL_MS } from "./tokens";

describe("auth tokens", () => {
  it("generates unique raw tokens with matching hashes", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.raw.length).toBeGreaterThanOrEqual(40); // 32 bytes base64url
    expect(a.hash).toBe(hashToken(a.raw));
    expect(a.hash).toHaveLength(64); // sha256 hex
    expect(a.hash).not.toContain(a.raw);
  });

  it("hashing is deterministic and collision-separated", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("identifiers namespace purpose and normalise case", () => {
    expect(resetIdentifier("A@B.com")).toBe("reset:a@b.com");
    expect(verifyIdentifier("A@B.com")).toBe("verify:a@b.com");
    expect(resetIdentifier("x@y.z")).not.toBe(verifyIdentifier("x@y.z"));
  });

  it("reset expiry is shorter than verify expiry", () => {
    expect(RESET_TTL_MS).toBeLessThan(VERIFY_TTL_MS);
  });
});
