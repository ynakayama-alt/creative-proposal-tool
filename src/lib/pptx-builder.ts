import PptxGenJS from "pptxgenjs";
import { readFile } from "fs/promises";
import { extname } from "path";

interface PresentationData {
  companyName: string;
  productName: string;
  challenges: string[];
  selectedImages: string[];
  templatePath?: string;
}

const COLORS = {
  primary: "1A1A2E",
  secondary: "16213E",
  accent: "0F3460",
  highlight: "E94560",
  white: "FFFFFF",
  lightGray: "F5F5F5",
  darkGray: "333333",
  mediumGray: "666666",
};

export async function buildPresentation(
  data: PresentationData
): Promise<Buffer> {
  const { companyName, productName, challenges, selectedImages } = data;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Creative Platform";
  pptx.subject = `${companyName} - ${productName} Marketing Creative`;
  pptx.title = `${productName} Creative Proposal`;

  buildTitleSlide(pptx, companyName, productName);
  buildCompanyOverviewSlide(pptx, companyName, productName);
  buildChallengesSlide(pptx, challenges);

  if (selectedImages.length > 0) {
    await buildImageShowcaseSlides(pptx, selectedImages, productName);
  }

  buildSummarySlide(pptx, companyName, productName, challenges.length, selectedImages.length);

  const output = await pptx.write({ outputType: "nodebuffer" });
  return output as Buffer;
}

function buildTitleSlide(
  pptx: PptxGenJS,
  companyName: string,
  productName: string
): void {
  const slide = pptx.addSlide();

  slide.background = { color: COLORS.primary };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 4.5,
    w: "100%",
    h: 0.05,
    fill: { color: COLORS.highlight },
  });

  slide.addText(productName, {
    x: 0.8,
    y: 1.5,
    w: 11,
    h: 1.5,
    fontSize: 44,
    fontFace: "Arial",
    color: COLORS.white,
    bold: true,
    align: "left",
  });

  slide.addText("Marketing Creative Proposal", {
    x: 0.8,
    y: 3.0,
    w: 11,
    h: 0.8,
    fontSize: 24,
    fontFace: "Arial",
    color: COLORS.highlight,
    align: "left",
  });

  slide.addText(`Prepared for ${companyName}`, {
    x: 0.8,
    y: 5.0,
    w: 11,
    h: 0.6,
    fontSize: 16,
    fontFace: "Arial",
    color: COLORS.mediumGray,
    align: "left",
  });

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  slide.addText(today, {
    x: 0.8,
    y: 5.6,
    w: 11,
    h: 0.5,
    fontSize: 14,
    fontFace: "Arial",
    color: COLORS.mediumGray,
    align: "left",
  });
}

function buildCompanyOverviewSlide(
  pptx: PptxGenJS,
  companyName: string,
  productName: string
): void {
  const slide = pptx.addSlide();

  slide.background = { color: COLORS.white };

  addSlideHeader(slide, pptx, "Company Overview");

  slide.addText(companyName, {
    x: 0.8,
    y: 1.5,
    w: 11,
    h: 0.8,
    fontSize: 28,
    fontFace: "Arial",
    color: COLORS.primary,
    bold: true,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 2.4,
    w: 2.0,
    h: 0.04,
    fill: { color: COLORS.highlight },
  });

  slide.addText(`Product/Service: ${productName}`, {
    x: 0.8,
    y: 2.8,
    w: 11,
    h: 0.6,
    fontSize: 18,
    fontFace: "Arial",
    color: COLORS.darkGray,
  });

  slide.addText(
    "This proposal outlines a creative strategy to address key marketing challenges and presents visual concepts designed to elevate brand presence and drive engagement.",
    {
      x: 0.8,
      y: 3.6,
      w: 11,
      h: 1.5,
      fontSize: 14,
      fontFace: "Arial",
      color: COLORS.mediumGray,
      lineSpacingMultiple: 1.5,
    }
  );
}

function buildChallengesSlide(
  pptx: PptxGenJS,
  challenges: string[]
): void {
  const slide = pptx.addSlide();

  slide.background = { color: COLORS.white };

  addSlideHeader(slide, pptx, "Marketing Challenges");

  const displayChallenges = challenges.slice(0, 6);

  displayChallenges.forEach((challenge, index) => {
    const yPos = 1.6 + index * 0.75;

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: yPos,
      w: 0.35,
      h: 0.35,
      fill: { color: COLORS.highlight },
      rectRadius: 0.05,
    });

    slide.addText(`${index + 1}`, {
      x: 0.8,
      y: yPos,
      w: 0.35,
      h: 0.35,
      fontSize: 14,
      fontFace: "Arial",
      color: COLORS.white,
      bold: true,
      align: "center",
      valign: "middle",
    });

    slide.addText(challenge, {
      x: 1.4,
      y: yPos,
      w: 10.5,
      h: 0.5,
      fontSize: 15,
      fontFace: "Arial",
      color: COLORS.darkGray,
      valign: "middle",
    });
  });
}

async function buildImageShowcaseSlides(
  pptx: PptxGenJS,
  selectedImages: string[],
  productName: string
): Promise<void> {
  const imagesPerSlide = 4;
  const totalSlides = Math.ceil(selectedImages.length / imagesPerSlide);

  for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.lightGray };

    const slideNum = totalSlides > 1 ? ` (${slideIndex + 1}/${totalSlides})` : "";
    addSlideHeader(slide, pptx, `Creative Concepts${slideNum}`);

    const startIdx = slideIndex * imagesPerSlide;
    const endIdx = Math.min(startIdx + imagesPerSlide, selectedImages.length);
    const slideImages = selectedImages.slice(startIdx, endIdx);

    const positions = getImagePositions(slideImages.length);

    for (let i = 0; i < slideImages.length; i++) {
      const imgPath = slideImages[i];
      const pos = positions[i];

      try {
        let imageData: string;

        if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
          imageData = imgPath;
        } else {
          const fullPath = imgPath.startsWith("/")
            ? `${process.cwd()}/public${imgPath}`
            : imgPath;
          const imgBuffer = await readFile(fullPath);
          const ext = extname(fullPath).toLowerCase().replace(".", "");
          const mimeType = ext === "png" ? "png" : "jpeg";
          imageData = `data:image/${mimeType};base64,${imgBuffer.toString("base64")}`;
        }

        slide.addImage({
          data: imageData.startsWith("data:") ? imageData : undefined,
          path: imageData.startsWith("http") ? imageData : undefined,
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          rounding: true,
          shadow: {
            type: "outer",
            blur: 6,
            offset: 3,
            color: "000000",
            opacity: 0.2,
          },
        } as Record<string, unknown>);
      } catch {
        slide.addShape(pptx.ShapeType.rect, {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          fill: { color: COLORS.mediumGray },
          rectRadius: 0.1,
        });

        slide.addText("Image\nUnavailable", {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          fontSize: 12,
          fontFace: "Arial",
          color: COLORS.white,
          align: "center",
          valign: "middle",
        });
      }
    }

    slide.addText(`${productName} - Creative Concepts`, {
      x: 0.8,
      y: 6.7,
      w: 11,
      h: 0.4,
      fontSize: 10,
      fontFace: "Arial",
      color: COLORS.mediumGray,
      align: "center",
    });
  }
}

function getImagePositions(
  count: number
): Array<{ x: number; y: number; w: number; h: number }> {
  switch (count) {
    case 1:
      return [{ x: 3.0, y: 1.6, w: 6.5, h: 4.8 }];
    case 2:
      return [
        { x: 0.8, y: 1.6, w: 5.4, h: 4.8 },
        { x: 6.6, y: 1.6, w: 5.4, h: 4.8 },
      ];
    case 3:
      return [
        { x: 0.8, y: 1.6, w: 5.4, h: 4.8 },
        { x: 6.6, y: 1.6, w: 5.4, h: 2.2 },
        { x: 6.6, y: 4.1, w: 5.4, h: 2.2 },
      ];
    case 4:
    default:
      return [
        { x: 0.8, y: 1.6, w: 5.4, h: 2.3 },
        { x: 6.6, y: 1.6, w: 5.4, h: 2.3 },
        { x: 0.8, y: 4.2, w: 5.4, h: 2.3 },
        { x: 6.6, y: 4.2, w: 5.4, h: 2.3 },
      ];
  }
}

function buildSummarySlide(
  pptx: PptxGenJS,
  companyName: string,
  productName: string,
  challengeCount: number,
  imageCount: number
): void {
  const slide = pptx.addSlide();

  slide.background = { color: COLORS.primary };

  slide.addText("Summary & Next Steps", {
    x: 0.8,
    y: 0.8,
    w: 11,
    h: 0.8,
    fontSize: 32,
    fontFace: "Arial",
    color: COLORS.white,
    bold: true,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.7,
    w: 2.0,
    h: 0.04,
    fill: { color: COLORS.highlight },
  });

  const summaryItems = [
    `${challengeCount} key marketing challenges identified for ${companyName}`,
    `${imageCount} creative concepts generated for ${productName}`,
    "Ready for review and refinement based on feedback",
    "Next: Finalize selected creatives and prepare for campaign launch",
  ];

  summaryItems.forEach((item, index) => {
    slide.addText(`\u2022  ${item}`, {
      x: 0.8,
      y: 2.2 + index * 0.7,
      w: 11,
      h: 0.6,
      fontSize: 16,
      fontFace: "Arial",
      color: COLORS.white,
      lineSpacingMultiple: 1.3,
    });
  });

  slide.addText("Thank You", {
    x: 0.8,
    y: 5.5,
    w: 11,
    h: 0.8,
    fontSize: 28,
    fontFace: "Arial",
    color: COLORS.highlight,
    bold: true,
    align: "center",
  });

  slide.addText("Ready to bring these concepts to life", {
    x: 0.8,
    y: 6.2,
    w: 11,
    h: 0.5,
    fontSize: 14,
    fontFace: "Arial",
    color: COLORS.mediumGray,
    align: "center",
  });
}

function addSlideHeader(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  title: string
): void {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 1.2,
    fill: { color: COLORS.primary },
  });

  slide.addText(title, {
    x: 0.8,
    y: 0.2,
    w: 11,
    h: 0.8,
    fontSize: 24,
    fontFace: "Arial",
    color: COLORS.white,
    bold: true,
    valign: "middle",
  });
}
