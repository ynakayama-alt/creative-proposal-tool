import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const formData = await request.formData();
  const projectId = formData.get("projectId") as string;
  const type = formData.get("type") as string; // "product", "creative_quality", "pptx_format"
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  const results = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let subDir: string;
    if (type === "product") {
      subDir = `uploads/product/${projectId}`;
    } else if (type === "creative_quality" || type === "pptx_format") {
      subDir = `uploads/templates/${session.userId}`;
    } else {
      subDir = `uploads/misc/${projectId}`;
    }

    const uploadDir = path.join(process.cwd(), "public", subDir);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const publicPath = `/${subDir}/${filename}`;

    if (type === "product" && projectId) {
      const record = await prisma.productImage.create({
        data: { projectId, localPath: publicPath },
      });
      results.push(record);
    } else if (type === "creative_quality" || type === "pptx_format") {
      const record = await prisma.templateFile.create({
        data: {
          userId: session.userId,
          type,
          name: file.name,
          filePath: publicPath,
        },
      });
      results.push(record);
    } else {
      results.push({ path: publicPath });
    }
  }

  return NextResponse.json({ files: results });
}
