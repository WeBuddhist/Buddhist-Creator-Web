import { SITE_NAME } from "@/lib/navigation";

/* What a decision email is made of. A template says who it greets and
   what it says, as plain paragraphs and the odd link; this file turns that
   into the two bodies every message carries, plain text and HTML, so the
   wording lives in one place and is never written as markup. */

export type EmailVars = {
  /** The applicant's name as they gave it, or null. */
  name: string | null;
};

/** A paragraph (line breaks are kept), or a link on its own line. */
export type EmailBlock = string | { link: { label: string; href: string } };

export type EmailTemplate = {
  /** Stored with every send. Change it whenever the wording changes. */
  version: string;
  /** False while the wording is a placeholder. The live site refuses to
      send a decision from a template that is not approved. */
  approved: boolean;
  subject: (vars: EmailVars) => string;
  body: (vars: EmailVars) => EmailBlock[];
};

export type RenderedEmail = { subject: string; text: string; html: string; version: string };

/** "Dear Tenzin," or, with no name on file, "Hello,". */
export function greeting(vars: EmailVars) {
  const name = vars.name?.trim();
  return name ? `Dear ${name},` : "Hello,";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Mail clients ignore stylesheets and rem, so the HTML is a table with
   inline pixel sizes. Every value from an applicant or a template passes
   through escapeHtml: a name is something a stranger typed. */
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function htmlBlock(block: EmailBlock) {
  if (typeof block === "string") {
    return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:#1f2933;">${escapeHtml(block).replace(/\r?\n/g, "<br>")}</p>`;
  }
  const href = /^(https?:|mailto:)/i.test(block.link.href) ? block.link.href : "#";
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;"><a href="${escapeHtml(href)}" style="color:#136986;text-decoration:underline;">${escapeHtml(block.link.label)}</a></p>`;
}

function textBlock(block: EmailBlock) {
  return typeof block === "string" ? block : `${block.link.label}: ${block.link.href}`;
}

export function renderEmail(template: EmailTemplate, vars: EmailVars): RenderedEmail {
  const subject = template.subject(vars).replace(/[\r\n]+/g, " ").trim();
  const blocks = template.body(vars);
  const text = `${blocks.map(textBlock).join("\n\n")}\n`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;">
<tr><td style="padding:24px 28px 8px;font-family:${FONT};font-size:14px;font-weight:600;letter-spacing:0.02em;color:#136986;">${escapeHtml(SITE_NAME)}</td></tr>
<tr><td style="padding:8px 28px 12px;">
${blocks.map(htmlBlock).join("\n")}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
  return { subject, text, html, version: template.version };
}
