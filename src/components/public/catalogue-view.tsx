"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PackageSearch, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATALOGUE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import type { CategoryDto, Paginated, ProductDto, SiteSettingsDto } from "@/types";

/**
 * Interactive catalogue — search, category filter and sorting with
 * pagination.
 *
 * State management: filters live in the URL (shareable, back/forward safe),
 * server data lives in TanStack Query, and only the raw search-box value is
 * local component state (debounced into the URL).
 */

type SortValue = "newest" | "price-asc" | "price-desc" | "name-asc";

async function fetchProducts(params: Record<string, string>): Promise<Paginated<ProductDto>> {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/products?${query.toString()}`);
  const body = (await response.json()) as { data?: Paginated<ProductDto>; error?: { message?: string } };
  if (!response.ok || !body.data) {
    throw new Error(body.error?.message ?? "Could not load products.");
  }
  return body.data;
}

export function CatalogueView({
  categories,
  settings,
  initialCategory,
}: {
  categories: CategoryDto[];
  settings: SiteSettingsDto;
  initialCategory?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- URL-derived filter state -------------------------------------------
  const urlSearch = searchParams.get("search") ?? "";
  const urlCategory = initialCategory ?? searchParams.get("category") ?? "";
  const urlSort = ((): SortValue => {
    const value = searchParams.get("sort");
    return value === "price-asc" || value === "price-desc" || value === "name-asc" ? value : "newest";
  })();
  const urlPage = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  // --- Local search box (debounced into the URL) --------------------------
  const [searchInput, setSearchInput] = useState(urlSearch);

  const buildUrl = (patch: { search?: string; category?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    const search = patch.search ?? urlSearch;
    if (search) params.set("search", search);
    else params.delete("search");
    const category = patch.category ?? urlCategory;
    if (category) params.set("category", category);
    else params.delete("category");
    const sort = patch.sort ?? urlSort;
    if (sort !== "newest") params.set("sort", sort);
    else params.delete("sort");
    const page = patch.page ?? urlPage;
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    const queryString = params.toString();
    return queryString ? `/catalogue?${queryString}` : "/catalogue";
  };

  // Debounce typing → URL.
  useEffect(() => {
    if (searchInput === urlSearch) return;
    const timer = setTimeout(() => {
      router.replace(buildUrl({ search: searchInput, page: 1 }), { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
     
  }, [searchInput]);

  const setCategory = (slug: string) => router.replace(buildUrl({ category: slug, page: 1 }), { scroll: false });
  const setSort = (value: SortValue) => router.replace(buildUrl({ sort: value, page: 1 }), { scroll: false });
  const setPage = (page: number) => router.replace(buildUrl({ page }), { scroll: false });

  // --- Server state --------------------------------------------------------
  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["catalogue", urlSearch, urlCategory, urlSort, urlPage],
    queryFn: () =>
      fetchProducts({
        ...(urlSearch ? { search: urlSearch } : {}),
        ...(urlCategory ? { categorySlug: urlCategory } : {}),
        sort: urlSort,
        page: String(urlPage),
        pageSize: String(CATALOGUE.pageSize),
      }),
    placeholderData: (previous) => previous,
  });

  const items = data?.items ?? [];
  const selectedCategory = categories.find((category) => category.slug === urlCategory);
  const hasFilters = Boolean(urlSearch || urlCategory);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search furniture, materials or product code…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <div className="flex gap-3">
          <Select value={urlCategory || "all"} onValueChange={(value) => setCategory(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full md:w-[200px]" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urlSort} onValueChange={(value) => setSort(value as SortValue)}>
            <SelectTrigger className="w-full md:w-[180px]" aria-label="Sort products">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATALOGUE.sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p aria-live="polite">
          {isPending
            ? "Loading furniture…"
            : isError
              ? "Something went wrong loading products."
              : `${data?.total ?? 0} product${data?.total === 1 ? "" : "s"}${selectedCategory ? ` in ${selectedCategory.name}` : ""}${urlSearch ? ` matching “${urlSearch}”` : ""}`}
        </p>
        {isFetching && !isPending ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Updating…
          </span>
        ) : null}
      </div>

      {/* Grid */}
      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="aspect-[4/5] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">{(error as Error).message}</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <PackageSearch className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-display text-lg font-semibold">No furniture matches your filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different search term or browse all categories — new pieces are added regularly.
          </p>
          {hasFilters ? (
            <Button variant="outline" onClick={() => router.replace("/catalogue")}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", isFetching && "opacity-70 transition-opacity")}>
            {items.map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" disabled={urlPage <= 1 || isFetching} onClick={() => setPage(urlPage - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button variant="outline" disabled={urlPage >= data.totalPages || isFetching} onClick={() => setPage(urlPage + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
