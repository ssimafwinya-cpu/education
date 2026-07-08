// ─── Career Mode starter course ──────────────────────────────────────────────
// A fully-built CHE 1000 path so Career Mode works out of the box. The teach
// scripts are written strictly from the hub's CHE 1000 starter notes; drill
// and move-test questions are exam-style (labelled as such — no real past
// paper is claimed). When the association feeds real lecture notes and past
// papers per course, they slot into the same CareerCourse shape.

import type { CareerCourse, CareerQuestion } from "./career";

const mcq = (id: string, prompt: string, options: string[], answerIndex: number, explanation: string, sourceRef = "Practice set"): CareerQuestion =>
  ({ id, kind: "mcq", prompt, options, answerIndex, explanation, source: "exam-style", sourceRef });
const tf = (id: string, prompt: string, answer: boolean, explanation: string): CareerQuestion =>
  ({ id, kind: "truefalse", prompt, options: ["True", "False"], answerIndex: answer ? 0 : 1, explanation, source: "exam-style" });
const fill = (id: string, prompt: string, answers: string[], explanation: string): CareerQuestion =>
  ({ id, kind: "fill", prompt, answerText: answers, explanation, source: "exam-style" });

export const CHE1000_CAREER: CareerCourse = {
  id: "career_che1000",
  code: "CHE 1000",
  title: "Introductory Chemistry",
  emoji: "⚗️",
  intro: "The full CHE 1000 foundation as one locked path: prove each concept before the next unlocks, then keep it alive with memory checks.",
  topics: [
    {
      id: "atoms",
      title: "Atomic Structure",
      emoji: "⚛️",
      whyLine: "The foundation everything else stands on — atomic structure questions open almost every paper.",
      examWeight: 3,
      prereqs: [],
      teach: [
        {
          heading: "The three particles",
          body: "Every atom is built from three particles. Protons (+1 charge) and neutrons (no charge) sit in the nucleus; electrons (−1 charge) occupy the space around it. Nearly all the mass is in the nucleus, but nearly all the volume is the electron cloud.",
          check: mcq("at_c1", "Which particle carries no charge?", ["Proton", "Neutron", "Electron", "Ion"], 1, "Neutrons are neutral; protons are +1, electrons −1."),
        },
        {
          heading: "Atomic number and mass number",
          body: "The atomic number (Z) is the number of protons — it defines the element and never changes for it. The mass number (A) is protons + neutrons. In a neutral atom, electrons equal protons.",
          check: fill("at_c2", "An atom with 6 protons and 8 neutrons has a mass number of ______.", ["14"], "A = protons + neutrons = 6 + 8 = 14 (this is carbon-14)."),
        },
        {
          heading: "Isotopes",
          body: "Isotopes are atoms of the same element (same Z) with different numbers of neutrons (different A). They behave the same chemically because chemistry is driven by electrons, not neutrons. Relative atomic mass is the weighted average over an element's isotopes.",
          check: tf("at_c3", "Isotopes of an element differ in their number of protons.", false, "Same protons (that defines the element) — they differ in neutrons."),
        },
      ],
      drill: [
        mcq("at_d1", "Chlorine-35 and chlorine-37 differ in their number of:", ["Protons", "Electrons", "Neutrons", "Shells"], 2, "Same Z (17 protons); 18 vs 20 neutrons."),
        fill("at_d2", "The number of protons in a nucleus is called the ______ number.", ["atomic"], "Z, the atomic number, defines the element."),
        mcq("at_d3", "A neutral atom of ²³Na (Z = 11) contains:", ["11 p, 11 n, 12 e", "11 p, 12 n, 11 e", "12 p, 11 n, 11 e", "11 p, 12 n, 12 e"], 1, "Z = 11 protons; A − Z = 23 − 11 = 12 neutrons; neutral → 11 electrons."),
        tf("at_d4", "Most of an atom's volume is empty space around the nucleus.", true, "The nucleus is tiny; the electron cloud fills the volume."),
      ],
      moveTest: [
        mcq("at_m1", "Which statement about ⁶³Cu and ⁶⁵Cu is correct?", ["Different elements", "Same neutrons, different protons", "Same protons, different neutrons", "Different chemical behaviour"], 2, "Isotopes: same Z, different neutron count, same chemistry."),
        fill("at_m2", "An ion with 12 protons and 10 electrons has a charge of ______.", ["+2", "2+"], "12 − 10 = 2 more protons than electrons → 2+."),
        tf("at_m3", "The mass number of an atom equals its protons plus its electrons.", false, "A = protons + neutrons."),
      ],
    },
    {
      id: "econfig",
      title: "Electron Configuration",
      emoji: "🌀",
      whyLine: "Configurations and shell structure are a guaranteed short-answer earner once atomic structure is set.",
      examWeight: 3,
      prereqs: ["atoms"],
      teach: [
        {
          heading: "Shells and capacity",
          body: "Electrons occupy shells of increasing energy. The first shell holds 2 electrons, the second 8, the third 8 (at this level). Fill from the lowest shell up: sodium (Z = 11) is 2, 8, 1.",
          check: fill("ec_c1", "The electron arrangement of magnesium (Z = 12) is 2, 8, ______.", ["2"], "12 electrons: 2 + 8 + 2."),
        },
        {
          heading: "Valence electrons and groups",
          body: "The outermost-shell electrons are the valence electrons — they do all the chemistry. Elements in the same group of the periodic table have the same number of valence electrons, which is why they react alike.",
          check: mcq("ec_c2", "How many valence electrons does chlorine (2, 8, 7) have?", ["2", "7", "8", "17"], 1, "The outer shell holds 7 — hence chlorine gains one electron to complete it."),
        },
      ],
      drill: [
        fill("ec_d1", "Potassium (Z = 19) has the arrangement 2, 8, 8, ______.", ["1"], "19 electrons: 2 + 8 + 8 + 1 — one valence electron, like all Group I metals."),
        mcq("ec_d2", "An atom with the arrangement 2, 8, 6 is in group:", ["II", "IV", "VI", "VIII"], 2, "Six valence electrons → Group VI (like oxygen and sulphur)."),
        tf("ec_d3", "Elements in the same group have similar chemical properties because they have the same number of shells.", false, "It's the same number of valence electrons, not shells."),
      ],
      moveTest: [
        fill("ec_m1", "Aluminium (Z = 13) has ______ valence electrons.", ["3"], "2, 8, 3 — three in the outer shell."),
        mcq("ec_m2", "Which species has the arrangement 2, 8, 8?", ["Ne", "Cl⁻", "Na⁺", "O²⁻"], 1, "Cl (2,8,7) gains one electron → 2,8,8 (argon-like)."),
        tf("ec_m3", "A full outer shell makes an atom chemically stable.", true, "That's why noble gases are inert and ions form to reach full shells."),
      ],
    },
    {
      id: "bonding",
      title: "Chemical Bonding",
      emoji: "🔗",
      whyLine: "Ionic vs covalent bonding is a classic compare-and-contrast question — reliable marks if you know both cold.",
      examWeight: 4,
      prereqs: ["econfig"],
      teach: [
        {
          heading: "Ionic bonding",
          body: "Metals lose valence electrons, non-metals gain them: the resulting oppositely-charged ions attract. Sodium (2,8,1) gives its electron to chlorine (2,8,7) → Na⁺ and Cl⁻ → NaCl. Ionic compounds form lattices with high melting points and conduct when molten or dissolved.",
          check: mcq("bo_c1", "In ionic bonding, electrons are:", ["Shared equally", "Shared unequally", "Transferred", "Delocalised"], 2, "Transfer from metal to non-metal creates the ions."),
        },
        {
          heading: "Covalent bonding",
          body: "Two non-metals share electron pairs so both reach full shells. Each shared pair is one bond: H₂O has two O–H single bonds; O₂ has a double bond; N₂ a triple. Covalent substances are usually molecular with low melting points and don't conduct.",
          check: tf("bo_c2", "A double bond is two shared pairs of electrons.", true, "One shared pair per bond: double = 2 pairs, triple = 3."),
        },
      ],
      drill: [
        mcq("bo_d1", "Which pair forms an ionic compound?", ["C and O", "H and O", "Mg and Cl", "N and H"], 2, "Metal + non-metal → ionic (MgCl₂)."),
        mcq("bo_d2", "Which property points to a covalent molecular substance?", ["Conducts when molten", "High melting point", "Low boiling point", "Lattice of ions"], 2, "Weak forces between molecules → low melting/boiling points."),
        fill("bo_d3", "In N₂ the two atoms share ______ pairs of electrons.", ["3", "three"], "Nitrogen needs three more electrons each → a triple bond."),
        tf("bo_d4", "Ionic compounds conduct electricity in the solid state.", false, "Ions are fixed in the lattice; they conduct only molten or in solution."),
      ],
      moveTest: [
        mcq("bo_m1", "Calcium (2,8,8,2) bonds with fluorine (2,7). The formula of the compound is:", ["CaF", "Ca₂F", "CaF₂", "Ca₂F₃"], 2, "Ca loses 2 electrons; each F accepts 1 → CaF₂."),
        tf("bo_m2", "Electron pairs shared between two non-metals constitute covalent bonding.", true, "Sharing (not transfer) is the covalent mechanism."),
        fill("bo_m3", "Ionic compounds arrange their ions in a giant ______.", ["lattice"], "A repeating 3-D lattice held by electrostatic attraction."),
      ],
    },
    {
      id: "mole",
      title: "The Mole",
      emoji: "⚖️",
      whyLine: "Every calculation question in the paper runs through n = m/M — this is the highest-leverage skill in the course.",
      examWeight: 5,
      prereqs: ["atoms"],
      teach: [
        {
          heading: "What a mole is",
          body: "A mole is a counting unit: 6.022 × 10²³ particles (Avogadro's number). One mole of carbon-12 weighs exactly 12 g. The molar mass M (g/mol) is numerically the relative formula mass.",
          check: mcq("mo_c1", "One mole of any substance contains:", ["6.022 × 10²³ particles", "12 particles", "1 g of particles", "22.4 particles"], 0, "Avogadro's number of particles — atoms, molecules or ions."),
        },
        {
          heading: "n = m / M",
          body: "Moles = mass ÷ molar mass. Water: M(H₂O) = 2(1) + 16 = 18 g/mol, so 36 g of water is 36/18 = 2 mol. Rearranged: m = nM and M = m/n. Master the triangle and every stoichiometry question opens up.",
          check: fill("mo_c2", "How many moles are in 44 g of CO₂ (M = 44 g/mol)? ______", ["1", "1 mol", "one"], "n = m/M = 44/44 = 1 mol."),
        },
      ],
      drill: [
        fill("mo_d1", "M(NaOH) = 23 + 16 + 1 = ______ g/mol.", ["40"], "Add the atomic masses: 23 + 16 + 1."),
        mcq("mo_d2", "How many moles are in 8 g of CH₄ (M = 16 g/mol)?", ["0.25", "0.5", "2", "8"], 1, "n = 8/16 = 0.5 mol."),
        mcq("mo_d3", "What is the mass of 0.25 mol of CaCO₃ (M = 100 g/mol)?", ["25 g", "40 g", "100 g", "400 g"], 0, "m = nM = 0.25 × 100 = 25 g."),
        tf("mo_d4", "The molar mass of O₂ is 16 g/mol.", false, "O₂ is diatomic: 2 × 16 = 32 g/mol."),
      ],
      moveTest: [
        mcq("mo_m1", "How many molecules are in 0.5 mol of water?", ["3.011 × 10²³", "6.022 × 10²³", "1.204 × 10²⁴", "0.5"], 0, "0.5 × 6.022 × 10²³ = 3.011 × 10²³."),
        fill("mo_m2", "18 g of glucose C₆H₁₂O₆ (M = 180 g/mol) is ______ mol.", ["0.1", ".1"], "n = 18/180 = 0.1 mol."),
        tf("mo_m3", "Molar mass in g/mol is numerically equal to relative formula mass.", true, "That equality is what makes n = m/M work."),
      ],
    },
    {
      id: "stoich",
      title: "Stoichiometry",
      emoji: "🧮",
      whyLine: "The long-answer banker: balance the equation, convert to moles, use the ratio. Full method marks live here.",
      examWeight: 4,
      prereqs: ["mole", "bonding"],
      teach: [
        {
          heading: "Balancing equations",
          body: "Atoms are conserved: the same count of each element must appear on both sides. Balance H₂ + O₂ → H₂O by inspection: 2H₂ + O₂ → 2H₂O. Only coefficients change — never the formulas themselves.",
          check: mcq("st_c1", "Balanced: N₂ + __H₂ → 2NH₃. The missing coefficient is:", ["1", "2", "3", "4"], 2, "6 H needed on the right → 3H₂."),
        },
        {
          heading: "Mole ratios",
          body: "Coefficients are mole ratios. In 2H₂ + O₂ → 2H₂O, 2 mol H₂ react per 1 mol O₂. Method: convert given mass to moles, apply the ratio, convert back to mass. The reactant that runs out first (smallest moles ÷ coefficient) limits the yield.",
          check: fill("st_c2", "In 2H₂ + O₂ → 2H₂O, how many moles of O₂ react with 4 mol of H₂? ______", ["2"], "Ratio 2:1 → 4 mol H₂ needs 2 mol O₂."),
        },
      ],
      drill: [
        mcq("st_d1", "CH₄ + 2O₂ → CO₂ + 2H₂O. Moles of O₂ needed for 0.5 mol CH₄:", ["0.5", "1", "2", "4"], 1, "1:2 ratio → 0.5 × 2 = 1 mol."),
        fill("st_d2", "Balance: __Al + 3Cl₂ → 2AlCl₃. The missing coefficient is ______.", ["2"], "2 Al on the right → 2 Al on the left."),
        mcq("st_d3", "2 mol H₂ and 2 mol O₂ are mixed (2H₂ + O₂ → 2H₂O). The limiting reagent is:", ["H₂", "O₂", "H₂O", "Neither"], 0, "H₂ supports extent 1 (2/2); O₂ supports 2 (2/1) → H₂ limits."),
      ],
      moveTest: [
        mcq("st_m1", "What mass of CO₂ (M = 44) forms from 0.25 mol CH₄ burned completely?", ["11 g", "22 g", "44 g", "88 g"], 0, "1:1 ratio → 0.25 mol CO₂ = 0.25 × 44 = 11 g."),
        fill("st_m2", "Balance: 2Mg + O₂ → ______ MgO.", ["2"], "2 Mg and 2 O on each side."),
        tf("st_m3", "The limiting reagent is always the reactant present in the smaller mass.", false, "It's the smallest moles ÷ coefficient — mass alone can mislead."),
      ],
    },
    {
      id: "acids",
      title: "Acids, Bases & pH",
      emoji: "🧪",
      whyLine: "The closer of most papers — definitions, the pH scale and neutralisation are quick, reliable marks.",
      examWeight: 3,
      prereqs: ["stoich"],
      teach: [
        {
          heading: "Acids and bases",
          body: "An acid releases H⁺ ions in water; a base accepts H⁺ (alkalis are soluble bases releasing OH⁻). Strong acids like HCl ionise completely; weak acids like ethanoic acid only partially. Acid + base → salt + water (neutralisation).",
          check: mcq("ac_c1", "A substance that releases H⁺ ions in water is:", ["A base", "An acid", "A salt", "An alkali"], 1, "That's the working definition of an acid at this level."),
        },
        {
          heading: "The pH scale",
          body: "pH measures H⁺ concentration: below 7 acidic, 7 neutral, above 7 basic. Each pH unit is a tenfold change in H⁺. Indicators: litmus (red/blue), phenolphthalein (colourless→pink in base), methyl orange (red in acid).",
          check: fill("ac_c2", "A solution of pH 3 has ______ times more H⁺ than one of pH 5.", ["100", "one hundred"], "Two units → 10 × 10 = 100-fold."),
        },
      ],
      drill: [
        mcq("ac_d1", "HCl + NaOH → NaCl + H₂O is an example of:", ["Oxidation", "Neutralisation", "Decomposition", "Displacement"], 1, "Acid + alkali → salt + water."),
        tf("ac_d2", "A weak acid ionises completely in water.", false, "Weak acids ionise partially — that's what makes them weak."),
        fill("ac_d3", "The pH of a neutral solution at 25 °C is ______.", ["7", "seven"], "Neutral water sits at pH 7."),
      ],
      moveTest: [
        mcq("ac_m1", "Which is a strong acid?", ["Ethanoic acid", "Carbonic acid", "Hydrochloric acid", "Citric acid"], 2, "HCl ionises completely; the others are weak."),
        fill("ac_m2", "Acid + metal carbonate → salt + water + ______.", ["carbon dioxide", "co2", "CO2"], "The fizz test: CO₂ turns limewater milky."),
        tf("ac_m3", "Phenolphthalein is pink in basic solution.", true, "Colourless in acid, pink above ~pH 8.3."),
      ],
    },
  ],
};

export const CAREER_COURSES: CareerCourse[] = [CHE1000_CAREER];

export function careerCourseById(id: string): CareerCourse | undefined {
  return CAREER_COURSES.find((c) => c.id === id);
}
