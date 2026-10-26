import { MediaManager } from "@/components/admin/media-manager";

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Media Library</h1>
        <p className="text-sm text-muted-foreground">
          Every photo you upload is optimised to WebP and stored once — attach it anywhere.
        </p>
      </div>
      <MediaManager />
    </div>
  );
}
