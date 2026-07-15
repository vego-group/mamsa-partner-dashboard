"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { MAX_UPLOAD_MB } from "@/lib/constants";
import type { UploadKind } from "@/types";
import { useLocale } from "@/stores/locale-store";
import { Check, Loader2, Upload, X, AlertCircle } from "lucide-react";

export interface UploadedFile {
  fileId: string;
  fileName: string;
}

interface FileUploadRowProps {
  kind: UploadKind;
  title: string;
  subtitle?: string;
  optional?: string;
  accept?: string;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
}

/** A single upload slot — real file picker, real presign+PUT upload (§9.1), with progress/error states. */
export function FileUploadRow({ kind, title, subtitle, optional, accept, value, onChange }: FileUploadRowProps) {
  const { t } = useLocale();
  const w = t.wiz;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(w.fileTooLarge(MAX_UPLOAD_MB));
      return;
    }
    setUploading(true);
    try {
      const { fileId } = await api.uploadFile(kind, file);
      onChange({ fileId, fileName: file.name });
    } catch {
      setError(w.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-brand bg-brand-soft px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-dark text-white">
          <Check className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{title}</div>
          <div className="truncate text-xs text-ink-muted">{value.fileName}</div>
        </div>
        <button onClick={() => onChange(null)} className="text-status-rejected hover:opacity-70" aria-label="remove">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
      <button
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-start transition hover:border-brand disabled:opacity-70"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">
            {title} {optional && <span className="font-normal text-ink-faint">({optional})</span>}
          </div>
          {subtitle && <div className="text-xs text-ink-muted">{subtitle}</div>}
          <div className="text-xs text-ink-faint">{uploading ? w.uploading : w.clickToUpload}</div>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream text-ink-muted">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </span>
      </button>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-status-rejected">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
