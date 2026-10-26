"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileEdit,
  Images,
  Package,
  PackageX,
  Plus,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { AdminRecentProducts } from "@/components/admin/recent-products";
import { useDashboardStats } from "@/hooks/admin/use-settings";

/**
 * CMS dashboard (PRD §5) — catalogue counters, quick add action and the
 * recently updated list. Rendered as a client component so stats refresh
 * after mutations without a full page reload.
 */
export default function AdminDashboardPage() {
  const { data: stats, isPending, isError } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your catalogue and website content.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" aria-hidden /> Add product
          </Link>
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError || !stats ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Could not load dashboard statistics. Please refresh the page.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total products"
              value={stats.totalProducts}
              icon={<Package className="h-5 w-5" aria-hidden />}
              href="/admin/products"
            />
            <StatCard
              label="Published"
              value={stats.published}
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
              href="/admin/products?status=PUBLISHED"
              tone="success"
            />
            <StatCard
              label="Drafts"
              value={stats.drafts}
              icon={<FileEdit className="h-5 w-5" aria-hidden />}
              href="/admin/products?status=DRAFT"
              tone="warning"
            />
            <StatCard
              label="Unavailable"
              value={stats.unavailable}
              icon={<PackageX className="h-5 w-5" aria-hidden />}
              href="/admin/products?availability=UNAVAILABLE"
              tone="danger"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AdminRecentProducts />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 font-display text-lg font-semibold">Quick actions</h2>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link href="/admin/products/new">
                      <Plus className="h-4 w-4" aria-hidden /> Add a new product
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link href="/admin/categories">
                      <Tags className="h-4 w-4" aria-hidden /> Manage categories
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link href="/admin/media">
                      <Images className="h-4 w-4" aria-hidden /> Upload images
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-2 font-display text-lg font-semibold">Library</h2>
                <p className="flex items-center justify-between text-sm text-muted-foreground">
                  Images uploaded
                  <Badge variant="secondary">{stats.mediaCount}</Badge>
                </p>
                <p className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  Active categories
                  <Badge variant="secondary">{stats.categories}</Badge>
                </p>
                <Link
                  href="/admin/settings"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Website settings <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
