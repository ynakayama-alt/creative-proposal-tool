import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { companyName, productName, url } = await request.json();

  if (!companyName || !productName) {
    return NextResponse.json(
      { error: "企業名と商品名は必須です" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      userId: session.userId,
      companyName,
      productName,
      url: url || null,
      status: "research",
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
