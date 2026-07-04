import { describe, it, expect } from "vitest";
import { exportDeckTsv, parseDeckFile, normalizeFront, dedupeAgainst } from "./deck-io";

describe("exportDeckTsv", () => {
  it("produces one row per card with a directive header", () => {
    const tsv = exportDeckTsv([
      { front: "What is ATP?", back: "Energy currency", tags: ["bio"] },
      { front: "2+2?", back: "4", tags: [] },
    ]);
    expect(tsv).toContain("#separator:tab");
    const rows = tsv.split("\n").filter((l) => l && !l.startsWith("#"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toBe("What is ATP?\tEnergy currency\tbio");
  });
  it("encodes tabs and newlines so notes stay one-per-line", () => {
    const tsv = exportDeckTsv([{ front: "a\tb", back: "line1\nline2", tags: [] }]);
    const row = tsv.split("\n").filter((l) => l && !l.startsWith("#"))[0];
    expect(row.split("\t")).toHaveLength(3);
    expect(row).toContain("<br>");
  });
});

describe("parseDeckFile", () => {
  it("round-trips its own export", () => {
    const original = [
      { front: "What is ATP?", back: "Energy currency", tags: ["bio", "energy"] },
      { front: "Capital of France?", back: "Paris", tags: [] },
    ];
    const parsed = parseDeckFile(exportDeckTsv(original));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].front).toBe("What is ATP?");
    expect(parsed[0].back).toBe("Energy currency");
    expect(parsed[0].tags).toEqual(["bio", "energy"]);
  });

  it("parses plain TSV without directives", () => {
    const parsed = parseDeckFile("Q1\tA1\nQ2\tA2\ttag1 tag2\n");
    expect(parsed).toHaveLength(2);
    expect(parsed[1].tags).toEqual(["tag1", "tag2"]);
  });

  it("parses CSV with quoted fields and embedded commas", () => {
    const parsed = parseDeckFile('"What is DNA, exactly?","Deoxyribonucleic acid, the molecule of heredity"\nQ2,A2');
    expect(parsed).toHaveLength(2);
    expect(parsed[0].front).toBe("What is DNA, exactly?");
    expect(parsed[0].back).toContain("heredity");
  });

  it("handles escaped quotes inside CSV fields", () => {
    const parsed = parseDeckFile('"She said ""hi""","greeting"');
    expect(parsed[0].front).toBe('She said "hi"');
  });

  it("skips a header row and blank/ragged lines", () => {
    const parsed = parseDeckFile("front,back\n\nQ1,A1\nonly-one-field\nQ2,A2");
    expect(parsed.map((c) => c.front)).toEqual(["Q1", "Q2"]);
  });

  it("decodes <br> back to newlines", () => {
    const parsed = parseDeckFile("Q<br>line2\tA1");
    expect(parsed[0].front).toBe("Q\nline2");
  });

  it("respects the maxCards cap", () => {
    const big = Array.from({ length: 50 }, (_, i) => `Q${i}\tA${i}`).join("\n");
    expect(parseDeckFile(big, 10)).toHaveLength(10);
  });

  it("returns empty for garbage input", () => {
    expect(parseDeckFile("")).toHaveLength(0);
    expect(parseDeckFile("#only:directives\n#another")).toHaveLength(0);
  });
});

describe("normalizeFront", () => {
  it("is case/punctuation/whitespace insensitive", () => {
    expect(normalizeFront("What is  ATP?!")).toBe(normalizeFront("what is atp"));
  });
  it("unmasks cloze syntax", () => {
    expect(normalizeFront("The {{c1::mitochondrion}} is key")).toBe(normalizeFront("The mitochondrion is key"));
  });
});

describe("dedupeAgainst", () => {
  it("skips cards already in the deck", () => {
    const { kept, skipped } = dedupeAgainst(
      ["What is ATP?"],
      [{ front: "what is atp" }, { front: "New question?" }],
    );
    expect(kept.map((c) => c.front)).toEqual(["New question?"]);
    expect(skipped).toBe(1);
  });
  it("dedupes within the incoming batch itself", () => {
    const { kept, skipped } = dedupeAgainst([], [{ front: "Q1" }, { front: "q1!" }, { front: "Q2" }]);
    expect(kept).toHaveLength(2);
    expect(skipped).toBe(1);
  });
  it("drops cards with empty normalised fronts", () => {
    const { kept } = dedupeAgainst([], [{ front: "???" }]);
    expect(kept).toHaveLength(0);
  });
});
