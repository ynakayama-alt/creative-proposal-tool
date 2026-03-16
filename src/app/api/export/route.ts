import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildPresentation } from "@/lib/pptx-builder";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { projectId } = await request.json();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.userId },
    include: {
      researchResult: true,
      generatedImages: { where: { selected: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }

  // Check for user's PPTX template
  const template = await prisma.templateFile.findFirst({
    where: { userId: session.userId, type: "pptx_format" },
    orderBy: { createdAt: "desc" },
  });

  try {
    const challenges = project.researchResult
      ? JSON.parse(project.researchResult.challenges)
      : [];

    const pptxBuffer = await buildPresentation({
      companyName: project.companyName,
      productName: project.productName,
      challenges,
      selectedImages: project.generatedImages.map((img) => img.localPath),
      templatePath: template?.filePath,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "done" },
    });

    return new NextResponse(new Uint8Array(pptxBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(project.companyName)}_企画書.pptx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "資料生成に失敗しました" }, { status: 500 });
  }
}
