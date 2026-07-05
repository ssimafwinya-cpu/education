import { describe, it, expect } from "vitest";
import { iupacFromSmiles } from "./iupac";

const name = (smiles: string): string => {
  const r = iupacFromSmiles(smiles);
  if ("error" in r) throw new Error(`${smiles}: ${r.error}`);
  return r.name;
};
const fails = (smiles: string): boolean => "error" in iupacFromSmiles(smiles);

describe("alkanes", () => {
  it("straight chains", () => {
    expect(name("C")).toBe("methane");
    expect(name("CC")).toBe("ethane");
    expect(name("CCC")).toBe("propane");
    expect(name("CCCCCCCC")).toBe("octane");
  });
  it("branched, with lowest-locant numbering", () => {
    expect(name("CC(C)C")).toBe("2-methylpropane");
    expect(name("CC(C)CC")).toBe("2-methylbutane");
    expect(name("CC(C)(C)C")).toBe("2,2-dimethylpropane");
    expect(name("CCC(C)CC(C)C")).toBe("2,4-dimethylhexane");
    expect(name("CC(C)CC(C)(C)C")).toBe("2,2,4-trimethylpentane");
  });
  it("prefers the chain with more substituents on a length tie", () => {
    expect(name("CCCCC(C(C)C)CC")).toBe("3-ethyl-2-methylheptane");
  });
  it("names complex substituents", () => {
    expect(name("CCCCC(C(C)C)CCCC")).toBe("5-(propan-2-yl)nonane");
    expect(name("CCCC(CCC)C(C)(C)C")).toBe("4-tert-butylheptane");
  });
});

describe("alkenes and alkynes", () => {
  it("simple unsaturation", () => {
    expect(name("C=C")).toBe("ethene");
    expect(name("C#C")).toBe("ethyne");
    expect(name("CC=CC")).toBe("but-2-ene");
    expect(name("CC#CCC")).toBe("pent-2-yne");
  });
  it("dienes and enynes", () => {
    expect(name("C=CC=C")).toBe("buta-1,3-diene");
    expect(name("C#CCC=C")).toBe("pent-1-en-4-yne"); // ene beats yne on the locant tie
  });
});

describe("alcohols", () => {
  it("suffix with locants", () => {
    expect(name("CCO")).toBe("ethanol");
    expect(name("CC(O)C")).toBe("propan-2-ol");
    expect(name("CC(C)CO")).toBe("2-methylpropan-1-ol");
    expect(name("CC(C)(O)C")).toBe("2-methylpropan-2-ol");
    expect(name("CC(O)C(C)C")).toBe("3-methylbutan-2-ol");
  });
  it("polyols keep the 'e' and multiply the suffix", () => {
    expect(name("OCCO")).toBe("ethane-1,2-diol");
    expect(name("OCC(O)CO")).toBe("propane-1,2,3-triol"); // glycerol
  });
  it("unsaturated alcohols", () => {
    expect(name("C=CCO")).toBe("prop-2-en-1-ol");
  });
});

describe("aldehydes and ketones", () => {
  it("aldehydes", () => {
    expect(name("C=O")).toBe("methanal");
    expect(name("CC=O")).toBe("ethanal");
    expect(name("CCCC=O")).toBe("butanal");
  });
  it("ketones", () => {
    expect(name("CC(=O)C")).toBe("propan-2-one");
    expect(name("CCC(=O)CC")).toBe("pentan-3-one");
    expect(name("CC(=O)CC(C)=O")).toBe("pentane-2,4-dione");
  });
  it("ketone beats alcohol for the suffix; OH becomes hydroxy", () => {
    expect(name("OCC(C)=O")).toBe("1-hydroxypropan-2-one");
  });
});

describe("carboxylic acids", () => {
  it("monoacids", () => {
    expect(name("OC=O")).toBe("methanoic acid");
    expect(name("CC(=O)O")).toBe("ethanoic acid");
    expect(name("CCCC(=O)O")).toBe("butanoic acid");
    expect(name("CC=CC(=O)O")).toBe("but-2-enoic acid");
  });
  it("diacids", () => {
    expect(name("OC(=O)CC(=O)O")).toBe("propanedioic acid");
  });
  it("acid outranks a carbonyl, which becomes oxo", () => {
    expect(name("O=CCC(=O)O")).toBe("3-oxopropanoic acid");
  });
});

describe("amines", () => {
  it("primary amines", () => {
    expect(name("CCN")).toBe("ethanamine");
    expect(name("CC(N)C")).toBe("propan-2-amine");
  });
});

describe("halides", () => {
  it("halo prefixes with alphabetization", () => {
    expect(name("CCCl")).toBe("chloroethane");
    expect(name("ClCCCl")).toBe("1,2-dichloroethane");
    expect(name("ClC(Cl)(Cl)Cl")).toBe("tetrachloromethane");
    expect(name("CC(Cl)CC(C)C")).toBe("2-chloro-4-methylpentane"); // chloro cited (and numbered) first
  });
});

describe("honest refusals — never a wrong name", () => {
  it("refuses rings, aromatics, ethers, esters, amides, nitriles", () => {
    expect(fails("c1ccccc1")).toBe(true); // benzene
    expect(fails("C1CCC1")).toBe(true); // cyclobutane
    expect(fails("CCOC")).toBe(true); // ether
    expect(fails("CC(=O)OC")).toBe(true); // ester
    expect(fails("CC(=O)N")).toBe(true); // amide
    expect(fails("CC#N")).toBe(true); // nitrile
  });
  it("refuses disconnected structures and non-carbon species", () => {
    expect(fails("CC.CC")).toBe(true);
    expect(fails("O")).toBe(true); // water: no carbon skeleton
  });
});
