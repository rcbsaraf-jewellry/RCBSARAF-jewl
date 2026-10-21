import { DIGITIZE_PROMPT, parseDigitizerJson, parseJewelryOcrText } from "@/lib/ocr/parser";
import type { DigitizerDraft } from "@/lib/ocr/types";

type Media = { mime: string; bytes: Buffer; filename: string };

function geminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "";
}

function openaiKey() {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

function visionKey() {
  return process.env.GOOGLE_VISION_API_KEY?.trim() || process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim() || "";
}

export function digitizerProvider() {
  if (geminiKey()) return "gemini";
  if (openaiKey()) return "openai";
  if (visionKey()) return "google-vision";
  return null;
}

async function fromGemini(media: Media): Promise<string> {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let last = "Gemini request failed.";
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey())}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: DIGITIZE_PROMPT },
                { inline_data: { mime_type: media.mime, data: media.bytes.toString("base64") } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(45000),
      },
    );
    const json = (await res.json()) as {
      error?: { message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    if (!res.ok) {
      last = json.error?.message ?? last;
      continue;
    }
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("\n") ?? "";
    if (text.trim()) return text;
  }
  throw new Error(last);
}

async function fromOpenAI(media: Media): Promise<string> {
  if (media.mime === "application/pdf") {
    throw new Error("PDF bills need GEMINI_API_KEY. Photograph the bill or set a Gemini key.");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DIGITIZE_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Read this jewellery bill (${media.filename}).` },
            { type: "image_url", image_url: { url: `data:${media.mime};base64,${media.bytes.toString("base64")}` } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const json = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };
  if (!res.ok) throw new Error(json.error?.message ?? "OpenAI vision request failed.");
  return json.choices?.[0]?.message?.content ?? "";
}

async function fromGoogleVision(media: Media): Promise<string> {
  if (media.mime === "application/pdf") {
    throw new Error("Google Vision on this route accepts images. Photograph the PDF page or set GEMINI_API_KEY.");
  }
  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(visionKey())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: media.bytes.toString("base64") },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const json = (await res.json()) as {
    error?: { message?: string };
    responses?: Array<{ fullTextAnnotation?: { text?: string }; error?: { message?: string } }>;
  };
  if (!res.ok) throw new Error(json.error?.message ?? "Google Vision request failed.");
  const text = json.responses?.[0]?.fullTextAnnotation?.text ?? "";
  if (!text.trim()) throw new Error(json.responses?.[0]?.error?.message ?? "No text found on this bill.");
  return text;
}

export async function digitizeBillMedia(media: Media): Promise<DigitizerDraft> {
  const provider = digitizerProvider();
  if (!provider) {
    throw new Error("Set GEMINI_API_KEY, OPENAI_API_KEY, or GOOGLE_VISION_API_KEY to digitize bills.");
  }
  const raw =
    provider === "gemini" ? await fromGemini(media) : provider === "openai" ? await fromOpenAI(media) : await fromGoogleVision(media);
  const parsed = parseDigitizerJson(raw) ?? parseJewelryOcrText(raw);
  if (!parsed) throw new Error("Could not read jewellery lines from this bill. Try a sharper photo.");
  return parsed;
}
