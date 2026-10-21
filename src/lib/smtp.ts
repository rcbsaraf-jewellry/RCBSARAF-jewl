import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const PLACEHOLDER_USER = "your_gmail_address@gmail.com";
const PLACEHOLDER_PASS = "your_16_char_app_password";

export type SmtpStatus = {
  configured: boolean;
  verified: boolean;
  host: string;
  error?: string;
};

export function smtpUser() {
  return (process.env.SMTP_USER ?? "").trim();
}

function smtpPass() {
  return (process.env.SMTP_PASS ?? "").replace(/\s+/g, "").trim();
}

export function isSmtpConfigured() {
  const user = smtpUser();
  const pass = smtpPass();
  return Boolean(
    user &&
      pass &&
      user !== PLACEHOLDER_USER &&
      pass !== PLACEHOLDER_PASS &&
      user.includes("@"),
  );
}

export function getSmtpFrom() {
  const raw = (process.env.SMTP_FROM ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (raw) return raw;
  const user = smtpUser();
  return user ? `Sarafa Books <${user}>` : "Sarafa Books <noreply@localhost>";
}

function transportOptions(): SMTPTransport.Options {
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: isSmtpConfigured()
      ? { user: smtpUser(), pass: smtpPass() }
      : undefined,
  };
}

let transporter: nodemailer.Transporter | null = null;
let transporterKey = "";
let lastVerify: SmtpStatus | null = null;

export function getTransporter() {
  const key = `${smtpUser()}|${smtpPass()}|${process.env.SMTP_HOST}|${process.env.SMTP_PORT}`;
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport(transportOptions());
    transporterKey = key;
    lastVerify = null;
  }
  return transporter;
}

export async function verifySmtp(): Promise<SmtpStatus> {
  if (!isSmtpConfigured()) {
    lastVerify = {
      configured: false,
      verified: false,
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      error: "Set SMTP_USER and SMTP_PASS (Gmail App Password) in Vercel project environment variables, then redeploy.",
    };
    return lastVerify;
  }
  try {
    await getTransporter().verify();
    lastVerify = {
      configured: true,
      verified: true,
      host: process.env.SMTP_HOST || "smtp.gmail.com",
    };
  } catch (error) {
    lastVerify = {
      configured: true,
      verified: false,
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      error: error instanceof Error ? error.message : "SMTP verification failed.",
    };
  }
  return lastVerify;
}

export function otpEmailTemplate(params: { name?: string | null; code: string; roleLabel: string }) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi,";
  const text = [
    greeting,
    "",
    `Your Sarafa Books ${params.roleLabel} verification code is ${params.code}.`,
    "It expires in 10 minutes. If you did not request this, ignore this email.",
    "",
    "— Sarafa Books",
  ].join("\n");
  const html = `
    <div style="background:#f4f1ea;color:#1c1917;font-family:Georgia,serif;padding:32px">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e1d8;border-radius:16px;padding:28px">
        <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#8a6d1a">Sarafa Books</div>
        <h1 style="font-size:22px;margin:12px 0 8px">Verification code</h1>
        <p style="color:#57534e;font-size:14px">${greeting} use this code to sign in to the ${params.roleLabel} workspace.</p>
        <div style="margin:24px 0;padding:16px;text-align:center;font-size:32px;letter-spacing:.4em;font-weight:700;background:#f4f1ea;border-radius:12px;color:#1c1917">${params.code}</div>
        <p style="color:#78716c;font-size:12px">Expires in 10 minutes. Do not share this code.</p>
      </div>
    </div>
  `;
  return { subject: "Your Sarafa Books verification code", text, html };
}

export function magicLinkEmailTemplate(params: { name?: string | null; url: string; roleLabel: string }) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi,";
  const text = `${greeting}\n\nOpen this ${params.roleLabel} sign-in link (expires in 10 minutes):\n${params.url}\n`;
  const html = `
    <div style="background:#09090b;color:#fafafa;font-family:Georgia,serif;padding:32px">
      <p>${greeting}</p>
      <p>Use the button below to sign in to the ${params.roleLabel} workspace.</p>
      <p><a href="${params.url}" style="display:inline-block;background:#c9a227;color:#09090b;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Sign in</a></p>
    </div>
  `;
  return { subject: "Your Sarafa Books magic sign-in link", text, html };
}

export function newDeviceEmailTemplate(params: {
  name?: string | null;
  roleLabel: string;
  when: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const greeting = params.name ? `Hi ${params.name},` : "Hi,";
  const text = [
    greeting,
    "",
    `A new device just signed in to your ${params.roleLabel} workspace.`,
    `Time: ${params.when}`,
    params.ip ? `IP: ${params.ip}` : "",
    params.userAgent ? `Device: ${params.userAgent}` : "",
    "",
    "If this was not you, reset your password and contact the administrator.",
  ]
    .filter(Boolean)
    .join("\n");
  const html = `<pre style="font-family:ui-sans-serif,system-ui;background:#09090b;color:#fafafa;padding:24px">${text}</pre>`;
  return { subject: "New device signed in to Sarafa Books", text, html };
}

export async function sendMail(params: { to: string; subject: string; text: string; html: string }) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured.");
  }
  const from = getSmtpFrom();
  const info = await getTransporter().sendMail({
    from,
    to: params.to,
    envelope: { from: smtpUser(), to: params.to },
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
  if (info.rejected?.length) {
    throw new Error(`Gmail rejected the recipient (${info.rejected.join(", ")}).`);
  }
  return info;
}
