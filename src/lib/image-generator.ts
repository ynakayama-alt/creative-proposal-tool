import type { ImageGenerator } from "./generators/types";
import { VertexAIGenerator } from "./generators/vertex-ai";

export type { ImageGenerator, GenerateImageOptions, GeneratedImageResult } from "./generators/types";

export function getImageGenerator(provider?: string): ImageGenerator {
  switch (provider) {
    case "vertex-ai":
    default:
      return new VertexAIGenerator();
  }
}
