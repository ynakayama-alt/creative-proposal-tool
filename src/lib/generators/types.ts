export interface GenerateImageOptions {
  prompt: string;
  referenceImageUrls?: string[];
  productImagePath?: string;
  style?: string;
  count?: number;
}

export interface GeneratedImageResult {
  localPath: string;
  prompt: string;
}

export interface ImageGenerator {
  generate(options: GenerateImageOptions): Promise<GeneratedImageResult[]>;
}
