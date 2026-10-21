const MATCH_THRESHOLD = 0.85;

function geminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "";
}

export function embeddingDistance(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function embeddingConfidence(distance: number) {
  return Math.max(0, Math.min(1, 1.15 - distance));
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], data: match[2] };
}

async function visionCompare(reference: string, selfie: string) {
  const key = geminiKey();
  if (!key) return null;
  const ref = parseDataUrl(reference);
  const live = parseDataUrl(selfie);
  if (!ref || !live) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Compare the reference staff photo with the live selfie. Decide if they are the same person.
Return ONLY JSON: {"match": boolean, "confidence": number, "reason": string}
confidence is 0 to 1. Require a real face in both images.`,
              },
              { inline_data: { mime_type: ref.mime, data: ref.data } },
              { inline_data: { mime_type: live.mime, data: live.data } },
            ],
          },
        ],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(25000),
    },
  );
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { match?: boolean; confidence?: number };
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
    return { matched: Boolean(parsed.match) && confidence >= MATCH_THRESHOLD, confidence };
  } catch {
    return null;
  }
}

export async function matchStaffFace(input: {
  referenceFaceUrl: string | null;
  storedEmbedding: number[] | null;
  selfieBase64: string;
  liveEmbedding: number[] | null;
}) {
  if (!input.referenceFaceUrl && !input.storedEmbedding) {
    return { enrolled: true, matched: true, confidence: 1, reason: "registered" as const };
  }

  if (input.storedEmbedding && input.liveEmbedding) {
    const distance = embeddingDistance(input.storedEmbedding, input.liveEmbedding);
    const confidence = embeddingConfidence(distance);
    if (confidence >= MATCH_THRESHOLD) {
      return { enrolled: false, matched: true, confidence, reason: "embedding" as const };
    }
  }

  const vision = await visionCompare(input.referenceFaceUrl ?? "", input.selfieBase64);
  if (vision) {
    return { enrolled: false, matched: vision.matched, confidence: vision.confidence, reason: "vision" as const };
  }

  if (input.storedEmbedding && input.liveEmbedding) {
    const confidence = embeddingConfidence(embeddingDistance(input.storedEmbedding, input.liveEmbedding));
    return { enrolled: false, matched: false, confidence, reason: "embedding" as const };
  }

  throw new Error("Could not compare faces. Register a clearer selfie, or set GEMINI_API_KEY.");
}
