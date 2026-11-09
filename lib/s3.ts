import "server-only";
import type { Readable } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* S3, the way the WeBuddhist backend does it (pecha_api/uploads/S3_utils.py):
   objects are private, every call names the expected bucket owner, uploads
   stream rather than buffer, and reads go through presigned GET URLs whose
   signature is reused for a while so the same object keeps the same URL.

   Env, with the backend's names: AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION,
   AWS_BUCKET_NAME, AWS_BUCKET_OWNER (the account id; optional),
   PRESIGNED_URL_EXPIRY_SECONDS (default one day). */

let client: S3Client | undefined;

function s3() {
  client ??= new S3Client({
    region: process.env.AWS_REGION,
    credentials:
      process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
          }
        : undefined,
  });
  return client;
}

function bucket() {
  const name = process.env.AWS_BUCKET_NAME;
  if (!name) throw new Error("AWS_BUCKET_NAME is not set");
  return name;
}

function expectedBucketOwner() {
  return process.env.AWS_BUCKET_OWNER || undefined;
}

// AWS refuses a SigV4 signature asked to live longer than a week.
const MAX_PRESIGNED_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export function presignedUrlExpirySeconds() {
  const configured = Number(process.env.PRESIGNED_URL_EXPIRY_SECONDS) || 86_400;
  return Math.min(configured, MAX_PRESIGNED_EXPIRY_SECONDS);
}

/** Store a stream as `key`. The stream is sent as it arrives; nothing is
    held in memory beyond lib-storage's part buffer. */
export async function uploadStream(args: {
  key: string;
  body: Readable;
  contentType: string;
  contentDisposition?: string;
}) {
  const upload = new Upload({
    client: s3(),
    params: {
      Bucket: bucket(),
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType,
      ContentDisposition: args.contentDisposition,
      ExpectedBucketOwner: expectedBucketOwner(),
    },
    // Smaller parts mean a failed upload wastes less, and a 120 MB clip is
    // at most 24 of them.
    partSize: 5 * 1024 * 1024,
    queueSize: 2,
    leavePartsOnError: false,
  });
  await upload.done();
  forgetSignedUrl(args.key);
  return args.key;
}

/* Signing afresh on every request gives the same object a new URL each
   time (the signature carries its signing time), so a browser cannot cache
   the video and fetches it again on every visit. The URL signed last is
   handed out for a while instead. The window stays well inside the
   signature's life. */
const SIGNED_URL_REUSE_SECONDS = 60 * 60;
const SIGNED_URL_MEMO_LIMIT = 10_000;
const signedUrlMemo = new Map<string, { url: string; signedAt: number }>();

function memoKey(key: string) {
  return `${bucket()}\n${key}`;
}

function reusableSignedUrl(key: string) {
  const id = memoKey(key);
  const entry = signedUrlMemo.get(id);
  if (!entry) return null;
  const window = Math.min(SIGNED_URL_REUSE_SECONDS, presignedUrlExpirySeconds() / 2) * 1000;
  if (Date.now() - entry.signedAt >= window) {
    signedUrlMemo.delete(id);
    return null;
  }
  // Re-insert so the Map's order is most recently used last.
  signedUrlMemo.delete(id);
  signedUrlMemo.set(id, entry);
  return entry.url;
}

function rememberSignedUrl(key: string, url: string) {
  if (signedUrlDeadline(url) === null) return;
  const id = memoKey(key);
  signedUrlMemo.delete(id);
  signedUrlMemo.set(id, { url, signedAt: Date.now() });
  while (signedUrlMemo.size > SIGNED_URL_MEMO_LIMIT) {
    const oldest = signedUrlMemo.keys().next().value;
    if (oldest === undefined) break;
    signedUrlMemo.delete(oldest);
  }
}

/** Drop the URL kept for this key once its object changes. */
export function forgetSignedUrl(key: string) {
  for (const id of [...signedUrlMemo.keys()]) {
    if (id.endsWith(`\n${key}`)) signedUrlMemo.delete(id);
  }
}

/** When a presigned URL's signature lapses, or null if it carries none. */
export function signedUrlDeadline(url: string): Date | null {
  let query: URLSearchParams;
  try {
    query = new URL(url).searchParams;
  } catch {
    return null;
  }
  const signedAt = query.get("X-Amz-Date");
  const lifetime = query.get("X-Amz-Expires");
  if (signedAt && lifetime) {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(signedAt);
    const seconds = Number(lifetime);
    if (m && Number.isFinite(seconds)) {
      const issued = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      return new Date(issued + seconds * 1000);
    }
    return null;
  }
  const absolute = query.get("Expires");
  if (absolute && Number.isFinite(Number(absolute))) {
    return new Date(Number(absolute) * 1000);
  }
  return null;
}

/** A URL the browser can load the private object from, for a day. An
    https URL is returned as is (it is already something the app can load). */
export async function presignedGetUrl(key: string | null | undefined): Promise<string | null> {
  if (!key?.trim()) return null;
  if (/^https?:\/\//.test(key)) return key;
  const reused = reusableSignedUrl(key);
  if (reused) return reused;
  const url = await getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: bucket(), Key: key, ExpectedBucketOwner: expectedBucketOwner() }),
    { expiresIn: presignedUrlExpirySeconds() },
  );
  rememberSignedUrl(key, url);
  return url;
}

/** Remove an object. A key that is already gone is not an error. */
export async function deleteObject(key: string): Promise<boolean> {
  forgetSignedUrl(key);
  try {
    await s3().send(
      new DeleteObjectCommand({ Bucket: bucket(), Key: key, ExpectedBucketOwner: expectedBucketOwner() }),
    );
    return true;
  } catch (error) {
    const name = (error as { name?: string; $metadata?: { httpStatusCode?: number } }).name;
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (name === "NoSuchKey" || name === "NotFound" || status === 404) return false;
    throw error;
  }
}

/** Delete without letting a failure interrupt the caller. */
export async function deleteObjectQuietly(key: string | null | undefined) {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch (error) {
    console.error(`S3 delete failed for ${key}`, error);
  }
}
