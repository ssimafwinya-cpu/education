// Global site content: admins write it, everyone reads the same copy, and
// non-admins cannot write.

import { harness, client, register, promote } from "./helpers.mjs";

export async function run({ base, dataDir }) {
  const h = harness();
  const marker = `E2E-CONTENT-${Date.now()}`;

  // Fresh install: GET serves the defaults at version 0.
  const first = await fetch(base + "/api/content").then((r) => r.json());
  h.check("defaults served before any admin save", first.version === 0 && Array.isArray(first.content.programmes));

  // Writes are gated.
  const guest = client(base);
  const gw = await guest.call("/api/content", { method: "PUT", json: { content: {} } });
  h.check("guest PUT rejected (401)", gw.status === 401);
  const student = client(base);
  await register(student, "stud");
  const sw = await student.call("/api/content", { method: "PUT", json: { content: {} } });
  h.check("student PUT rejected (403)", sw.status === 403);

  // An admin edit becomes visible to everyone.
  const admin = client(base);
  const adminEmail = await register(admin, "adm");
  promote(adminEmail, dataDir);
  const content = first.content;
  content.announcements = [{ id: "e2e_ann", title: marker, body: "posted by the e2e suite", date: "2026-01-01", pinned: true }, ...content.announcements];
  const put = await admin.call("/api/content", { method: "PUT", json: { content } });
  h.check("admin PUT accepted with a new version", put.status === 200 && put.body.version >= 1);

  const second = await fetch(base + "/api/content").then((r) => r.json());
  h.check("everyone now reads the admin's edit", JSON.stringify(second.content.announcements).includes(marker));
  h.check("missing sections are merged from defaults", Array.isArray(second.content.committee) && second.content.committee.length > 0);

  return h.result();
}
