"use client";

import { useRef, useState } from "react";
import { IconUpload, IconPhoto } from "@/components/icons";

export interface Asset {
  id: string;
  url: string;
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function AssetUploader({
  assets,
  onChange,
  hint,
}: {
  assets: Asset[];
  onChange: (next: Asset[]) => void;
  hint?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live mirror of `assets` so concurrent uploads don't clobber each other.
  const assetsRef = useRef<Asset[]>(assets);
  assetsRef.current = assets;

  async function uploadFile(file: File) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pending: Asset = {
      id,
      url: "",
      name: file.name,
      status: "uploading",
    };

    // assetsRef always holds the newest array, so parallel uploads append
    // to each other instead of overwriting.
    assetsRef.current = [...assetsRef.current, pending];
    onChange(assetsRef.current);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed");

      assetsRef.current = assetsRef.current.map((a) =>
        a.id === id ? { ...a, url: data.url, status: "done" as const } : a
      );
      onChange(assetsRef.current);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      assetsRef.current = assetsRef.current.map((a) =>
        a.id === id ? { ...a, status: "error" as const, error: msg } : a
      );
      onChange(assetsRef.current);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  function remove(id: string) {
    onChange(assets.filter((a) => a.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...assets];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed
          px-4 py-5 cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-surface2 hover:border-text-muted"
          }`}
      >
        <IconUpload size={18} className="text-text-muted" />
        <p className="text-[13px] text-text">
          Drop images or <span className="text-primary">browse</span>
        </p>
        <p className="text-[12px] text-text-muted text-center">
          {hint ?? "PNG, JPG, WebP or SVG · up to 5MB each"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {assets.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-2.5">
          {assets.map((a, i) => (
            <li
              key={a.id}
              className="flex items-center gap-2.5 bg-surface2 border border-border rounded-lg p-1.5"
            >
              <span className="w-9 h-9 rounded-md bg-bg flex items-center justify-center overflow-hidden shrink-0">
                {a.status === "done" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : a.status === "uploading" ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IconPhoto size={15} className="text-danger" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[12px] truncate">{a.name}</span>
                <span
                  className={`block text-[11px] ${
                    a.status === "error" ? "text-danger" : "text-text-muted"
                  }`}
                >
                  {a.status === "uploading"
                    ? "Uploading…"
                    : a.status === "error"
                    ? a.error
                    : i === 0
                    ? "First — used as headshot"
                    : "Logo"}
                </span>
              </span>

              <span className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="w-6 h-6 rounded text-text-muted hover:text-text disabled:opacity-30 text-xs"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === assets.length - 1}
                  aria-label="Move down"
                  className="w-6 h-6 rounded text-text-muted hover:text-text disabled:opacity-30 text-xs"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  aria-label="Remove"
                  className="w-6 h-6 rounded text-text-muted hover:text-danger text-sm"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
