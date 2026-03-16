import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || "";

export async function collectFromSearch(query: string): Promise<string[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    throw new Error(
      "Google Custom Search API credentials are not configured. Set GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables."
    );
  }

  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    cx: GOOGLE_CSE_ID,
    q: query,
    searchType: "image",
    num: "10",
    imgSize: "large",
    safe: "active",
  });

  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Custom Search API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    items?: Array<{ link: string; image?: { width?: number; height?: number } }>;
  };

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item) => item.link);
}

export async function collectFromUrl(url: string): Promise<string[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CreativeBot/1.0; +https://example.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;

  const imageUrls = new Set<string>();

  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html)) !== null) {
    imageUrls.add(match[1]);
  }

  while ((match = srcsetRegex.exec(html)) !== null) {
    const srcsetEntries = match[1].split(",").map((s) => s.trim().split(/\s+/)[0]);
    srcsetEntries.forEach((src) => imageUrls.add(src));
  }

  while ((match = ogImageRegex.exec(html)) !== null) {
    imageUrls.add(match[1]);
  }

  const resolvedUrls = Array.from(imageUrls)
    .map((src) => {
      try {
        return new URL(src, url).href;
      } catch {
        return null;
      }
    })
    .filter((u): u is string => u !== null);

  const filteredUrls = resolvedUrls.filter((imgUrl) => {
    const lowerUrl = imgUrl.toLowerCase();
    const isIcon =
      lowerUrl.includes("favicon") ||
      lowerUrl.includes("icon") ||
      lowerUrl.includes("logo") ||
      lowerUrl.includes("sprite") ||
      lowerUrl.includes("1x1") ||
      lowerUrl.includes("pixel") ||
      lowerUrl.includes("tracking") ||
      lowerUrl.includes("spacer");

    const isTinyFile =
      lowerUrl.endsWith(".gif") && lowerUrl.includes("1x1");

    const isSvgIcon = lowerUrl.endsWith(".svg") && lowerUrl.includes("icon");

    return !isIcon && !isTinyFile && !isSvgIcon;
  });

  return [...new Set(filteredUrls)];
}

export async function downloadImage(
  url: string,
  savePath: string
): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CreativeBot/1.0; +https://example.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} from ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await mkdir(dirname(savePath), { recursive: true });
  await writeFile(savePath, buffer);

  return savePath;
}
