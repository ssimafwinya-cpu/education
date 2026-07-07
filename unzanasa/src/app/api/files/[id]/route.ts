import { NextRequest, NextResponse } from "next/server";
import { readPdf } from "@/server/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: stream a stored past-paper PDF. Ids are server-generated and
// strictly validated, so no user input ever forms a filesystem path.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buf = await readPdf(id);
  if (!buf) return NextResponse.json({ error: "File not found." }, { status: 404 });
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": String(buf.length),
      "content-disposition": `inline; filename="${id}.pdf"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
