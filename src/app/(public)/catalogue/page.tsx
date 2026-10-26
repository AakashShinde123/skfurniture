import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogueView } from "@/components/public/catalogue-view";
import { buildMetadata } from "@/lib/seo";
import { listCategories } from "@/services/category.service";
import { getSettings } from "@/services/settings.service";
import type { Metadata } from "next";

/** CMS-driven shell and grid: render per-request, never at build time. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata({
    title: `Furniture Catalogue — ${settings.shopName}`,
    description: `Browse our full range of sofas, beds, wardrobes, dining sets and more. Filter by category, compare prices and enquire on WhatsApp. — ${settings.shopName}`,
    path: "/catalogue",
  });
}

/**
 * Catalogue page (PRD Page 2). Server shell fetches categories/settings;
 * the interactive grid (search, filter, sort, pagination) renders client-side.
 */
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, categories, settings] = await Promise.all([
    searchParams,
    listCategories(),
    getSettings(),
  ]);

  return (
    <div className="container-site py-10 sm:py-12">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Our collection</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Furniture Catalogue</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Every piece below is available in our Mumbai showroom. Spot something you like? Send a
          WhatsApp enquiry with the product code and we will confirm availability, colour options and
          delivery — usually within the hour during shop hours.
        </p>
      </header>

      <Suspense fallback={<CatalogueSkeleton />}>
        <CatalogueView categories={categories} settings={settings} initialCategory={category} />
      </Suspense>
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
