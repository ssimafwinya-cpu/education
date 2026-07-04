import { NextResponse } from "next/server";
import { pickProvider } from "@/lib/ai/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness + readiness probe used by Docker/K8s health checks. */
export function GET() {
  const provider = pickProvider();
  return NextResponse.json({
    status: "ok",
    service: "cognify",
    version: process.env.npm_package_version ?? "1.0.0",
    aiProvider: provider?.name ?? "offline",
    timestamp: new Date().toISOString(),
  });
}
