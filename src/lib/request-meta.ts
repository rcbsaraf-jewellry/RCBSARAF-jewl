import { createHash } from "node:crypto";
import { headers } from "next/headers";

export async function requestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  const fingerprint = createHash("sha256").update(`${ip}|${userAgent}`).digest("hex");
  return { ip, userAgent, fingerprint };
}
