import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, PackageX, Ruler, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/public/product-gallery";
import { ProductCard } from "@/components/public/product-card";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { formatPrice } from "@/lib/constants";
import { mediaUrl } from "@/lib/media";
import { buildMetadata } from "@/lib/seo";
import { buildProductEnquiryUrl } from "@/lib/whatsapp";
import { getPublicProductBySlug, getRelatedProducts } from "@/services/product.service";
import { getSettings } from "@/services/settings.service";
import { NotFoundError } from "@/lib/errors";
import type { Metadata } from "next";

/** CMS-driven page (live draft/publish state): render per-request. */
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Product detail page (PRD Page 3). Draft/unpublished products return a real
 * 404 here — the catalogue is public by default, private by exception.
 */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getPublicProductBySlug(slug);
    return buildMetadata({
      title: product.seoTitle ?? `${product.name} — ${product.sku}`,
      description:
        product.seoDescription ?? product.shortDescription ?? `Enquire about ${product.name} on WhatsApp.`,
      path: `/products/${product.slug}`,
      images: product.primaryImage ? [product.primaryImage.imageKey] : undefined,
    });
  } catch {
    return buildMetadata({ title: "Product not found", noIndex: true });
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getPublicProductBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [settings, related] = await Promise.all([getSettings(), getRelatedProducts(product)]);

  const price = formatPrice(product.price);
  const whatsappHref = buildProductEnquiryUrl({
    number: settings.whatsappNumber,
    product: { name: product.name, sku: product.sku, price: product.price, slug: product.slug },
  });

  const dimensionsText = product.dimensions
    ? [
        product.dimensions.width ? `W ${product.dimensions.width}` : null,
        product.dimensions.depth ? `D ${product.dimensions.depth}` : null,
        product.dimensions.height ? `H ${product.dimensions.height}` : null,
      ]
        .filter(Boolean)
        .join(" × ") + ` ${product.dimensions.unit}`
    : null;

  return (
    <div className="container-site py-8 sm:py-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href="/catalogue" className="hover:text-primary">Catalogue</Link>
        {product.categorySlug ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href={`/catalogue?category=${product.categorySlug}`} className="hover:text-primary">
              {product.categoryName}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>
              {product.availability === "AVAILABLE" ? (
                <span className="flex items-center gap-1 text-sm font-medium text-[#128C4B]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> In stock
                </span>
              ) : product.availability === "MADE_TO_ORDER" ? (
                <span className="flex items-center gap-1 text-sm font-medium text-accent-foreground">
                  <Truck className="h-4 w-4" aria-hidden /> Made to order
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <PackageX className="h-4 w-4" aria-hidden /> Currently unavailable
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{product.name}</h1>
            {product.shortDescription ? (
              <p className="mt-3 text-lg text-muted-foreground">{product.shortDescription}</p>
            ) : null}
          </div>

          {/* Price block */}
          <div className="flex flex-wrap items-baseline gap-3">
            {price ? (
              <>
                <span className="font-display text-4xl font-bold text-primary">{price}</span>
                {product.originalPrice && product.originalPrice > (product.price ?? 0) ? (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <Badge className="bg-primary text-primary-foreground">
                      Save {formatPrice(product.originalPrice - (product.price ?? 0))}
                    </Badge>
                  </>
                ) : null}
              </>
            ) : (
              <span className="text-xl font-medium">Enquire for price</span>
            )}
          </div>

          <WhatsAppButton href={whatsappHref} size="lg" className="w-full sm:w-auto" />

          {/* Specifications */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Specifications</h2>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <SpecRow label="Product code" value={product.sku} />
              <SpecRow label="Category" value={product.categoryName ?? null} />
              {dimensionsText ? (
                <SpecRow label="Dimensions" value={dimensionsText} icon={<Ruler className="h-3.5 w-3.5" />} />
              ) : null}
              <SpecRow label="Material" value={product.material} />
              <SpecRow label="Finish" value={product.finish} />
              <SpecRow label="Colours" value={product.colours.length ? product.colours.join(", ") : null} />
            </dl>
            {product.description ? (
              <>
                <Separator className="my-5" />
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </>
            ) : null}
            {product.deliveryInfo ? (
              <>
                <Separator className="my-5" />
                <p className="flex items-start gap-2 text-sm">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{product.deliveryInfo}</span>
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 ? (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6 font-display text-2xl font-semibold">
            You May Also Like
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} settings={settings} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SpecRow({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">
        {icon ? <span className="mr-1 inline-flex translate-y-0.5">{icon}</span> : null}
        {value}
      </dd>
    </div>
  );
}
