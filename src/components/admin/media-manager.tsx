"use client";

import { useRef, useState } from "react";
import { Copy, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MEDIA_MAX_BYTES, MEDIA_TYPES } from "@/lib/constants";
import { useManageMedia, useMediaLibrary, useUploadMedia } from "@/hooks/admin/use-settings";
import type { MediaAssetClientDto } from "@/hooks/admin/use-settings";

/**
 * Media library (PRD §5) — upload, preview, copy URL, fix alt text and
 * delete. Deleting an image that is still referenced by a product, category
 * or site setting is blocked server-side and explained in the toast.
 */
export function MediaManager() {
  const { data: assets, isPending } = useMediaLibrary();
  const uploadMutation = useUploadMedia();
  const manageMutation = useManageMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetClientDto | null>(null);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});

  const uploadFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!MEDIA_TYPES.allowed.includes(file.type)) {
        toast.error(`“${file.name}” — unsupported type (JPG, PNG or WebP only).`);
        continue;
      }
      if (file.size > MEDIA_MAX_BYTES) {
        toast.error(`“${file.name}” is over ${(MEDIA_MAX_BYTES / 1024 / 1024).toFixed(0)} MB.`);
        continue;
      }
      try {
        await uploadMutation.mutateAsync({ file, folder: "products" });
        toast.success(`“${file.name}” uploaded.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed.");
      }
    }
  };

  const copyUrl = async (asset: MediaAssetClientDto) => {
    const absolute = new URL(asset.url, window.location.origin).toString();
    await navigator.clipboard.writeText(absolute).then(
      () => toast.success("Image URL copied."),
      () => toast.error("Could not copy — your browser blocked clipboard access."),
    );
  };

  const saveAlt = (asset: MediaAssetClientDto) => {
    const draft = altDrafts[asset.key];
    if (draft === undefined) return;
    manageMutation.mutate({ action: "setAlt", key: asset.key, altText: draft.trim() || null });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {assets ? `${assets.length} image${assets.length === 1 ? "" : "s"} in the library` : "Loading library…"}
        </p>
        <Button onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          Upload images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={MEDIA_TYPES.allowed.join(",")}
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) void uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : !assets || assets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Upload className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-display text-lg font-semibold">No images yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Uploaded photos land here first; then attach them to products, the hero banner or categories.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <figure key={asset.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-square bg-secondary">
                { }
                <img src={asset.url} alt={asset.altText ?? asset.filename} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <figcaption className="space-y-2 p-3">
                <p className="truncate text-xs font-medium" title={asset.filename}>{asset.filename}</p>
                <p className="text-[11px] text-muted-foreground">
                  {asset.width && asset.height ? `${asset.width}×${asset.height} px · ` : ""}
                  {(asset.size / 1024).toFixed(0)} KB
                </p>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={altDrafts[asset.key] ?? asset.altText ?? ""}
                    onChange={(event) => setAltDrafts((drafts) => ({ ...drafts, [asset.key]: event.target.value }))}
                    placeholder="Alt text…"
                    className="h-8 text-xs"
                    aria-label={`Alt text for ${asset.filename}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => saveAlt(asset)}
                    disabled={manageMutation.isPending || altDrafts[asset.key] === undefined}
                  >
                    Save
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 flex-1 gap-1.5" onClick={() => void copyUrl(asset)}>
                    <Copy className="h-3 w-3" aria-hidden /> Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(asset)}
                    aria-label={`Delete ${asset.filename}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.filename}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Images still used by products or site settings are protected and cannot be deleted.
              Orphaned images are removed permanently — this cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (!deleteTarget) return;
                manageMutation.mutate(
                  { action: "delete", key: deleteTarget.key },
                  { onSettled: () => setDeleteTarget(null) },
                );
              }}
            >
              Delete image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
