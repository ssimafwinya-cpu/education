import { NextResponse } from "next/server";
import { pickProvider } from "@/lib/ai/providers";
import { getStore } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness + readiness probe used by Docker/K8s/uptime health checks. */
export async function GET() {
  const provider = pickProvider();
  const store = getStore();

  // Readiness: with a database, confirm it answers a trivial query.
  let db: "ok" | "error" | "file-store" = "file-store";
  if (store.driver === "prisma") {
    try {
      await store.getUserByEmail("__healthcheck__@unzanasa.local");
      db = "ok";
    } catch {
      db = "error";
    }
  }

  const healthy = db !== "error";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "unzanasa-hub",
      version: process.env.npm_package_version ?? "1.0.0",
      store: store.driver,
      db,
      aiProvider: provider?.name ?? "offline",
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
