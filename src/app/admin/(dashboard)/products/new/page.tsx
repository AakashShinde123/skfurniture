import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { getSettings } from "@/services/settings.service";

export default async function NewProductPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Back to products
        </Link>
        <h1 className="font-display text-2xl font-semibold">Add product</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below — you can save as a draft and publish when the photos are ready.
        </p>
      </div>
      <ProductForm shopName={settings.shopName} />
    </div>
  );
}
