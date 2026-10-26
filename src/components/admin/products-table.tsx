"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Eye,
  EyeOff,
  ImageOff,
  MoreHorizontal,
  PackageX,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/constants";
import { mediaUrl } from "@/lib/media";
import { useAdminProducts, useDeleteProduct, useDuplicateProduct, useSetAvailability, useSetProductStatus } from "@/hooks/admin/use-products";
import type { ProductDto } from "@/types";

/**
 * Admin product list — search, status/availability filters and the full
 * action set: edit, preview, publish/unpublish, availability toggle,
 * duplicate and delete (with confirmation).
 */

const PAGE_SIZE = 15;

export function ProductsTable() {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductDto["status"] | "ALL">(
    searchParams.get("status") === "PUBLISHED" || searchParams.get("status") === "DRAFT"
      ? (searchParams.get("status") as ProductDto["status"])
      : "ALL",
  );
  const [availability, setAvailability] = useState<ProductDto["availability"] | "ALL">(
    searchParams.get("availability") === "UNAVAILABLE" ? "UNAVAILABLE" : "ALL",
  );
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isPending, isFetching } = useAdminProducts({
    search: search || undefined,
    status,
    availability,
    page,
    pageSize: PAGE_SIZE,
    sort: "newest",
  });

  const setStatusMutation = useSetProductStatus();
  const duplicateMutation = useDuplicateProduct();
  const deleteMutation = useDeleteProduct();
  const availabilityMutation = useSetAvailability();

  const togglePublish = (product: ProductDto) =>
    setStatusMutation.mutate({
      id: product.id,
      status: product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
    });

  const toggleAvailability = (product: ProductDto) =>
    availabilityMutation.mutate({
      id: product.id,
      availability: product.availability === "UNAVAILABLE" ? "AVAILABLE" : "UNAVAILABLE",
    });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name or SKU…"
              className="pl-9"
              aria-label="Search products"
            />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value as ProductDto["status"] | "ALL"); setPage(1); }}>
            <SelectTrigger className="sm:w-[160px]" aria-label="Filter by publication status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={availability} onValueChange={(value) => { setAvailability(value as ProductDto["availability"] | "ALL"); setPage(1); }}>
            <SelectTrigger className="sm:w-[170px]" aria-label="Filter by availability">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any availability</SelectItem>
              <SelectItem value="AVAILABLE">In stock</SelectItem>
              <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
              <SelectItem value="MADE_TO_ORDER">Made to order</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" aria-hidden /> Add product
          </Link>
        </Button>
      </div>

      {/* Table */}
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-display text-lg font-semibold">No products found</p>
          <p className="text-sm text-muted-foreground">
            {search || status !== "ALL" || availability !== "ALL"
              ? "Try clearing the search or filters."
              : "Add your first product to start building the catalogue."}
          </p>
        </div>
      ) : (
        <div className={`rounded-xl border border-border bg-card ${isFetching ? "opacity-70" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-12 w-12 overflow-hidden rounded-lg border border-border bg-secondary">
                      {product.primaryImage ? (
                         
                        <img
                          src={mediaUrl(product.primaryImage.imageKey) ?? ""}
                          alt={product.primaryImage.altText ?? product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${product.id}/edit`} className="font-medium hover:text-primary">
                      {product.name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {product.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatPrice(product.price) ?? <span className="text-muted-foreground">Enquire</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={
                          product.status === "PUBLISHED"
                            ? "w-fit border-[#25D366]/40 text-[#128C4B]"
                            : "w-fit border-amber-500/40 text-amber-600"
                        }
                      >
                        {product.status === "PUBLISHED" ? "Live" : "Draft"}
                      </Badge>
                      {product.availability === "UNAVAILABLE" ? (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      ) : product.availability === "MADE_TO_ORDER" ? (
                        <span className="text-xs text-muted-foreground">Made to order</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">In stock</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${product.name}`}>
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4" aria-hidden /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <Eye className="h-4 w-4" aria-hidden /> Preview page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(product)}>
                          {product.status === "PUBLISHED" ? (
                            <>
                              <EyeOff className="h-4 w-4" aria-hidden /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" aria-hidden /> Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAvailability(product)}>
                          {product.availability === "UNAVAILABLE" ? (
                            <>
                              <PackageCheck className="h-4 w-4" aria-hidden /> Mark available
                            </>
                          ) : (
                            <>
                              <PackageX className="h-4 w-4" aria-hidden /> Mark unavailable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(product.id)}>
                          <Copy className="h-4 w-4" aria-hidden /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(product)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden /> Delete…
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                {data.total} product{data.total === 1 ? "" : "s"} · page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the product and its photos from the catalogue. The public
              website will stop showing it immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id, {
                  onSettled: () => setDeleteTarget(null),
                });
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
