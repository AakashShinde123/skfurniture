import { Check } from "lucide-react";
import { Reveal } from "./reveal";
import { mediaUrl } from "@/lib/media";

/**
 * Brand story / craftsmanship — dark espresso panel with an image collage,
 * the shop's promise in words, a checklist and headline numbers.
 */
const CRAFT_POINTS = [
  "Seasoned sheesham, teak & mango wood — never particle board",
  "Traditional joinery, hand-sanded and finished in our workshop",
  "Every piece inspected three times before it leaves us",
] as const;

const CRAFT_STATS = [
  { value: "1998", label: "Family workshop" },
  { value: "25+", label: "In-house artisans" },
  { value: "3×", label: "Quality checks" },
] as const;

export function CraftSection({
  shopName,
  images,
}: {
  shopName: string;
  images: string[];
}) {
  const first = images[0] ? mediaUrl(images[0]) : null;
  const second = images[1] ? mediaUrl(images[1]) : null;

  return (
    <section className="bg-espresso py-16 text-ivory sm:py-24" aria-labelledby="craft-heading">
      <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Copy */}
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-gold" aria-hidden />
            <p className="eyebrow text-gold">Our Craft</p>
          </div>
          <h2 id="craft-heading" className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">
            Furniture Built the Way It Used to Be
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-ivory/70">
            {shopName} is not a warehouse or a marketplace. We are a family workshop — the same
            carpenters who started with two benches in 1998 still oversee every frame that leaves
            our floor. No middlemen, no factory shortcuts, no veneer pretending to be wood.
          </p>
          <ul className="mt-7 space-y-3.5">
            {CRAFT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-ivory/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-gold/60 text-gold">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <dl className="mt-9 grid grid-cols-3 gap-6 border-t border-ivory/15 pt-7">
            {CRAFT_STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-2xl font-semibold text-gold sm:text-3xl">{stat.value}</dd>
                <dt className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ivory/50 sm:text-xs">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Collage */}
        <Reveal delay={140}>
          <div className="relative mx-auto grid w-full max-w-lg grid-cols-5 grid-rows-5 gap-3 lg:max-w-none">
            <span className="absolute -left-3 -top-3 h-24 w-24 border-l border-t border-gold/50" aria-hidden />
            <span className="absolute -bottom-3 -right-3 h-24 w-24 border-b border-r border-gold/50" aria-hidden />
            {first ? (
              <img
                src={first}
                alt={`${shopName} workshop — artisan at work`}
                loading="lazy"
                className="col-span-4 row-span-4 aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="col-span-4 row-span-4 bg-ivory/10" />
            )}
            {second ? (
              <img
                src={second}
                alt={`${shopName} showroom detail`}
                loading="lazy"
                className="col-span-3 col-start-3 row-span-3 row-start-3 aspect-[4/3] w-full border-4 border-espresso object-cover shadow-2xl"
              />
            ) : (
              <div className="col-span-3 col-start-3 row-span-3 row-start-3 bg-ivory/5" />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
