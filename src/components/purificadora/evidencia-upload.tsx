"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, X, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EvidenciaUploadProps {
  value: string | null;
  onChange: (path: string | null) => void;
}

const MAX_DIMENSION = 1600;
const QUALITY = 0.78;

async function comprimirImagen(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height / width) * MAX_DIMENSION);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width / height) * MAX_DIMENSION);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("compresion fallida"))),
      "image/jpeg",
      QUALITY
    );
  });
}

export function EvidenciaUpload({ value, onChange }: EvidenciaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo imágenes (JPG, PNG, WEBP)");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const blob = await comprimirImagen(file);
      const supabase = createClient();
      const ext = "jpg";
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("evidencias")
        .upload(path, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (uploadErr) {
        setError(uploadErr.message);
        setUploading(false);
        return;
      }

      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  if (uploading) {
    return (
      <div className="w-full py-3 rounded-lg border border-sky-200 bg-sky-50 flex items-center justify-center gap-2 text-sm text-sky-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        Subiendo foto...
      </div>
    );
  }

  if (value) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-800">Foto adjuntada</p>
              <p className="text-xs text-green-700/70 truncate font-mono">{value.split("/").pop()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="h-8 w-8 flex items-center justify-center rounded-md text-green-700 hover:bg-green-100 transition-colors shrink-0"
            aria-label="Quitar foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full py-3 rounded-lg border border-dashed border-border hover:border-sky-300 hover:bg-sky-50/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <Camera className="h-4 w-4" />
        Tomar foto o seleccionar
        <ImageIcon className="h-3.5 w-3.5 opacity-60" />
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
