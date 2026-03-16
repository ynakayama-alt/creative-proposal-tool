import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import type {
  ImageGenerator,
  GenerateImageOptions,
  GeneratedImageResult,
} from "./types";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface VertexPrediction {
  bytesBase64Encoded: string;
  mimeType: string;
}

interface VertexResponse {
  predictions: VertexPrediction[];
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function signJwtWithServiceAccount(
  payload: Record<string, unknown>,
  privateKeyPem: string
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const pemBody = privateKeyPem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryKey = Buffer.from(pemBody, "base64");

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = Buffer.from(signature)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${signingInput}.${encodedSignature}`;
}

async function getAccessToken(
  serviceAccountKey: ServiceAccountKey
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const jwtPayload = {
    iss: serviceAccountKey.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: serviceAccountKey.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const signedJwt = await signJwtWithServiceAccount(
    jwtPayload,
    serviceAccountKey.private_key
  );

  const tokenResponse = await fetch(serviceAccountKey.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to obtain access token: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  return tokenData.access_token;
}

export class VertexAIGenerator implements ImageGenerator {
  private projectId: string;
  private location: string;
  private serviceAccountKeyPath: string;
  private outputDir: string;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    this.location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    this.serviceAccountKeyPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
    this.outputDir = join(process.cwd(), "public", "uploads", "generated");
  }

  async generate(
    options: GenerateImageOptions
  ): Promise<GeneratedImageResult[]> {
    const {
      prompt,
      referenceImageUrls,
      productImagePath,
      style,
      count = 1,
    } = options;

    if (!this.projectId) {
      throw new Error(
        "GOOGLE_CLOUD_PROJECT environment variable is not set."
      );
    }
    if (!this.serviceAccountKeyPath) {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set."
      );
    }

    const serviceAccountRaw = await readFile(
      this.serviceAccountKeyPath,
      "utf-8"
    );
    const serviceAccountKey = JSON.parse(
      serviceAccountRaw
    ) as ServiceAccountKey;
    const accessToken = await getAccessToken(serviceAccountKey);

    const enhancedPrompt = this.buildPrompt(prompt, style);

    const instances: Array<Record<string, unknown>> = [];

    if (productImagePath) {
      const imageBytes = await readFile(productImagePath);
      const base64Image = imageBytes.toString("base64");
      instances.push({
        prompt: enhancedPrompt,
        image: {
          bytesBase64Encoded: base64Image,
        },
      });
    } else if (referenceImageUrls && referenceImageUrls.length > 0) {
      const refImageUrl = referenceImageUrls[0];
      const refResponse = await fetch(refImageUrl);
      if (refResponse.ok) {
        const refBuffer = await refResponse.arrayBuffer();
        const base64Ref = Buffer.from(refBuffer).toString("base64");
        instances.push({
          prompt: enhancedPrompt,
          image: {
            bytesBase64Encoded: base64Ref,
          },
        });
      } else {
        instances.push({ prompt: enhancedPrompt });
      }
    } else {
      instances.push({ prompt: enhancedPrompt });
    }

    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-002:predict`;

    const requestBody = {
      instances,
      parameters: {
        sampleCount: count,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult",
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Vertex AI Imagen API error: ${response.status} - ${errorText}`
      );
    }

    const data = (await response.json()) as VertexResponse;

    if (!data.predictions || data.predictions.length === 0) {
      throw new Error("No images generated by Vertex AI Imagen API");
    }

    await mkdir(this.outputDir, { recursive: true });

    const results: GeneratedImageResult[] = [];

    for (const prediction of data.predictions) {
      const imageBuffer = Buffer.from(
        prediction.bytesBase64Encoded,
        "base64"
      );
      const extension = prediction.mimeType === "image/png" ? "png" : "jpg";
      const filename = `${randomUUID()}.${extension}`;
      const localPath = join(this.outputDir, filename);

      await writeFile(localPath, imageBuffer);

      results.push({
        localPath: `/uploads/generated/${filename}`,
        prompt: enhancedPrompt,
      });
    }

    return results;
  }

  private buildPrompt(basePrompt: string, style?: string): string {
    const parts = [basePrompt];

    if (style) {
      parts.push(`Style: ${style}`);
    }

    parts.push(
      "High quality, professional marketing creative, detailed, well-composed"
    );

    return parts.join(". ");
  }
}
