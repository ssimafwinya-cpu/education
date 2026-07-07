// PDF uploads: only admins may upload, only real PDFs are accepted, and the
// stored file streams back publicly with the right content type.

import { harness, client, register, promote } from "./helpers.mjs";

export async function run({ base, dataDir }) {
  const h = harness();
  const pdf = new Blob([`%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<<>>\n%%EOF`], { type: "application/pdf" });
  const formWith = (blob, name = "paper.pdf") => { const f = new FormData(); f.append("file", blob, name); return f; };

  const guest = client(base);
  const g = await guest.call("/api/files", { method: "POST", form: formWith(pdf) });
  h.check("guest upload rejected (401)", g.status === 401);

  const student = client(base);
  await register(student, "stud");
  const s = await student.call("/api/files", { method: "POST", form: formWith(pdf) });
  h.check("student upload rejected (403)", s.status === 403);

  const admin = client(base);
  const adminEmail = await register(admin, "adm");
  promote(adminEmail, dataDir);
  const up = await admin.call("/api/files", { method: "POST", form: formWith(pdf) });
  h.check("admin upload accepted (201 + url)", up.status === 201 && typeof up.body.url === "string");

  const fake = await admin.call("/api/files", { method: "POST", form: formWith(new Blob(["MZ not a pdf"], { type: "application/pdf" })) });
  h.check("non-PDF payload rejected (422)", fake.status === 422);

  const got = await fetch(base + up.body.url);
  const bytes = new Uint8Array(await got.arrayBuffer());
  h.check("public GET streams the PDF", got.status === 200 && got.headers.get("content-type") === "application/pdf");
  h.check("streamed bytes start with %PDF", new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-");

  const traversal = await fetch(base + "/api/files/..%2F..%2Fetc%2Fpasswd");
  h.check("traversal id is 404", traversal.status === 404);

  return h.result();
}
