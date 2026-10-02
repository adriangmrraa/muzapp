import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dns from "dns/promises";

interface OgData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

const PRIVATE_HOSTNAME = /^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|\[?fe80|\[?fc|\[?fd)/i;

function isPrivateIp(ip: string): boolean {
  return PRIVATE_HOSTNAME.test(ip);
}

async function isSafeTarget(hostname: string): Promise<boolean> {
  if (PRIVATE_HOSTNAME.test(hostname)) return false;
  try {
    const { address } = await dns.lookup(hostname);
    return !isPrivateIp(address);
  } catch {
    return false;
  }
}

/**
 * Fetch OG metadata from a URL for link previews.
 * Requires an authenticated admin session — it is a server-side fetch (SSRF surface).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid url scheme" }, { status: 400 });
  }

  if (!(await isSafeTarget(parsed.hostname))) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(5000),
      redirect: "error",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MuzappBot/1.0; +https://muzapp.com)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ url, title: null, description: null, image: null, siteName: null });
    }

    const html = await response.text();

    const og: OgData = {
      url,
      title: extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || "",
      description: extractMeta(html, "og:description") || extractMeta(html, "twitter:description") || "",
      image: extractMeta(html, "og:image") || extractMeta(html, "twitter:image") || null,
      siteName: extractMeta(html, "og:site_name") || null,
    };

    // Fallback: use <title> if no OG title
    if (!og.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      og.title = titleMatch?.[1]?.trim() ?? null;
    }

    return NextResponse.json(og, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ url, title: null, description: null, image: null, siteName: null });
  }
}

function extractMeta(html: string, property: string): string | null {
  // Try property="..." first (OG standard), then name="..." (Twitter)
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
