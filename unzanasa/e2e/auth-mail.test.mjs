// Register → verify email (outbox link) → forgot → reset → old password dead,
// new one works. Mirrors the flows a real member goes through.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { harness, client, register } from "./helpers.mjs";

export async function run({ base, dataDir }) {
  const h = harness();
  const c = client(base);
  const outbox = path.join(dataDir, "outbox");

  const latestMail = async (subjectPart) => {
    const files = (await readdir(outbox).catch(() => [])).sort().reverse();
    for (const f of files) {
      const mail = JSON.parse(await readFile(path.join(outbox, f), "utf8"));
      if (mail.subject.includes(subjectPart)) return mail;
    }
    return null;
  };
  const linkFrom = (mail) => mail?.text.match(/https?:\/\/\S+/)?.[0] ?? null;

  const email = await register(c, "member");
  const me1 = await c.call("/api/auth/me");
  h.check("register creates an unverified session", me1.body.user?.emailVerified === false);

  const vLink = linkFrom(await latestMail("Verify"));
  h.check("verification mail lands in the outbox", Boolean(vLink));
  const vUrl = new URL(vLink);
  const verify = await c.call("/api/auth/verify", { method: "POST", json: { email: vUrl.searchParams.get("email"), token: vUrl.searchParams.get("token") } });
  h.check("verify succeeds", verify.status === 200 && verify.body.user?.emailVerified === true);
  const replay = await c.call("/api/auth/verify", { method: "POST", json: { email, token: vUrl.searchParams.get("token") } });
  h.check("verify token is single-use", replay.status === 400);

  await c.call("/api/auth/forgot", { method: "POST", json: { email } });
  const rLink = linkFrom(await latestMail("Reset"));
  h.check("reset mail lands in the outbox", Boolean(rLink));
  const rUrl = new URL(rLink);
  const bad = await c.call("/api/auth/reset", { method: "POST", json: { email, token: "wrong", password: "next-password-2" } });
  h.check("reset rejects a wrong token", bad.status === 400);
  const reset = await c.call("/api/auth/reset", { method: "POST", json: { email: rUrl.searchParams.get("email"), token: rUrl.searchParams.get("token"), password: "next-password-2" } });
  h.check("reset succeeds", reset.status === 200);

  const oldLogin = await c.call("/api/auth/login", { method: "POST", json: { email, password: "e2e-password-1" } });
  h.check("old password is dead", oldLogin.status >= 400);
  const newLogin = await c.call("/api/auth/login", { method: "POST", json: { email, password: "next-password-2" } });
  h.check("new password logs in verified", newLogin.status === 200 && newLogin.body.user?.emailVerified === true);

  return h.result();
}
