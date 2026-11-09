import { Readable, Transform } from "node:stream";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApplicationLocked, clearMyVideo, getOrCreateMyApplication, isEditable, setMyVideo } from "@/lib/applications";
import { VIDEO_MAX_BYTES, VIDEO_TYPES } from "@/lib/registration-2027";
import { deleteObjectQuietly, uploadStream } from "@/lib/s3";

/* The intro video. The browser sends the file as the raw request body
   (Content-Type: video/mp4 or video/quicktime); this handler checks who is
   sending and how much, then streams the bytes straight into S3, the way
   the backend's upload_stream does. Nothing is buffered on the server.

   The proxy's matcher excludes this path on purpose: the session is
   checked here instead. */

const MEDIA_TOO_LARGE = "MEDIA_TOO_LARGE";
const UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE";
const EMPTY_MEDIA_FILE = "EMPTY_MEDIA_FILE";
const APPLICATION_LOCKED = "APPLICATION_LOCKED";
const UNAUTHENTICATED = "UNAUTHENTICATED";
const S3_UPLOAD_FAILED = "S3_UPLOAD_FAILED";

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

class BodyTooLarge extends Error {
  constructor() {
    super(MEDIA_TOO_LARGE);
    this.name = "BodyTooLarge";
  }
}

/** Passes bytes through, and fails the stream past `max`: the declared
    Content-Length is not taken on trust. */
function byteLimit(max: number) {
  let seen = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      seen += chunk.length;
      if (seen > max) {
        callback(new BodyTooLarge());
        return;
      }
      callback(null, chunk);
    },
  });
}

function videoKey(userId: string, extension: string) {
  return `convention-2027/applications/${userId}/${randomUUID()}.${extension}`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail(401, UNAUTHENTICATED);

  const application = await getOrCreateMyApplication(user.id);
  if (!isEditable(application.status)) return fail(409, APPLICATION_LOCKED);

  const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const extension = VIDEO_TYPES[contentType];
  if (!extension) return fail(415, UNSUPPORTED_MEDIA_TYPE);

  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) return fail(400, EMPTY_MEDIA_FILE);
  if (declared > VIDEO_MAX_BYTES) return fail(413, MEDIA_TOO_LARGE);
  if (!request.body) return fail(400, EMPTY_MEDIA_FILE);

  const key = videoKey(user.id, extension);
  const body = Readable.fromWeb(request.body as import("node:stream/web").ReadableStream).pipe(
    byteLimit(VIDEO_MAX_BYTES),
  );

  try {
    await uploadStream({ key, body, contentType });
  } catch (error) {
    if (error instanceof BodyTooLarge) return fail(413, MEDIA_TOO_LARGE);
    console.error("Video upload failed", error);
    return fail(502, S3_UPLOAD_FAILED);
  }

  try {
    const { application: updated, previousKey } = await setMyVideo(user.id, {
      key,
      sizeBytes: declared,
      mime: contentType,
    });
    if (previousKey && previousKey !== key) await deleteObjectQuietly(previousKey);
    return NextResponse.json({
      key: updated.videoKey,
      sizeBytes: updated.videoSizeBytes,
      mime: updated.videoMime,
      uploadedAt: updated.videoUploadedAt,
    });
  } catch (error) {
    // The object is in S3 but the row would not take it: do not leave it.
    await deleteObjectQuietly(key);
    if (error instanceof ApplicationLocked) return fail(409, APPLICATION_LOCKED);
    throw error;
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return fail(401, UNAUTHENTICATED);
  try {
    const previousKey = await clearMyVideo(user.id);
    await deleteObjectQuietly(previousKey);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApplicationLocked) return fail(409, APPLICATION_LOCKED);
    throw error;
  }
}
