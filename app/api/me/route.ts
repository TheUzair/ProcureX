import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const API_BASE = process.env.BACKEND_URL || "http://localhost:8000";

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const user = await res.json();
  return NextResponse.json(user);
}
