"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MEDIA_MAX_BYTES, MEDIA_TYPES } from "@/lib/constants";
import { mediaUrl } from "@/lib/media";
import { useUploadMedia } from "@/hooks/admin/use-settings";
import { cn } from "@/lib/utils";

/**
 * Gallery editor used by the product form.
 *
 * - Accepts JPG / PNG / WebP with a client-side size pre-check (mirrored
 *   server-side).
 * - Uploads through the optimisation pipeline, then stores the returned key.
 * - First image is the primary (catalogue) image; images can be reordered
 *   and removed before saving.
 */

export interface GalleryImage {
  imageKey: string;
  altText: string;
  isPrimary: boolean;
}

interface ImageUploaderProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const uploadMutation = useUploadMedia();

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      if (!MEDIA_TYPES.allowed.includes(file.type)) {
        toast.error(`“${file.name}” is not a supported image (use JPG, PNG or WebP).`);
        continue;
      }
      if (file.size > MEDIA_MAX_BYTES) {
        toast.error(`“${file.name}” is too large — maximum ${(MEDIA_MAX_BYTES / 1024 / 1024).toFixed(0)} MB.`);
        continue;
      }
      try {
        const asset = await uploadMutation.mutateAsync({ file, folder: "products" });
        onChange([
          ...value,
          {
            imageKey: asset.key,
            altText: "",
            isPrimary: value.length === 0,
          },
        ]);
        toast.success(`“${file.name}” uploaded.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed.");
      }
    }
  };

  const updateAt = (index: number, patch: Partial<GalleryImage>) => {
    onChange(value.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  };

  const removeAt = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((image) => image.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    // Primary status follows the first slot for a stable "first = cover" rule.
    onChange(next.map((image, i) => ({ ...image, isPrimary: i === 0 })));
  };

  const setPrimary = (index: number) => {
    onChange(value.map((image, i) => ({ ...image, isPrimary: i === index })));
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40",
          dragOver && "border-primary bg-secondary/60",
        )}
      >
        {uploadMutation.isPending ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
        )}
        <p className="text-sm font-medium">
          {uploadMutation.isPending ? "Optimising & uploading…" : "Click or drop images here"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP · up to {(MEDIA_MAX_BYTES / 1024 / 1024).toFixed(0)} MB · first image becomes the cover
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={MEDIA_TYPES.allowed.join(",")}
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        Recommended: product cards 1200×1500 px (4:5) · keep the full furniture item in frame with a
        clean, consistent background. Images are auto-optimised to WebP on upload.
      </p>

      {value.length > 0 ? (
        <ul className="space-y-3">
          {value.map((image, index) => (
            <li
              key={`${image.imageKey}-${index}`}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                { }
                <img
                  src={mediaUrl(image.imageKey) ?? ""}
                  alt={image.altText || `Gallery image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  value={image.altText}
                  onChange={(event) => updateAt(index, { altText: event.target.value })}
                  placeholder={`Alt text (e.g. “Walnut 3-seater sofa, front view”)`}
                  aria-label={`Alt text for image ${index + 1}`}
                />
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant={image.isPrimary ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setPrimary(index)}
                    disabled={image.isPrimary}
                  >
                    <Star className={cn("h-3.5 w-3.5", image.isPrimary && "fill-amber-400 text-amber-400")} aria-hidden />
                    {image.isPrimary ? "Cover photo" : "Set as cover"}
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move image up">
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label="Move image down">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="ml-auto h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeAt(index)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          No images yet — a product needs at least one photo before it looks right on the site.
        </p>
      )}
    </div>
  );
}
