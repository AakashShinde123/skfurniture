import { MapPin } from "lucide-react";
import { Reveal } from "./reveal";
import { mediaUrl } from "@/lib/media";

/**
 * Showroom / lifestyle banner — 4:3 imagery with an invitation to visit,
 * driven by CMS-managed showroom photos.
 */
export function ShowroomBanner({
  shopName,
  address,
  showroomImages,
}: {
  shopName: string;
  address: string;
  showroomImages: string[];
}) {
  const first = showroomImages[0] ? mediaUrl(showroomImages[0]) : null;
  const second = showroomImages[1] ? mediaUrl(showroomImages[1]) : null;

  return (
    <section className="container-site py-16 sm:py-24" aria-labelledby="showroom-heading">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <div className="relative mx-auto grid w-full max-w-lg grid-cols-5 grid-rows-5 gap-3 lg:max-w-none">
            <span className="absolute -left-3 -top-3 h-24 w-24 border-l border-t border-gold/60" aria-hidden />
            <span className="absolute -bottom-3 -right-3 h-24 w-24 border-b border-r border-gold/60" aria-hidden />
            {first ? (
              <img
                src={first}
                alt={`${shopName} showroom interior`}
                loading="lazy"
                className="col-span-4 row-span-4 aspect-[4/3] w-full object-cover shadow-md"
              />
            ) : (
              <div className="col-span-4 row-span-4 bg-secondary" />
            )}
            {second ? (
              <img
                src={second}
                alt={`${shopName} workshop craftsmanship`}
                loading="lazy"
                className="col-span-3 col-start-3 row-span-3 row-start-3 aspect-[4/3] w-full border-4 border-background object-cover shadow-lg"
              />
            ) : (
              <div className="col-span-3 col-start-3 row-span-3 row-start-3 bg-accent/50" />
            )}
          </div>
        </Reveal>

        <Reveal delay={120} className="order-1 lg:order-2">
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-gold" aria-hidden />
            <p className="eyebrow text-muted-foreground">Visit us</p>
          </div>
          <h2 id="showroom-heading" className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Feel the Wood Before You Buy
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            Photos are honest, but furniture is something you should sit on. Walk through our
            4,000 sq ft showroom, test the cushions, open every drawer and see the finish under
            real light. Chai is on us — pressure is not.
          </p>
          <p className="mt-6 flex items-start gap-2.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            {address}
          </p>
          <a
            href="/contact"
            className="mt-8 inline-flex h-12 items-center border border-primary/40 px-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Get Directions
          </a>
        </Reveal>
      </div>
    </section>
  );
}
