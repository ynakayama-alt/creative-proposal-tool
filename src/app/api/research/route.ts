import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { analyzeCompany } from "@/lib/research";

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
    const result = await analyzeCompany(
      project.companyName,
      project.productName,
      project.url || undefined
    );

    const researchResult = await prisma.researchResult.upsert({
      where: { projectId },
      create: {
        projectId,
        challenges: JSON.stringify(result.challenges),
        rawContent: result.rawContent,
      },
      update: {
        challenges: JSON.stringify(result.challenges),
        rawContent: result.rawContent,
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "generate" },
    });

    return NextResponse.json({ research: researchResult });
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json({ error: "課題調査に失敗しました" }, { status: 500 });
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

  const research = await prisma.researchResult.findUnique({
    where: { projectId },
  });

  return NextResponse.json({ research });
}
