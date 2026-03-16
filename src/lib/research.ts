const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

interface AnalysisResult {
  challenges: string[];
  rawContent: string;
}

export async function analyzeCompany(
  companyName: string,
  productName: string,
  url?: string
): Promise<AnalysisResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      "Anthropic API key is not configured. Set ANTHROPIC_API_KEY environment variable."
    );
  }

  const systemPrompt = `You are a marketing research analyst. Analyze companies and their products to identify marketing challenges and creative opportunities. Always respond with valid JSON.`;

  const userPrompt = `Analyze the following company and product for marketing creative development:

Company: ${companyName}
Product/Service: ${productName}
${url ? `Website: ${url}` : ""}

Please provide a detailed analysis in the following JSON format:
{
  "companyOverview": "Brief description of the company and its market position",
  "productAnalysis": "Analysis of the product/service and its value proposition",
  "targetAudience": "Description of the primary target audience",
  "challenges": [
    "Marketing challenge 1",
    "Marketing challenge 2",
    "Marketing challenge 3",
    "Marketing challenge 4",
    "Marketing challenge 5"
  ],
  "competitiveLandscape": "Overview of the competitive environment",
  "creativeOpportunities": [
    "Creative opportunity 1",
    "Creative opportunity 2",
    "Creative opportunity 3"
  ],
  "recommendedStyles": [
    "Visual style recommendation 1",
    "Visual style recommendation 2"
  ],
  "keyMessages": [
    "Key marketing message 1",
    "Key marketing message 2",
    "Key marketing message 3"
  ]
}

Be specific and actionable in your analysis. Focus on real marketing challenges that creative assets could help address.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Anthropic API error: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textContent = data.content.find((block) => block.type === "text");
  if (!textContent) {
    throw new Error("No text content in Anthropic API response");
  }

  const rawContent = textContent.text;

  let challenges: string[] = [];
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        challenges?: string[];
      };
      challenges = parsed.challenges || [];
    }
  } catch {
    const challengeRegex = /["']([^"']+challenge[^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = challengeRegex.exec(rawContent)) !== null) {
      challenges.push(match[1]);
    }

    if (challenges.length === 0) {
      challenges = [
        "Brand awareness in competitive market",
        "Reaching target audience effectively",
        "Differentiating from competitors",
        "Creating compelling visual content",
        "Maintaining consistent brand messaging",
      ];
    }
  }

  return { challenges, rawContent };
}
