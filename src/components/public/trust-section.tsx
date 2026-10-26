import { Handshake, ShieldCheck, Truck, Wrench } from "lucide-react";
import { Reveal } from "./reveal";

/**
 * "Why choose us" trust points — static content by design: these are the
 * shop's real differentiators (solid wood, warranty, delivery, custom work).
 * Rendered as numbered cards on a warm sand band.
 */
const TRUST_POINTS = [
  {
    icon: Wrench,
    title: "In-house craftsmanship",
    text: "Every piece is built and finished by our own artisans — no third-party assembly lines, no veneer pretending to be wood.",
  },
  {
    icon: ShieldCheck,
    title: "5-year workmanship warranty",
    text: "Solid wood, kiln-seasoned frames and three quality checks before delivery. If something fails on our workmanship, we fix it free.",
  },
  {
    icon: Truck,
    title: "Free local delivery & assembly",
    text: "Delivered fully assembled across Mumbai, Thane and Navi Mumbai. Knock-down designs are assembled in your home by our team.",
  },
  {
    icon: Handshake,
    title: "Custom sizes welcome",
    text: "Odd corners, low ceilings, specific fabrics — share your measurements on WhatsApp and we build furniture around your space.",
  },
] as const;

export function TrustSection() {
  return (
    <section className="border-y border-border bg-secondary/45 py-16 sm:py-24" aria-labelledby="why-heading">
      <div className="container-site">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow text-muted-foreground">Why shop with us</p>
          <h2 id="why-heading" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            The SK Furniture Promise
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Twenty-seven years of families coming back — and sending their neighbours. Here is
            what that looks like in practice.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((point, index) => (
            <Reveal key={point.title} delay={index * 100}>
              <article className="flex h-full flex-col border border-border bg-card p-7 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center border border-gold/50 bg-accent/25 text-primary">
                    <point.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-display text-2xl font-semibold text-accent-foreground/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold leading-snug">{point.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
