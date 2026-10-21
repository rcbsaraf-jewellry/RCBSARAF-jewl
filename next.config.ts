import type { NextConfig } from "next";

const siteUrl = process.env.AUTH_URL
  || process.env.NEXTAUTH_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

if (siteUrl) {
  process.env.AUTH_URL ??= siteUrl;
  process.env.NEXTAUTH_URL ??= siteUrl;
}
process.env.AUTH_TRUST_HOST ??= "true";

const nextConfig: NextConfig = {
  env: {
    AUTH_TRUST_HOST: "true",
    ...(siteUrl ? { AUTH_URL: siteUrl, NEXTAUTH_URL: siteUrl } : {}),
  },
  serverExternalPackages: [
    "@electric-sql/pglite",
    "postgres",
    "bcryptjs",
    "nodemailer",
    "@react-pdf/renderer",
    "@vladmandic/face-api",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
