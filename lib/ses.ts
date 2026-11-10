import "server-only";
import { randomUUID } from "node:crypto";
import { GetAccountCommand, SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";

/* Outgoing mail through Amazon SES (API v2), one message per call.

   Env: EMAIL_DELIVERY (off | simulate | live; off unless set), SENDER_EMAIL
   and SENDER_NAME (the WeBuddhist backend's names), SES_REGION,
   SES_ACCESS_KEY, SES_SECRET_KEY and, optionally, SES_CONFIGURATION_SET.

   The SES keys are their own IAM user, never the S3 ones: those sit in
   every developer's .env.local, and a laptop must not be able to write to
   applicants. With no SES keys there is no fallback to the SDK's default
   credential chain, for the same reason. */

/* Where mail may go from this process.
   - off: nowhere.
   - simulate: nowhere, but the whole pipeline runs and records its sends.
     Only against a local database, so a laptop pointed at the real one
     cannot mark people as told.
   - test-only: EMAIL_DELIVERY=live outside production. Real SES, but only
     the "send a test to myself" action; decisions stay unsent.
   - live: decisions go to applicants. Production only. */
export type DeliveryMode = "off" | "simulate" | "test-only" | "live";

export type Delivery = { mode: DeliveryMode; note: string | null };

const LOCAL_DATABASE = /localhost|127\.0\.0\.1/;

export function delivery(): Delivery {
  const wanted = (process.env.EMAIL_DELIVERY ?? "off").trim().toLowerCase();
  if (wanted === "live") {
    // Render sets IS_PULL_REQUEST on preview services, which may share the
    // production environment's variables.
    if (process.env.NODE_ENV === "production" && process.env.IS_PULL_REQUEST !== "true") {
      return { mode: "live", note: null };
    }
    return {
      mode: "test-only",
      note: "Decision emails only go out from the production site. From here you can send a test to yourself.",
    };
  }
  if (wanted === "simulate") {
    if (LOCAL_DATABASE.test(process.env.DATABASE_URL ?? "")) {
      return { mode: "simulate", note: "Simulation: no email leaves this machine. Sends are recorded in the local database." };
    }
    return { mode: "off", note: "Simulation only runs against a local database, so email sending is off here." };
  }
  return { mode: "off", note: "Email sending is switched off in this environment." };
}

/* Why a whole run should stop, not only this message: the next send would
   fail the same way. */
export type HaltCode = "quota" | "paused" | "sandbox" | "config";

/* A send that did not go through. `failed` means SES refused it or was
   never reached, so nothing was sent. `uncertain` means the request may
   have been accepted (a timeout, a 5xx): the caller must not retry on its
   own, because SES has no idempotency key and a retry can deliver twice. */
export class EmailSendError extends Error {
  kind: "failed" | "uncertain";
  code: string;
  halt: HaltCode | null;
  constructor(kind: "failed" | "uncertain", code: string, message: string, halt: HaltCode | null = null) {
    super(message);
    this.name = "EmailSendError";
    this.kind = kind;
    this.code = code;
    this.halt = halt;
  }
}

let client: SESv2Client | undefined;

function ses() {
  const region = process.env.SES_REGION;
  const accessKeyId = process.env.SES_ACCESS_KEY;
  const secretAccessKey = process.env.SES_SECRET_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new EmailSendError(
      "failed",
      "NOT_CONFIGURED",
      "SES is not configured: set SES_REGION, SES_ACCESS_KEY and SES_SECRET_KEY.",
      "config",
    );
  }
  client ??= new SESv2Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    // One attempt. The SDK's own retries repeat a request after a timeout
    // or a 5xx, which is exactly when SES may already have taken it.
    maxAttempts: 1,
    requestHandler: { connectionTimeout: 5_000, requestTimeout: 10_000 },
  });
  return client;
}

/** The From header: `"Buddhist Creators" <hello@…>`. */
export function sender() {
  const email = process.env.SENDER_EMAIL?.trim();
  if (!email) {
    throw new EmailSendError("failed", "NOT_CONFIGURED", "SENDER_EMAIL is not set.", "config");
  }
  const name = process.env.SENDER_NAME?.replace(/[\r\n"\\<>]/g, "").trim();
  if (!name) return email;
  // A name outside ASCII has to travel as a MIME encoded word.
  const display = /^[\x20-\x7e]*$/.test(name)
    ? `"${name}"`
    : `=?UTF-8?B?${Buffer.from(name, "utf8").toString("base64")}?=`;
  return `${display} <${email}>`;
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Message tags, for telling sends apart in SES events. Letters, digits,
      dashes and underscores only. */
  tags?: Record<string, string>;
};

type AwsError = {
  name?: string;
  message?: string;
  code?: string;
  cause?: { code?: string };
  $metadata?: { httpStatusCode?: number };
};

const NEVER_CONNECTED = new Set(["ENOTFOUND", "ECONNREFUSED", "EAI_AGAIN"]);

function classify(raw: unknown): EmailSendError {
  if (raw instanceof EmailSendError) return raw;
  const error = (raw ?? {}) as AwsError;
  const code = error.name || "Error";
  const message = (error.message || String(raw)).slice(0, 500);
  const status = error.$metadata?.httpStatusCode;

  if (code === "AccountSuspendedException" || code === "SendingPausedException") {
    return new EmailSendError("failed", code, "Sending is paused on the SES account.", "paused");
  }
  if (code === "LimitExceededException" || code === "TooManyRequestsException") {
    return new EmailSendError("failed", code, `SES is refusing more mail for now: ${message}`, "quota");
  }
  if (code === "MailFromDomainNotVerifiedException") {
    return new EmailSendError("failed", code, "The MAIL FROM domain is not verified in SES.", "config");
  }
  if (code === "MessageRejected" && /not verified/i.test(message)) {
    // The sender identity is unverified, or the account is still in the
    // sandbox and this recipient is not a verified address.
    return new EmailSendError("failed", code, message, "sandbox");
  }
  if (status === 403 || code === "CredentialsProviderError" || /not authorized|security token|signature/i.test(message)) {
    return new EmailSendError("failed", code, `SES refused the credentials: ${message}`, "config");
  }
  if (status !== undefined && status >= 400 && status < 500) {
    // Refused for this message alone: a malformed address, say.
    return new EmailSendError("failed", code, message);
  }
  if (NEVER_CONNECTED.has(error.code ?? "") || NEVER_CONNECTED.has(error.cause?.code ?? "")) {
    return new EmailSendError("failed", code, `SES could not be reached: ${message}`, "config");
  }
  return new EmailSendError("uncertain", code, message);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* In simulate mode nothing is sent. Two local parts stand in for the ways
   a real send goes wrong, so each path can be walked by hand:
   `fail+…@` is refused, `timeout+…@` never answers. */
function simulateSend(message: OutgoingEmail) {
  const local = message.to.split("@")[0] ?? "";
  if (local.startsWith("fail+")) {
    throw new EmailSendError("failed", "SimulatedRejection", "Simulated: the address was refused.");
  }
  if (local.startsWith("timeout+")) {
    throw new EmailSendError("uncertain", "SimulatedTimeout", "Simulated: no answer from SES.");
  }
  return { messageId: `simulated-${randomUUID()}` };
}

/** Send one message. Resolves with SES's message id, or throws an
    EmailSendError saying whether anything can have been sent. */
export async function sendEmail(
  message: OutgoingEmail,
  options: { simulate?: boolean } = {},
): Promise<{ messageId: string }> {
  if (options.simulate) return simulateSend(message);

  let command: SendEmailCommand;
  let api: SESv2Client;
  try {
    api = ses();
    const from = sender();
    command = new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [message.to] },
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: message.text, Charset: "UTF-8" },
            Html: { Data: message.html, Charset: "UTF-8" },
          },
        },
      },
      EmailTags: Object.entries(message.tags ?? {}).map(([Name, Value]) => ({ Name, Value })),
      ConfigurationSetName: process.env.SES_CONFIGURATION_SET || undefined,
    });
  } catch (error) {
    throw classify(error);
  }

  for (let attempt = 1; ; attempt += 1) {
    try {
      const result = await api.send(command);
      return { messageId: result.MessageId ?? "" };
    } catch (error) {
      const classified = classify(error);
      // A throttled request was turned away before SES took the message,
      // so one more try after a pause is safe. Nothing else is retried.
      if (classified.code === "TooManyRequestsException" && attempt === 1) {
        await wait(1_100);
        continue;
      }
      throw classified;
    }
  }
}

export type SendQuota = {
  /** Messages SES accepts each second. */
  perSecond: number;
  /** Left of the rolling 24-hour allowance, or null when it is unlimited. */
  remainingToday: number | null;
  /** True until AWS grants production access: only verified addresses
      receive mail. */
  sandbox: boolean;
  sendingEnabled: boolean;
};

let quotaMemo: { quota: SendQuota; at: number } | undefined;

/** The account's sending limits, remembered for a minute. Null when SES is
    not configured or cannot be asked; callers then pace at one a second. */
export async function sendQuota(): Promise<SendQuota | null> {
  if (quotaMemo && Date.now() - quotaMemo.at < 60_000) return quotaMemo.quota;
  try {
    const account = await ses().send(new GetAccountCommand({}));
    const max = account.SendQuota?.Max24HourSend ?? 0;
    const quota: SendQuota = {
      perSecond: Math.max(1, account.SendQuota?.MaxSendRate ?? 1),
      // SES reports -1 for an unlimited daily allowance.
      remainingToday: max < 0 ? null : Math.max(0, Math.floor(max - (account.SendQuota?.SentLast24Hours ?? 0))),
      sandbox: account.ProductionAccessEnabled !== true,
      sendingEnabled: account.SendingEnabled !== false,
    };
    quotaMemo = { quota, at: Date.now() };
    return quota;
  } catch (error) {
    console.error("SES GetAccount failed", classify(error).message);
    return null;
  }
}
