import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getImageGenerator } from "@/lib/image-generator";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { projectId, referenceImageIds } = await request.json();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.userId },
    include: {
      productImages: true,
      collectedImages: {
        where: referenceImageIds?.length
          ? { id: { in: referenceImageIds } }
          : undefined,
      },
      researchResult: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }

  try {
    const generator = getImageGenerator();
    const outputDir = path.join(process.cwd(), "public", "uploads", "generated", projectId);
    await fs.mkdir(outputDir, { recursive: true });

    const referenceUrls = project.collectedImages
      .map((img) => img.localPath || img.url)
      .slice(0, 5);

    const challenges = project.researchResult
      ? JSON.parse(project.researchResult.challenges)
      : [];

    // Generate product images (with product)
    const productResults = await generator.generate({
      prompt: `${project.companyName}の${project.productName}の広告クリエイティブ。商品の着用・使用イメージ。${challenges[0] || ""}をテーマにした訴求。`,
      referenceImageUrls: referenceUrls,
      productImagePath: project.productImages[0]?.localPath,
      style: "professional advertising creative",
      count: 10,
    });

    // Generate non-product images (without product)
    const nonProductResults = await generator.generate({
      prompt: `${project.companyName}の${project.productName}のブランドイメージ広告。商品を直接使わないライフスタイル・世界観を表現するクリエイティブ。${challenges[0] || ""}をテーマにした訴求。`,
      referenceImageUrls: referenceUrls,
      style: "professional brand advertising creative",
      count: 10,
    });

    // Save to database
    const allResults = [];

    for (const result of productResults) {
      const record = await prisma.generatedImage.create({
        data: {
          projectId,
          type: "product",
          promptUsed: result.prompt,
          localPath: result.localPath,
        },
      });
      allResults.push(record);
    }

    for (const result of nonProductResults) {
      const record = await prisma.generatedImage.create({
        data: {
          projectId,
          type: "non-product",
          promptUsed: result.prompt,
          localPath: result.localPath,
        },
      });
      allResults.push(record);
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "select" },
    });

    return NextResponse.json({ images: allResults });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "画像生成に失敗しました" }, { status: 500 });
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

  const images = await prisma.generatedImage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ images });
}

export async function PUT(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { projectId, selectedImageIds } = await request.json();

  // Unselect all, then select chosen ones
  await prisma.generatedImage.updateMany({
    where: { projectId },
    data: { selected: false },
  });

  await prisma.generatedImage.updateMany({
    where: { id: { in: selectedImageIds }, projectId },
    data: { selected: true },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "export" },
  });

  return NextResponse.json({ success: true });
}
