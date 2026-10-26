"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/admin/use-settings";

/** Recently updated products list for the dashboard. */
export function AdminRecentProducts() {
  const { data: stats, isPending } = useDashboardStats();

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Recently updated</h2>
        <Link href="/admin/products" className="text-sm text-primary hover:underline">
          View all →
        </Link>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : !stats || stats.recentProducts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No products yet — click “Add product” to create your first one.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {stats.recentProducts.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="block truncate text-sm font-medium hover:text-primary"
                >
                  {product.name}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">
                  {product.sku} · updated {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0",
                  product.status === "PUBLISHED"
                    ? "border-[#25D366]/40 text-[#128C4B]"
                    : "border-amber-500/40 text-amber-600",
                )}
              >
                {product.status === "PUBLISHED" ? "Live" : "Draft"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
