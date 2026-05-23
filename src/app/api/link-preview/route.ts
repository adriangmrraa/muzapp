import { NextRequest, NextResponse } from "next/server";

interface OgData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

/**
 * Fetch OG metadata from a URL for link previews.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
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
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
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
