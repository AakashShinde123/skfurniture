import { Armchair, ShieldCheck, Truck, Wrench } from "lucide-react";

/**
 * Slim promises strip directly under the hero — the shop's four service
 * guarantees, rendered as an elegant hairline-ribboned band.
 */
const PROMISES = [
  { icon: Truck, title: "Free Delivery", text: "Across Mumbai, Thane & Navi Mumbai — assembled in your home" },
  { icon: ShieldCheck, title: "5-Year Warranty", text: "On every joint, frame and finish we make" },
  { icon: Armchair, title: "Custom Furniture", text: "Made to your size, fabric and wood preference" },
  { icon: Wrench, title: "In-house Craftsmen", text: "Our own artisans build, finish and sign every piece" },
] as const;

export function UspStrip() {
  return (
    <section aria-label="Our promises" className="border-b border-border bg-background">
      <div className="container-site grid grid-cols-1 gap-x-8 gap-y-7 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:py-12">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-gold/50 bg-accent/25 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
