import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "./whatsapp-button";
import { buildProductEnquiryUrl } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/constants";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { ProductDto, SiteSettingsDto } from "@/types";

/**
 * Catalogue product card — 4:5 image (PRD §4), name, price (or
 * "Enquire for price"), availability badge and a WhatsApp enquiry button.
 */

const AVAILABILITY_LABELS: Record<ProductDto["availability"], string> = {
  AVAILABLE: "In stock",
  UNAVAILABLE: "Currently unavailable",
  MADE_TO_ORDER: "Made to order",
};

export function ProductCard({
  product,
  settings,
  className,
}: {
  product: ProductDto;
  settings: SiteSettingsDto;
  className?: string;
}) {
  const price = formatPrice(product.price);
  const discount =
    product.price && product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const whatsappHref = buildProductEnquiryUrl({
    number: settings.whatsappNumber,
    product: {
      name: product.name,
      sku: product.sku,
      price: product.price,
      slug: product.slug,
    },
  });

  return (
    <article className={cn("group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-secondary"
        aria-label={`View ${product.name}`}
      >
        {product.primaryImage ? (
          // Plain <img>: images are served through the storage abstraction at
          // runtime; optimisation happens at upload time (WebP pipeline).
           
          <img
            src={mediaUrl(product.primaryImage.imageKey) ?? ""}
            alt={product.primaryImage.altText ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden />
          </span>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount ? (
            <Badge className="bg-primary text-primary-foreground border-0">Save {discount}%</Badge>
          ) : null}
          {product.isFeatured ? (
            <Badge variant="outline" className="bg-background/85 backdrop-blur border-accent text-accent-foreground">
              Bestseller
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div>
          {product.categoryName ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{product.categoryName}</p>
          ) : null}
          <h3 className="mt-1 font-display text-[17px] font-semibold leading-snug">
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-primary">
              {product.name}
            </Link>
          </h3>
        </div>

        {product.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.shortDescription}</p>
        ) : null}

        <div className="mt-auto flex items-baseline gap-2">
          {price ? (
            <>
              <span className="font-display text-xl font-bold text-primary">{price}</span>
              {product.originalPrice && product.originalPrice > (product.price ?? 0) ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-sm font-medium text-foreground">Enquire for price</span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-border pt-3.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em]",
              product.availability === "AVAILABLE" && "text-[#128C4B]",
              product.availability === "UNAVAILABLE" && "text-muted-foreground",
              product.availability === "MADE_TO_ORDER" && "text-accent-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                product.availability === "AVAILABLE" && "bg-[#25D366]",
                product.availability === "UNAVAILABLE" && "bg-muted-foreground/50",
                product.availability === "MADE_TO_ORDER" && "bg-accent-foreground/70",
              )}
              aria-hidden
            />
            {AVAILABILITY_LABELS[product.availability]}
          </span>
          <WhatsAppButton href={whatsappHref} size="sm" label="Enquire" />
        </div>
      </div>
    </article>
  );
}
