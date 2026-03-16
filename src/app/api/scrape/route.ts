import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { collectFromSearch, collectFromUrl, downloadImage } from "@/lib/image-collector";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { projectId } = await request.json();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.userId },
  });

  if (!project) {
    return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }

  try {
    const imageUrls: { url: string; source: string }[] = [];

    // Collect from Google Image Search
    const query = `${project.companyName} ${project.productName} 広告 クリエイティブ`;
    const searchResults = await collectFromSearch(query);
    searchResults.forEach((url) => imageUrls.push({ url, source: "search" }));

    // Collect from URL if provided
    if (project.url) {
      const scrapeResults = await collectFromUrl(project.url);
      scrapeResults.forEach((url) => imageUrls.push({ url, source: "scrape" }));
    }

    // Deduplicate by URL
    const unique = Array.from(new Map(imageUrls.map((i) => [i.url, i])).values());
    const limited = unique.slice(0, 100);

    // Save images to disk and database
    const uploadDir = path.join(process.cwd(), "public", "uploads", "collected", projectId);
    await fs.mkdir(uploadDir, { recursive: true });

    const saved = [];
    for (let i = 0; i < limited.length; i++) {
      const item = limited[i];
      try {
        const ext = path.extname(new URL(item.url).pathname) || ".jpg";
        const filename = `img_${i}${ext}`;
        const localPath = `/uploads/collected/${projectId}/${filename}`;
        const fullPath = path.join(uploadDir, filename);

        await downloadImage(item.url, fullPath);

        const record = await prisma.collectedImage.create({
          data: {
            projectId,
            url: item.url,
            localPath,
            source: item.source,
          },
        });
        saved.push(record);
      } catch {
        // Skip failed downloads
      }
    }

    return NextResponse.json({ images: saved, total: saved.length });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: "画像収集に失敗しました" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const images = await prisma.collectedImage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ images });
}
