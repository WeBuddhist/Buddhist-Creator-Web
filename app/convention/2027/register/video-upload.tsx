"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDateTime } from "@/lib/format";
import {
  VIDEO_DURATION_TOLERANCE_SECONDS,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_SECONDS,
  VIDEO_TYPES,
} from "@/lib/registration-2027";
import { cn } from "@/lib/utils";

export type UploadedVideo = {
  key: string;
  sizeBytes: number | null;
  uploadedAt: string | null;
  url: string | null;
};

type Props = {
  video: UploadedVideo | null;
  disabled?: boolean;
  error?: string;
  onChange: (video: UploadedVideo | null) => void;
};

const ENDPOINT = "/api/applications/video";

const MESSAGES: Record<string, string> = {
  MEDIA_TOO_LARGE: `That file is larger than ${Math.round(VIDEO_MAX_BYTES / 1024 / 1024)} MB. Export it at a lower quality and try again.`,
  UNSUPPORTED_MEDIA_TYPE: "Upload an MP4 or MOV file.",
  APPLICATION_LOCKED: "Your application has been reviewed and the video can no longer be changed.",
  UNAUTHENTICATED: "Your session has expired. Reload the page and sign in again.",
  EMPTY_MEDIA_FILE: "That file looks empty.",
  S3_UPLOAD_FAILED: "The upload did not go through. Please try again.",
  NETWORK: "The upload was interrupted. Check your connection and try again.",
};

/** The clip's length, read by the browser before any bytes are sent. */
function readDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

function send(file: File, onProgress: (fraction: number) => void) {
  return new Promise<UploadedVideo>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", ENDPOINT);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => reject(new Error("NETWORK"));
    xhr.onload = () => {
      let body: { error?: string; key?: string; sizeBytes?: number; uploadedAt?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // A non-JSON body is treated as a failed upload below.
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.key) {
        resolve({ key: body.key, sizeBytes: body.sizeBytes ?? file.size, uploadedAt: body.uploadedAt ?? null, url: null });
      } else {
        reject(new Error(body.error ?? "S3_UPLOAD_FAILED"));
      }
    };
    xhr.send(file);
  });
}

export function VideoUpload({ video, disabled, error, onChange }: Props) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const busy = progress !== null || removing;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!VIDEO_TYPES[file.type]) {
      setMessage(MESSAGES.UNSUPPORTED_MEDIA_TYPE);
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      setMessage(MESSAGES.MEDIA_TOO_LARGE);
      return;
    }
    const duration = await readDuration(file);
    if (duration !== null && duration > VIDEO_MAX_SECONDS + VIDEO_DURATION_TOLERANCE_SECONDS) {
      setMessage(`Your video is ${Math.round(duration)} seconds long. Please keep it under ${VIDEO_MAX_SECONDS / 60} minutes.`);
      return;
    }
    setProgress(0);
    try {
      const uploaded = await send(file, setProgress);
      onChange(uploaded);
      // The server page re-renders with a playback URL for the new object.
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "S3_UPLOAD_FAILED";
      setMessage(MESSAGES[code] ?? MESSAGES.S3_UPLOAD_FAILED);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    if (!window.confirm("Remove your intro video? You can upload another one afterwards.")) return;
    setRemoving(true);
    setMessage(null);
    try {
      const response = await fetch(ENDPOINT, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "S3_UPLOAD_FAILED");
      }
      onChange(null);
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "S3_UPLOAD_FAILED";
      setMessage(MESSAGES[code] ?? MESSAGES.S3_UPLOAD_FAILED);
    } finally {
      setRemoving(false);
    }
  }

  const shown = message ?? error;

  return (
    <div className="flex flex-col gap-4">
      {video && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3">
          {video.url ? (
            <video
              controls
              preload="metadata"
              src={video.url}
              className="max-h-80 w-full rounded-lg bg-black"
            />
          ) : null}
          <p className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircleIcon className="size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />
            Video uploaded
            {video.uploadedAt && <span className="text-muted-foreground">on {formatDateTime(video.uploadedAt)}</span>}
            {video.sizeBytes ? <span className="text-muted-foreground">({formatBytes(video.sizeBytes)})</span> : null}
          </p>
        </div>
      )}

      {!disabled && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,.mp4,.mov"
            className="sr-only"
            id="intro-video"
            disabled={busy}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            size="pill"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <UploadSimpleIcon data-icon="inline-start" weight="bold" />
            {video ? "Replace video" : "Choose video"}
          </Button>
          {video && (
            <Button type="button" size="pill" variant="ghost" disabled={busy} onClick={remove}>
              <TrashIcon data-icon="inline-start" weight="bold" />
              Remove
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            MP4 or MOV, up to {VIDEO_MAX_SECONDS / 60} minutes and {Math.round(VIDEO_MAX_BYTES / 1024 / 1024)} MB.
          </span>
        </div>
      )}

      {progress !== null && (
        <div className="flex flex-col gap-1.5" role="status" aria-live="polite">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-cyan transition-[width] duration-150 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Finishing up…"}
          </p>
        </div>
      )}

      {shown && (
        <p className={cn("text-sm", message ? "text-brand-maroon" : "text-brand-maroon")} role="alert">
          {shown}
        </p>
      )}
    </div>
  );
}
