import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/session";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

async function doFetch(
  target: string,
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
) {
  return fetch(target, { method, headers, body });
}

async function proxyRequest(req: NextRequest) {
  const session = await getSession();
  const url = new URL(req.url);

  // Extract the path after /api/proxy/ → forward as /api/...
  const proxyPath = url.pathname.replace("/api/proxy", "/api");
  const target = `${BACKEND_URL}${proxyPath}${url.search}`;

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await req.text()
    : undefined;

  let backendRes = await doFetch(target, req.method, headers, body);

  // If 401 and we have a refresh token, try refreshing
  if (backendRes.status === 401 && session?.refreshToken) {
    const refreshRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      // Update session with new tokens
      await createSession({
        userId: session.userId,
        email: session.email,
        username: session.username,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      // Retry original request with new access token
      headers["Authorization"] = `Bearer ${tokens.access_token}`;
      backendRes = await doFetch(target, req.method, headers, body);
    }
  }

  const contentType = backendRes.headers.get("content-type") || "";

  // For binary responses (PDF etc.), stream through
  if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": backendRes.headers.get("content-disposition") || "",
      },
    });
  }

  const data = await backendRes.text();
  return new NextResponse(data, {
    status: backendRes.status,
    headers: { "Content-Type": contentType },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
