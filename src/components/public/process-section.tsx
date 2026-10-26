import { MessagesSquare, PencilRuler, Hammer, Truck } from "lucide-react";
import { Reveal } from "./reveal";

/**
 * Ordering process — four numbered steps from first WhatsApp message to
 * free home assembly. Serif numerals + gold hairlines, no imagery needed.
 */
const STEPS = [
  {
    icon: MessagesSquare,
    title: "Tell Us What You Need",
    text: "Send us a photo, a size or just an idea on WhatsApp. We reply with suitable designs and honest pricing the same day.",
  },
  {
    icon: PencilRuler,
    title: "Visit or Finalise Online",
    text: "See and feel the furniture in our showroom, or finalise fabric, wood and size from home — whatever suits you.",
  },
  {
    icon: Hammer,
    title: "We Craft It",
    text: "Your piece is built to order by our artisans from seasoned solid wood, typically ready in 2–4 weeks.",
  },
  {
    icon: Truck,
    title: "Free Delivery & Setup",
    text: "We deliver fully assembled, place it in your home and clean up after. You simply enjoy it.",
  },
] as const;

export function ProcessSection() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="process-heading">
      <div className="container-site">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-muted-foreground">Simple & transparent</p>
          <h2 id="process-heading" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            From Our Workshop to Your Home
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            No app, no account, no checkout maze. Four steps — and a real person from our shop
            talks to you at every one of them.
          </p>
        </Reveal>

        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 110}>
                <div className="flex items-center gap-4">
                  <span className="font-display text-4xl font-semibold text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <span className="flex h-10 w-10 items-center justify-center border border-gold/50 bg-accent/25 text-primary">
                    <step.icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
