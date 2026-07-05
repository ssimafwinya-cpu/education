// ─── Expression engine ───────────────────────────────────────────────────────
// A safe math-expression evaluator (no eval): tokenizer → shunting-yard →
// RPN evaluation. Supports +,-,*,/,^,%, parentheses, unary minus, implicit
// multiplication (2x, 3(x+1), x sin(x)), functions, constants and a variable
// environment. Powers the graphing + scientific calculators.

export type Token =
  | { kind: "num"; value: number }
  | { kind: "name"; value: string } // variable or function, resolved at parse
  | { kind: "op"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "comma" };

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sqrt: Math.sqrt, cbrt: Math.cbrt,
  ln: Math.log, log: Math.log10, log2: Math.log2,
  exp: Math.exp, abs: Math.abs,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  sign: Math.sign,
  min: Math.min, max: Math.max,
  atan2: Math.atan2, pow: Math.pow, mod: (a, b) => ((a % b) + b) % b,
};

const FUNCTION_ARITY: Record<string, number> = {
  min: 2, max: 2, atan2: 2, pow: 2, mod: 2,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2,
};

// precedence, right-associative?
const OPS: Record<string, { prec: number; right: boolean }> = {
  "+": { prec: 1, right: false },
  "-": { prec: 1, right: false },
  "*": { prec: 2, right: false },
  "/": { prec: 2, right: false },
  "%": { prec: 2, right: false },
  "u-": { prec: 3, right: true }, // unary minus
  "^": { prec: 4, right: true },
};

export function tokenize(input: string): Token[] | { error: string } {
  const tokens: Token[] = [];
  // Whitespace separates tokens (so "x sin(x)" stays two names) but is
  // otherwise ignored — do NOT strip it before scanning.
  const s = input;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      // scientific notation 1e-3
      if (s[i] === "e" || s[i] === "E") {
        const rest = s.slice(i);
        const m = rest.match(/^[eE][+-]?\d+/);
        if (m) { num += m[0]; i += m[0].length; }
      }
      const value = Number(num);
      if (isNaN(value)) return { error: `Bad number: ${num}` };
      tokens.push({ kind: "num", value });
    } else if (/[a-zA-Z_]/.test(ch)) {
      let name = "";
      while (i < s.length && /[a-zA-Z_0-9]/.test(s[i])) name += s[i++];
      tokens.push({ kind: "name", value: name });
    } else if ("+-*/^%".includes(ch)) {
      tokens.push({ kind: "op", value: ch });
      i++;
    } else if (ch === "(") { tokens.push({ kind: "lparen" }); i++; }
    else if (ch === ")") { tokens.push({ kind: "rparen" }); i++; }
    else if (ch === ",") { tokens.push({ kind: "comma" }); i++; }
    else return { error: `Unexpected character: ${ch}` };
  }
  return tokens;
}

/** Insert implicit multiplication: 2x → 2*x, 3(..) → 3*(..), )( → )*( , x sin(x) handled via names. */
function withImplicitMul(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = out[out.length - 1];
    const isValueEnd = prev && (prev.kind === "num" || prev.kind === "rparen" || (prev.kind === "name" && !(prev.value in FUNCTIONS)));
    const isValueStart = t.kind === "num" || t.kind === "lparen" || t.kind === "name";
    if (isValueEnd && isValueStart) out.push({ kind: "op", value: "*" });
    out.push(t);
  }
  return out;
}

/** Compile to RPN via shunting-yard. */
export function compile(input: string): { rpn: (Token | { kind: "call"; name: string; argc: number })[] } | { error: string } {
  const t = tokenize(input);
  if ("error" in t) return t;
  const tokens = withImplicitMul(t);

  const output: (Token | { kind: "call"; name: string; argc: number })[] = [];
  const stack: (Token | { kind: "func"; name: string; argc: number })[] = [];
  let prevMeaning: "value" | "op" | "open" | null = null;

  for (const tok of tokens) {
    if (tok.kind === "num") {
      output.push(tok);
      prevMeaning = "value";
    } else if (tok.kind === "name") {
      if (tok.value in FUNCTIONS) {
        stack.push({ kind: "func", name: tok.value, argc: 1 });
        prevMeaning = "op";
      } else {
        output.push(tok); // variable/constant, resolved at eval
        prevMeaning = "value";
      }
    } else if (tok.kind === "op") {
      let op = tok.value;
      if (op === "-" && (prevMeaning === null || prevMeaning === "op" || prevMeaning === "open")) op = "u-";
      if (op === "+" && (prevMeaning === null || prevMeaning === "op" || prevMeaning === "open")) { prevMeaning = "op"; continue; } // unary plus: no-op
      const o1 = OPS[op];
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.kind === "op" && ((OPS[top.value].prec > o1.prec) || (OPS[top.value].prec === o1.prec && !o1.right))) {
          output.push(stack.pop() as Token);
        } else break;
      }
      stack.push({ kind: "op", value: op });
      prevMeaning = "op";
    } else if (tok.kind === "lparen") {
      stack.push(tok);
      prevMeaning = "open";
    } else if (tok.kind === "comma") {
      while (stack.length && stack[stack.length - 1].kind !== "lparen") output.push(stack.pop() as Token);
      if (!stack.length) return { error: "Misplaced comma" };
      // bump the arg count of the pending function
      const fn = stack[stack.length - 2];
      if (fn && fn.kind === "func") fn.argc++;
      prevMeaning = "op";
    } else if (tok.kind === "rparen") {
      while (stack.length && stack[stack.length - 1].kind !== "lparen") output.push(stack.pop() as Token);
      if (!stack.length) return { error: "Mismatched parentheses" };
      stack.pop(); // lparen
      const top = stack[stack.length - 1];
      if (top && top.kind === "func") {
        const f = stack.pop() as { kind: "func"; name: string; argc: number };
        output.push({ kind: "call", name: f.name, argc: f.argc });
      }
      prevMeaning = "value";
    }
  }
  while (stack.length) {
    const top = stack.pop()!;
    if (top.kind === "lparen") return { error: "Mismatched parentheses" };
    if (top.kind === "func") return { error: `Function ${top.name} missing parentheses` };
    output.push(top as Token);
  }
  return { rpn: output };
}

/** Evaluate a compiled RPN with a variable environment. */
export function evaluateRpn(
  rpn: (Token | { kind: "call"; name: string; argc: number })[],
  vars: Record<string, number> = {},
): number | { error: string } {
  const st: number[] = [];
  for (const tok of rpn) {
    if (tok.kind === "num") st.push(tok.value);
    else if (tok.kind === "name") {
      const name = tok.value;
      const v = vars[name] ?? CONSTANTS[name];
      if (v === undefined) return { error: `Unknown variable: ${name}` };
      st.push(v);
    } else if (tok.kind === "call") {
      const fn = FUNCTIONS[tok.name];
      const need = FUNCTION_ARITY[tok.name] ?? 1;
      if (tok.argc !== need) return { error: `${tok.name} expects ${need} argument${need > 1 ? "s" : ""}` };
      if (st.length < need) return { error: `Not enough arguments for ${tok.name}` };
      const args = st.splice(st.length - need, need);
      st.push(fn(...args));
    } else if (tok.kind === "op") {
      if (tok.value === "u-") {
        if (st.length < 1) return { error: "Missing operand" };
        st.push(-st.pop()!);
        continue;
      }
      if (st.length < 2) return { error: "Missing operand" };
      const b = st.pop()!, a = st.pop()!;
      switch (tok.value) {
        case "+": st.push(a + b); break;
        case "-": st.push(a - b); break;
        case "*": st.push(a * b); break;
        case "/": st.push(a / b); break;
        case "%": st.push(a % b); break;
        case "^": st.push(Math.pow(a, b)); break;
        default: return { error: `Unknown operator ${tok.value}` };
      }
    }
  }
  if (st.length !== 1) return { error: "Malformed expression" };
  return st[0];
}

/** One-shot convenience: evaluate an expression string. */
export function evaluate(input: string, vars: Record<string, number> = {}): number | { error: string } {
  if (!input.trim()) return { error: "Empty expression" };
  const compiled = compile(input);
  if ("error" in compiled) return compiled;
  return evaluateRpn(compiled.rpn, vars);
}

/** Compile once, then sample y = f(x) across a domain (for the plotter). */
export function sampleFunction(
  expr: string,
  xMin: number,
  xMax: number,
  samples = 240,
): { points: ({ x: number; y: number } | null)[]; error?: string } {
  const compiled = compile(expr);
  if ("error" in compiled) return { points: [], error: compiled.error };
  const points: ({ x: number; y: number } | null)[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / samples;
    const y = evaluateRpn(compiled.rpn, { x });
    if (typeof y === "number" && Number.isFinite(y)) points.push({ x, y });
    else points.push(null); // gap (asymptote / domain error)
  }
  // Structurally valid but never evaluable (e.g. "x^^2", or sqrt(x) on a
  // negative domain) — surface a real error instead of an empty plot.
  if (points.every((p) => p === null)) {
    const probe = evaluateRpn(compiled.rpn, { x: (xMin + xMax) / 2 });
    const error = typeof probe === "object" ? probe.error : "Expression is undefined across this domain";
    return { points, error };
  }
  return { points };
}
