import { NextRequest, NextResponse } from "next/server";
import { sessionUser, publicUser } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // A session probe is a query, not an auth challenge: 200 with user:null
  // keeps guest-mode consoles clean (fetch logs 4xx as errors in browsers).
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: publicUser(user) });
}
