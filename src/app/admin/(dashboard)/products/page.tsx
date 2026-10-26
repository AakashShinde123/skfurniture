import { Suspense } from "react";
import { ProductsTable } from "@/components/admin/products-table";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Products</h1>
        <p className="text-sm text-muted-foreground">
          Add, edit, publish and organise everything customers see in the catalogue.
        </p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
        <ProductsTable />
      </Suspense>
    </div>
  );
}
