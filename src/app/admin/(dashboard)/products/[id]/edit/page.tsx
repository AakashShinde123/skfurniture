import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";
import { getProductById } from "@/services/product.service";
import { getSettings } from "@/services/settings.service";
import { NotFoundError } from "@/lib/errors";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product;
  try {
    product = await getProductById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden /> Back to products
          </Link>
          <h1 className="font-display text-2xl font-semibold">Edit product</h1>
          <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/products/${product.slug}`} target="_blank">
            <ExternalLink className="h-4 w-4" aria-hidden /> Preview on site
          </Link>
        </Button>
      </div>
      <ProductForm product={product} shopName={settings.shopName} />
    </div>
  );
}
