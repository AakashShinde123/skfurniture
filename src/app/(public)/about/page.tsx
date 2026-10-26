import { buildMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { getSettings } from "@/services/settings.service";
import { ShieldCheck, Wrench } from "lucide-react";
import type { Metadata } from "next";

/** CMS-driven page: render per-request, never at build time. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata({
    title: `About Us — ${settings.shopName}`,
    description: `${settings.shopName}: ${settings.tagline}. Visit our showroom or read our story of solid-wood craftsmanship.`,
    path: "/about",
  });
}

/**
 * About page (PRD Page 4) — shop story, experience and quality promise,
 * with CMS-managed showroom photography.
 */
export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="container-site py-10 sm:py-12">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">About us</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{settings.aboutTitle}</h1>
      </header>

      <div className="mx-auto mt-10 max-w-3xl space-y-5 text-[15px] leading-relaxed text-muted-foreground">
        {settings.aboutStory.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Quality promise */}
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wrench className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="font-display text-lg font-semibold">Our quality promise</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Only seasoned solid wood and BWP-grade ply enter our workshop. Every joint is glued and
            screwed — never just stapled — and each piece passes three inspection stages before it
            leaves for your home.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="font-display text-lg font-semibold">Experience you can trust</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Carpenters with over 20 years on the bench, hundreds of furnished homes across
            Maharashtra, and a simple rule: we do not deliver anything we would not keep in our
            own living rooms.
          </p>
        </div>
      </div>

      {/* Showroom gallery */}
      {settings.showroomImages.length > 0 ? (
        <section className="mt-14" aria-label="Showroom photographs">
          <h2 className="mb-6 text-center font-display text-2xl font-semibold sm:text-3xl">
            Inside Our Showroom & Workshop
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settings.showroomImages.map((key, index) => (
              <div key={key} className="overflow-hidden rounded-xl border border-border">
                { }
                <img
                  src={mediaUrl(key) ?? ""}
                  alt={`${settings.shopName} — showroom and workshop photo ${index + 1}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
