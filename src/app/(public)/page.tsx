import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/public/reveal";
import { HeroBanner } from "@/components/public/hero-banner";
import { UspStrip } from "@/components/public/usp-strip";
import { CategoryGrid } from "@/components/public/category-grid";
import { ProductCard } from "@/components/public/product-card";
import { CraftSection } from "@/components/public/craft-section";
import { ProcessSection } from "@/components/public/process-section";
import { TrustSection } from "@/components/public/trust-section";
import { ShowroomBanner } from "@/components/public/showroom-banner";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { listCategories } from "@/services/category.service";
import { listPublicProducts } from "@/services/product.service";
import { getSettings } from "@/services/settings.service";

/**
 * Render per-request: the homepage is CMS-driven, and the production build
 * must never touch the database (no DATABASE_URL at build time on Netlify).
 */
export const dynamic = "force-dynamic";

/**
 * Homepage — premium section order:
 * hero (+stats) → promises strip → shop-by-room → bestsellers
 * → craftsmanship story → process → showroom → why-us → testimonials.
 */
export default async function HomePage() {
  const [settings, categories, featured] = await Promise.all([
    getSettings(),
    listCategories({ withCounts: true }),
    listPublicProducts({ featuredOnly: true, pageSize: 6 }),
  ]);

  const bestsellers = featured.items.length > 0 ? featured.items : (await listPublicProducts({ pageSize: 6 })).items;

  return (
    <>
      <HeroBanner
        headline={settings.heroHeadline}
        subtitle={settings.heroSubtitle}
        imageUrl={settings.heroImageUrl}
        ctaText={settings.heroCtaText}
        ctaLink={settings.heroCtaLink}
        stats={settings.heroStats}
      />

      <UspStrip />

      <CategoryGrid categories={categories} />

      {bestsellers.length > 0 ? (
        <section className="border-t border-border bg-secondary/30 py-16 sm:py-24" aria-labelledby="bestsellers-heading">
          <div className="container-site">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-muted-foreground">Loved by our customers</p>
                <h2 id="bestsellers-heading" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                  Bestsellers &amp; New Arrivals
                </h2>
              </div>
              <Link
                href="/catalogue"
                className="group inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary"
              >
                Browse full catalogue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {bestsellers.map((product, index) => (
                <Reveal key={product.id} delay={Math.min(index, 3) * 90}>
                  <ProductCard product={product} settings={settings} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CraftSection shopName={settings.shopName} images={settings.showroomImages} />

      <ProcessSection />

      <ShowroomBanner
        shopName={settings.shopName}
        address={settings.address}
        showroomImages={settings.showroomImages}
      />

      <TrustSection />

      <TestimonialsSection testimonials={settings.testimonialsEnabled ? settings.testimonials : []} />
    </>
  );
}
