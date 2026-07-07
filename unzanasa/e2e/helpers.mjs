// Shared helpers for the e2e suites: a tiny assertion harness, a cookie-aware
// fetch client, and account helpers (register, promote-to-admin via set-role).

import { spawnSync } from "node:child_process";

export function harness() {
  let pass = 0, fail = 0;
  return {
    check(name, cond) {
      if (cond) { pass++; console.log(`   PASS ${name}`); }
      else { fail++; console.log(`   FAIL ${name}`); }
    },
    result() { return { ok: fail === 0, pass, fail }; },
  };
}

/** A fetch client that keeps session cookies across calls. */
export function client(base) {
  const jar = {};
  const cookieHeader = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
  return {
    async call(path, { method = "GET", json, form } = {}) {
      const headers = { cookie: cookieHeader() };
      let body;
      if (json !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(json); }
      if (form !== undefined) body = form; // FormData sets its own content-type
      const res = await fetch(base + path, { method, headers, body });
      for (const c of res.headers.getSetCookie?.() ?? []) {
        const [kv] = c.split(";");
        const [k, v] = kv.split("=");
        jar[k] = v;
      }
      let parsed = {};
      const type = res.headers.get("content-type") ?? "";
      if (type.includes("json")) { try { parsed = await res.json(); } catch { /* empty */ } }
      return { status: res.status, body: parsed, res };
    },
  };
}

/** Register a fresh account; returns its email (session cookie lands in the client). */
export async function register(c, prefix = "user") {
  const email = `${prefix}${Date.now()}${Math.floor(Math.random() * 1e4)}@unza.zm`;
  const r = await c.call("/api/auth/register", { method: "POST", json: { email, password: "e2e-password-1", name: prefix } });
  if (r.status !== 201) throw new Error(`register failed: ${r.status}`);
  return email;
}

/** Promote an account with scripts/set-role.mjs against the runner's data dir. */
export function promote(email, dataDir, role = "ADMIN") {
  const out = spawnSync("node", ["scripts/set-role.mjs", email, role], {
    env: { ...process.env, COGNIFY_DATA_DIR: dataDir, DATABASE_URL: "" },
    encoding: "utf8",
  });
  if (out.status !== 0) throw new Error(`set-role failed: ${out.stderr || out.stdout}`);
}
