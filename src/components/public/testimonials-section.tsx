import { Quote, Star } from "lucide-react";
import { Reveal } from "./reveal";
import type { Testimonial } from "@/types";

/**
 * Customer testimonials — rendered ONLY when the owner has enabled genuine
 * testimonials in CMS settings (PRD §4, homepage section 8).
 */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="border-t border-border bg-secondary/45 py-16 sm:py-24" aria-labelledby="testimonials-heading">
      <div className="container-site">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow text-muted-foreground">Happy homes</p>
          <h2 id="testimonials-heading" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Real words from families across Mumbai — collected on WhatsApp and Google reviews.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <Reveal key={`${testimonial.name}-${index}`} delay={index * 100}>
              <figure className="flex h-full flex-col gap-4 border border-border bg-card p-7">
                <Quote className="h-7 w-7 text-gold" aria-hidden />
                <blockquote className="flex-1 font-display text-[15px] leading-relaxed text-foreground/90">
                  “{testimonial.text}”
                </blockquote>
                <figcaption className="flex items-center justify-between gap-2 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {testimonial.area}
                    </p>
                  </div>
                  <span className="flex gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={
                          starIndex < testimonial.rating
                            ? "h-3.5 w-3.5 fill-gold text-gold"
                            : "h-3.5 w-3.5 text-muted-foreground/30"
                        }
                        aria-hidden
                      />
                    ))}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
