import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import { DEFAULT_HERO_STATS, type HeroStat } from "@/types";

/**
 * Homepage hero — full-height photography with an espresso overlay, serif
 * headline, gold eyebrow and a stats strip. Content (including the stats)
 * comes from CMS settings so the owner can change it without code.
 */

export function HeroBanner({
  headline,
  subtitle,
  imageUrl,
  ctaText,
  ctaLink,
  stats = DEFAULT_HERO_STATS,
}: {
  headline: string;
  subtitle: string;
  imageUrl: string | null;
  ctaText: string;
  ctaLink: string;
  stats?: HeroStat[];
}) {
  const image = mediaUrl(imageUrl);

  return (
    <section className="relative isolate overflow-hidden bg-espresso text-ivory">
      {image ? (
        <img
          src={image}
          alt="Furniture showcase — featured living room setup"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso/95 via-espresso/70 to-espresso/20" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-espresso/80 to-transparent" />

      <div className="container-site flex min-h-[600px] flex-col justify-center pt-16 pb-10 sm:min-h-[660px] lg:min-h-[86vh]">
        <div className="animate-fade-up flex items-center gap-4">
          <span className="h-px w-12 bg-gold" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold sm:text-xs">
            Est. 1998 · Crafted in Mumbai
          </p>
        </div>

        <h1
          className="animate-fade-up mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[4.25rem]"
          style={{ animationDelay: "120ms" }}
        >
          {headline}
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg"
          style={{ animationDelay: "240ms" }}
        >
          {subtitle}
        </p>

        <div
          className="animate-fade-up mt-9 flex flex-wrap items-center gap-4"
          style={{ animationDelay: "360ms" }}
        >
          <Link
            href={ctaLink || "/catalogue"}
            className="inline-flex h-12 items-center gap-2.5 bg-ivory px-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-espresso transition-colors hover:bg-gold"
          >
            {ctaText}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center border border-ivory/40 px-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:border-gold hover:text-gold"
          >
            Visit Showroom
          </Link>
        </div>

        {/* Stats strip — hidden entirely when the owner removes all stats in the CMS */}
        {stats.length > 0 ? (
          <dl
            className="animate-fade-up mt-16 grid grid-cols-2 gap-y-6 border-t border-ivory/15 pt-7 sm:grid-cols-4 lg:mt-20"
            style={{ animationDelay: "480ms" }}
          >
            {stats.map((stat, index) => (
              <div
                key={`${stat.label}-${index}`}
                className={
                  "flex flex-col " +
                  (index > 0
                    ? "sm:border-l sm:border-ivory/15 sm:pl-6 lg:pl-8"
                    : "")
                }
              >
                <dd className="order-1 font-display text-2xl font-semibold text-ivory sm:text-3xl">
                  {stat.value}
                </dd>
                <dt className="order-2 mt-1.5 text-[11px] uppercase tracking-[0.18em] text-ivory/55 sm:text-xs">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
