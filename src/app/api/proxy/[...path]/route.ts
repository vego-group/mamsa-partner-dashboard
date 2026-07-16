import { NextRequest } from "next/server";

// This proxy is dev-only (client.ts only routes through it when
// NODE_ENV === "development"); production traffic never hits this file.
// Read the env var lazily, inside the request handler — NOT at module scope.
// A module-scope throw runs during `next build`'s page-data collection for
// EVERY route regardless of whether it's ever called, so a missing env var
// here used to fail the entire production build instead of just this route.
function requireBaseApi(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL must be set for the API proxy.");
  return base;
}

function buildTargetUrl(baseApi: string, path: string[], search: string) {
  const routePath = path.length > 0 ? `/${path.join("/")}` : "";
  return `${baseApi}${routePath}${search}`;
}

function buildForwardHeaders(req: NextRequest, baseApi: string) {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("accept-encoding");
  // Mutations are gated by an Origin/Referer allowlist on *.mamsaa.com
  // (DEVIATIONS §1). localhost isn't allowlisted, so present the upstream's
  // own origin instead of the browser's.
  const upstreamOrigin = new URL(baseApi).origin;
  headers.set("origin", upstreamOrigin);
  headers.set("referer", `${upstreamOrigin}/`);
  return headers;
}

async function proxy(req: NextRequest, path: string[]) {
  const baseApi = requireBaseApi();
  const url = buildTargetUrl(baseApi, path, req.nextUrl.search);
  const headers = buildForwardHeaders(req, baseApi);

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();
  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  };

  const res = await fetch(url, fetchOptions);

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  // Multiple Set-Cookie headers must be re-appended individually — `.get()`
  // joins them with commas (which also appear inside Expires=) and corrupts them.
  // Strip Domain (staging's domain would be rejected on localhost) and Secure
  // (dev runs on http) so the browser actually stores the session cookie.
  const cookies = res.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    responseHeaders.delete("set-cookie");
    for (const cookie of cookies) {
      responseHeaders.append(
        "set-cookie",
        cookie
          .replace(/;\s*Domain=[^;]+/gi, "")
          .replace(/;\s*Secure/gi, "")
          // SameSite=None requires Secure — browsers reject it on http://localhost.
          // Through the proxy everything is same-origin, so Lax is correct.
          .replace(/;\s*SameSite=None/gi, "; SameSite=Lax"),
      );
    }
  }

  const responseBody = await res.arrayBuffer();
  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function OPTIONS(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
