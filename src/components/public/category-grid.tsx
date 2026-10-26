import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { CategoryDto } from "@/types";

/**
 * Homepage category tiles — tall (4:5) photography, serif labels and a gold
 * underline reveal on hover, linking into the filtered catalogue.
 */
export function CategoryGrid({ categories }: { categories: CategoryDto[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="container-site py-16 sm:py-24" aria-labelledby="categories-heading">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">Shop by room</p>
          <h2 id="categories-heading" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Explore Our Collections
          </h2>
        </div>
        <Link
          href="/catalogue"
          className="group inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary"
        >
          View all furniture
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {categories.slice(0, 8).map((category, index) => (
          <Reveal key={category.id} delay={Math.min(index, 4) * 90}>
            <Link
              href={`/catalogue?category=${category.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-secondary"
              aria-label={`Browse ${category.name}`}
            >
              {category.imageUrl ? (
                <img
                  src={mediaUrl(category.imageUrl) ?? ""}
                  alt={category.description ?? `${category.name} collection`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-accent/60 font-display text-2xl font-semibold text-accent-foreground">
                  {category.name.split(" ")[0]}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="font-display text-base font-semibold text-white sm:text-lg">{category.name}</h3>
                <p
                  className={cn(
                    "mt-1 text-xs uppercase tracking-[0.16em] text-white/60",
                    category.productCount ? "" : "hidden",
                  )}
                >
                  {category.productCount} piece{category.productCount === 1 ? "" : "s"}
                </p>
                <span
                  className="mt-3 block h-px w-8 bg-gold transition-all duration-500 group-hover:w-16"
                  aria-hidden
                />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
